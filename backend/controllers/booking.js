// backend/controllers/booking.js
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';
import ParkFinderSecondUser from '../models/User.js';
import UserToken from '../models/UserToken.js';
import NotificationService from '../service/NotificationService.js'; // wrapper for firebase-admin (if in use)

// Helper function for sending notifications (placeholder)
const sendNotification = (email, subject, message) => {
  console.log(`Notification sent to ${email}: ${subject} - ${message}`);
  // Implement your actual notification logic here (email, SMS, push, etc.)
};

// In-memory timers map (best-effort; not durable across restarts)
const bookingTimers = new Map();

// Mark booking completed helper
const markBookingCompleted = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;

    if (['completed', 'cancelled', 'rejected'].includes(booking.status)) {
      return;
    }

    // Your current behavior: delete booking when session ends
    await Booking.findByIdAndDelete(bookingId);

    if (bookingTimers.has(bookingId.toString())) {
      clearTimeout(bookingTimers.get(bookingId.toString()));
      bookingTimers.delete(bookingId.toString());
    }

    console.log(`Booking ${bookingId} auto-deleted as session ended`);
  } catch (err) {
    console.error('markBookingCompleted error:', err);
  }
};

// Periodic cleanup to ensure overdue bookings are completed (survives restarts)
const cleanupOverdueBookings = async () => {
  try {
    const now = new Date();
    const overdue = await Booking.find({
      sessionEndAt: { $lte: now },
      status: { $in: ['confirmed', 'active'] },
    });

    for (const b of overdue) {
      b.status = 'completed';
      b.completedAt = now;
      await b.save();
      console.log(`Cleanup: marked booking ${b._id} completed`);
    }
  } catch (err) {
    console.error('cleanupOverdueBookings error', err);
  }
};

// Run cleanup every minute
setInterval(cleanupOverdueBookings, 60 * 1000);
// Run once immediately
cleanupOverdueBookings().catch((e) => console.error(e));

/**
 * Create booking (keeps your existing behavior)
 */
export const createBooking = async (req, res) => {
  try {
    console.log("req recieved in /createBooking");
    const { parkingSpaceId, startTime, endTime, vehicleNumber, vehicleType, vehicleModel, contactNumber, chassisNumber } = req.body;

    // find parking space
    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    const { pricePerHour, availability, owner: providerId } = parkingSpace;

    if (!startTime || !endTime || !pricePerHour) {
      return res.status(400).json({ message: "Invalid data for price calculation" });
    }

    // check availability
    const requestedStart = new Date(startTime);
    const requestedEnd = new Date(endTime);
    const isSlotBooked = (availability || []).some(dateObj => {
      return (dateObj.slots || []).some(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const overlap =
          (requestedStart >= slotStart && requestedStart < slotEnd) ||
          (requestedEnd > slotStart && requestedEnd <= slotEnd) ||
          (requestedStart <= slotStart && requestedEnd >= slotEnd);
        return overlap && slot.isBooked;
      });
    });

    if (isSlotBooked) {
      return res.status(400).json({ message: 'Selected time slot is already booked' });
    }

    // calculate total price
    const durationHours = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
    const totalPrice = durationHours * pricePerHour;

    // create booking: auto-accept and assign providerId so buyer can pay immediately
    const booking = new Booking({
      user: req.user._id,
      parkingSpace: parkingSpaceId,
      startTime,
      endTime,
      totalPrice,
      pricePerHour,
      vehicleNumber,
      vehicleType,
      vehicleModel,
      contactNumber,
      chassisNumber,
      providerId: providerId,
      status: 'accepted',
      paymentStatus: 'pending'
    });

    await booking.save();

    // mark availability slot as booked (best-effort)
    try {
      const startDateMidnight = new Date(startTime);
      startDateMidnight.setHours(0, 0, 0, 0);

      await ParkingSpace.findByIdAndUpdate(
        parkingSpaceId,
        {
          $set: { 'availability.$[dateElem].slots.$[slotElem].isBooked': true }
        },
        {
          arrayFilters: [
            { 'dateElem.date': { $eq: startDateMidnight } },
            { 'slotElem.startTime': new Date(startTime), 'slotElem.endTime': new Date(endTime) }
          ],
          new: true
        }
      );
    } catch (err) {
      console.warn('Warning: failed to mark availability slot (nonfatal)', err);
    }

    // ---------- Notifications: send to booking user & provider (simplified) ----------
    const getTokensByUserId = async (id) => {
      if (!id) return [];
      const docs = await UserToken.find({ userId: id }).select('token -_id');
      return docs.map(d => d.token);
    };

    const bookingDeepLink = `myapp://booking/${booking._id}`;
    const userTitle = 'Booking Confirmed';
    const userBody = `Your booking (${booking._id}) is confirmed for ${new Date(startTime).toLocaleString()}.`;

    const providerTitle = 'New Booking Received';
    const providerBody = `You have a new booking for your space (${parkingSpace.title || parkingSpaceId}) on ${new Date(startTime).toLocaleString()}.`;

    // Send to booking user
    (async () => {
      try {
        const userTokens = await getTokensByUserId(req.user._id);
        if (userTokens && userTokens.length > 0) {
          if (userTokens.length === 1) {
            await NotificationService.sendToDevice(userTokens[0], userTitle, userBody, { type: 'booking', bookingId: String(booking._id) });
          } else {
            // send to multiple devices, but don't inspect the multicast response
            await NotificationService.sendToMultiple(userTokens, userTitle, userBody, { type: 'booking', bookingId: String(booking._id) });
          }
        } else {
          console.info('No user tokens found for booking user', req.user._id);
        }
      } catch (err) {
        console.warn('Failed to send notification to booking user:', err);
      }
    })();

    // Send to provider
    (async () => {
      try {
        const providerTokens = await getTokensByUserId(providerId);
        if (providerTokens && providerTokens.length > 0) {
          if (providerTokens.length === 1) {
            await NotificationService.sendToDevice(providerTokens[0], providerTitle, providerBody, { type: 'booking', bookingId: String(booking._id) });
          } else {
            // send to multiple devices, but don't inspect the multicast response
            await NotificationService.sendToMultiple(providerTokens, providerTitle, providerBody, { type: 'booking', bookingId: String(booking._id) });
          }
        } else {
          console.info('No provider tokens found for provider', providerId);
        }
      } catch (err) {
        console.warn('Failed to send notification to provider:', err);
      }
    })();

    // optionally: send email to provider (best-effort)
    try {
      const provider = await ParkFinderSecondUser.findById(providerId);
      if (provider && provider.email) {
        sendNotification(provider.email, 'New Booking Accepted', `A booking for your space (${parkingSpaceId}) has been created and is awaiting payment.`);
      }
    } catch (err) {
      console.warn('Warning: notify provider email failed', err);
    }

    // return booking
    return res.status(201).json({ message: 'Booking created and auto-accepted; proceed to payment', booking });
  } catch (error) {
    console.error('createBooking error', error);
    return res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
};

/**
 * Get bookings for current user
 */
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parkingSpace')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to get bookings', e: error });
  }
};

/**
 * Update booking status (accept/reject etc.)
 * Also sets providerId when accepted.
 */
export const updateBookingStatus = async (req, res) => {
  try {
    console.log("Received PUT request at:", req.originalUrl);
    const { status } = req.body;
    const bookingId = req.params.id;

    const allowedStatuses = ['pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      console.log("invalid status");
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(bookingId);
    console.log('Found booking:', booking);

    if (!booking) {
      console.log("no booking found");
      return res.status(404).json({ message: 'Booking not found' });
    }

    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    if (!parkingSpace) {
      console.log("no Parking space found");
      return res.status(404).json({ message: 'Parking space not found' });
    }

    const isOwner = parkingSpace.owner.toString() === req.user._id.toString();
    const isBookingUser = booking.user.toString() === req.user._id.toString();

    if (!isOwner && !isBookingUser) {
      console.log("not authorized to update status");
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    if (booking.status === status) {
      return res.status(200).json({ message: 'Status unchanged', booking });
    }

    booking.status = status;

    // If provider accepts, record providerId so only that provider can verify OTP later
    if (status === 'accepted') {
      booking.providerId = req.user._id;
    }

    // If booking is manually marked completed, set completedAt
    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    await booking.save();

    // If rejecting or cancelling, free the slot
    if (['rejected', 'cancelled'].includes(status)) {
      try {
        const startDateMidnight = new Date(booking.startTime);
        startDateMidnight.setHours(0, 0, 0, 0);

        const startTime = new Date(booking.startTime);
        const endTime = new Date(booking.endTime);

        const updatedParkingSpace = await ParkingSpace.findByIdAndUpdate(
          parkingSpace._id,
          {
            $set: {
              'availability.$[dateElem].slots.$[slotElem].isBooked': false,
            },
          },
          {
            arrayFilters: [
              { 'dateElem.date': { $eq: startDateMidnight } },
              { 'slotElem.startTime': startTime, 'slotElem.endTime': endTime },
            ],
            new: true,
          }
        );

        if (!updatedParkingSpace) {
          console.warn('Failed to update parking space availability for booking', bookingId);
        } else {
          console.log('Freed slot for booking:', bookingId);
        }
      } catch (err) {
        console.error('Error freeing parking slot after rejection/cancel:', err);
      }
    }

    const freshBooking = await Booking.findById(booking._id).populate('parkingSpace').populate('user', 'name email');
    res.status(200).json({
      message: 'Booking status updated successfully',
      booking: freshBooking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status', error: error.message });
  }
};

/**
 * Get booking by id (with auth)
 */
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('parkingSpace')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    const isOwner = parkingSpace && parkingSpace.owner && 
                   parkingSpace.owner.toString() === req.user._id.toString();
    const isBuyer = booking.user && booking.user._id.toString() === req.user._id.toString();

    if (!isOwner && !isBuyer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Hide secondOtp from providers - only buyer should see it
    const bookingData = booking.toObject();
    if (isOwner && !isBuyer) {
      delete bookingData.secondOtp;
      delete bookingData.secondOtpExpires;
    }

    res.json(bookingData);
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ message: 'Failed to get booking' });
  }
};

/**
 * Delete booking by id
 */
export const deleteById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    await Booking.findByIdAndDelete(bookingId);
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking', error });
  }
};

/**
 * Get bookings for provider (owner of parking space)
 */
export const getProviderBookings = async (req, res) => {
  console.log("inside provider booking");
  try {
    const providerId = req.user._id;
    console.log('Provider ID:', providerId);

    const providerIdObject = new mongoose.Types.ObjectId(providerId);
    const parkingSpaces = await ParkingSpace.find({ owner: providerIdObject });
    console.log('Parking Spaces:', parkingSpaces);

    if (!parkingSpaces.length) {
      return res.status(200).json([]);
    }

    const parkingSpaceIds = parkingSpaces.map(space => space._id);
    const bookings = await Booking.find({ parkingSpace: { $in: parkingSpaceIds } })
      .populate('user', 'name email contactNumber')
      .populate('parkingSpace', 'name location pricePerHour')
      .select('-__v');

    console.log('Bookings:', bookings);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error });
  }
};

/**
 * Generate OTP (buyer triggers this after booking payment)
 *
 * Behavior:
 * - If booking.status is NOT 'active' => generate booking.otp (used to START session)
 * - If booking.status IS 'active' => generate booking.secondOtp (used to END/COMPLETE session)
 */
export const generateOTP = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Ensure only booking owner can generate OTP
    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to generate OTP for this booking' });
    }

    // Only for paid bookings
    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'OTP can be generated only for paid bookings' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresInMs = 10 * 60 * 1000; // 10 minutes

    if (booking.status === 'active') {
      // If session is active, generate second OTP for completion
      booking.secondOtp = otp;
      booking.secondOtpExpires = new Date(Date.now() + expiresInMs);
      await booking.save();

      return res.status(200).json({
        otp,
        expiresAt: booking.secondOtpExpires,
        bookingId: booking._id,
        type: 'second'
      });
    } else {
      // Generate primary OTP to start session
      booking.otp = otp;
      booking.otpExpires = new Date(Date.now() + expiresInMs);
      booking.otpVerified = false;
      await booking.save();

      return res.status(200).json({
        otp,
        expiresAt: booking.otpExpires,
        bookingId: booking._id,
        type: 'primary'
      });
    }
  } catch (error) {
    console.error('generateOTP error', error);
    return res.status(500).json({ message: 'Failed to generate OTP', error: error.message });
  }
};

/**
 * Verify OTP (provider triggers for starting the session).
 * Backwards-compatible: if booking.otp was used for completion in older flows, verifyOTP will also allow completing when booking.status === 'active'.
 *
 * This function:
 * - Validates provider authorization
 * - Validates OTP presence & expiry against booking.otp
 * - If booking is 'accepted' or 'confirmed' => starts session (status -> active)
 * - If booking is 'active' and booking.otp matches => completes session (status -> completed) [backward compatibility]
 */
export const verifyOTP = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let { otp } = req.body;
    const providerId = req.user._id;

    if (otp === undefined || otp === null) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    otp = otp.toString().trim();

    const booking = await Booking.findById(bookingId)
      .populate({ path: 'parkingSpace', populate: { path: 'owner', select: '_id name email' } })
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Authorization check
    let isAuthorized = false;
    if (booking.providerId) {
      isAuthorized = booking.providerId.toString() === providerId.toString();
    } else if (booking.parkingSpace && booking.parkingSpace.owner) {
      isAuthorized = booking.parkingSpace.owner._id.toString() === providerId.toString();
    }
    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    // Ensure OTP was generated for primary OTP
    if (!booking.otp || !booking.otpExpires) {
      return res.status(400).json({ message: 'OTP not generated for this booking' });
    }

    // Check expiry
    if (new Date(booking.otpExpires) < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Compare OTP
    if (booking.otp.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // If booking is accepted/confirmed -> this OTP starts the session
    if (['accepted', 'confirmed'].includes(booking.status)) {
      booking.status = 'active';
      booking.otpVerified = true;
      booking.startedAt = new Date();

      // Calculate session duration (prefer booking.startTime/endTime)
      let sessionMs = 60 * 60 * 1000; // default 1 hour
      if (booking.startTime && booking.endTime) {
        sessionMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
        if (sessionMs <= 0) sessionMs = 60 * 60 * 1000;
      }

      booking.sessionEndAt = new Date(booking.startedAt.getTime() + sessionMs);

      // Clear primary OTP fields (one-time use)
      booking.otp = null;
      booking.otpExpires = null;

      await booking.save();

      // schedule best-effort completion (in-memory)
      const msUntilEnd = booking.sessionEndAt.getTime() - Date.now();
      if (msUntilEnd > 0) {
        if (bookingTimers.has(booking._id.toString())) {
          clearTimeout(bookingTimers.get(booking._id.toString()));
          bookingTimers.delete(booking._id.toString());
        }
        const t = setTimeout(() => markBookingCompleted(booking._id).catch(console.error), msUntilEnd);
        bookingTimers.set(booking._id.toString(), t);
      } else {
        await markBookingCompleted(booking._id);
      }

      const populated = await Booking.findById(booking._id).populate('parkingSpace').populate('user', 'name email');
      return res.status(200).json({ message: 'OTP verified and session started', booking: populated });
    }

    // Backwards-compat: If booking is active -> this (primary) OTP may have been used for completion in older flows
    if (booking.status === 'active') {
      booking.status = 'completed';
      booking.completedAt = new Date();
      booking.sessionEndAt = booking.sessionEndAt && new Date(booking.sessionEndAt) > new Date()
        ? booking.sessionEndAt
        : new Date();

      booking.otp = null;
      booking.otpExpires = null;
      booking.otpVerified = true;

      await booking.save();

      if (bookingTimers.has(booking._id.toString())) {
        clearTimeout(bookingTimers.get(booking._id.toString()));
        bookingTimers.delete(booking._id.toString());
      }

      const populated = await Booking.findById(booking._id).populate('parkingSpace').populate('user', 'name email');
      return res.status(200).json({ message: 'OTP verified — booking completed', booking: populated });
    }

    // otherwise not allowed
    return res.status(400).json({ message: 'Booking must be accepted, confirmed or active to verify OTP' });
  } catch (err) {
    console.error('verifyOTP error:', err);
    return res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
};

/**
 * Verify SECOND OTP (provider triggers when booking is ACTIVE) -> completes the booking.
 *
 * This checks booking.secondOtp & booking.secondOtpExpires and marks booking completed.
 */
export const verifySecondOtp = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let { otp } = req.body;
    const providerId = req.user._id;

    if (otp === undefined || otp === null) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    otp = otp.toString().trim();

    const booking = await Booking.findById(bookingId)
      .populate({ path: 'parkingSpace', populate: { path: 'owner', select: '_id name email' } })
      .populate('user', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Authorization check
    let isAuthorized = false;
    if (booking.providerId) {
      isAuthorized = booking.providerId.toString() === providerId.toString();
    } else if (booking.parkingSpace && booking.parkingSpace.owner) {
      isAuthorized = booking.parkingSpace.owner._id.toString() === providerId.toString();
    }
    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized to verify OTP for this booking' });

    // Only allow completion when booking is active
    if (booking.status !== 'active') {
      return res.status(400).json({ message: 'Booking must be active to verify second OTP' });
    }

    // Ensure second OTP exists
    if (!booking.secondOtp || !booking.secondOtpExpires) {
      return res.status(400).json({ message: 'Second OTP not generated for this booking' });
    }

    // Check expiry
    if (new Date(booking.secondOtpExpires) < new Date()) {
      return res.status(400).json({ message: 'Second OTP expired' });
    }

    // Compare
    if (booking.secondOtp.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP valid -> complete booking
    booking.status = 'completed';
    booking.completedAt = new Date();

    // Clear second OTP fields
    booking.secondOtp = null;
    booking.secondOtpExpires = null;
    booking.otpVerified = true;

    await booking.save();

    // clear any in-memory timer
    try {
      if (bookingTimers && bookingTimers.has(booking._id.toString())) {
        clearTimeout(bookingTimers.get(booking._id.toString()));
        bookingTimers.delete(booking._id.toString());
      }
    } catch (e) {
      console.warn('Failed to clear booking timer after completion', e);
    }

    const populated = await Booking.findById(booking._id).populate('parkingSpace').populate('user', 'name email');

    return res.status(200).json({ message: 'Second OTP verified and booking completed', booking: populated });
  } catch (err) {
    console.error('verifySecondOtp error', err);
    return res.status(500).json({ message: 'Failed to verify second OTP', error: err.message });
  }
};
