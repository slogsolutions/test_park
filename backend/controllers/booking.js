// backend/controllers/booking.js
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';
import ParkFinderSecondUser from '../models/User.js';

// Helper function for sending notifications (placeholder)
const sendNotification = (email, subject, message) => {
  console.log(`Notification sent to ${email}: ${subject} - ${message}`);
  // Implement your notification logic here (email, SMS, push, etc.)
};

// In-memory timers map (best-effort; not durable across restarts)
const bookingTimers = new Map();

// Mark booking completed helper
const markBookingCompleted = async (bookingId) => {
  try {
    const b = await Booking.findById(bookingId);
    if (!b) return;
    if (['completed', 'cancelled', 'rejected'].includes(b.status)) return;

    b.status = 'completed';
    b.completedAt = new Date();
    await b.save();

    if (bookingTimers.has(bookingId.toString())) {
      clearTimeout(bookingTimers.get(bookingId.toString()));
      bookingTimers.delete(bookingId.toString());
    }
    console.log(`Booking ${bookingId} auto-marked as completed`);
  } catch (err) {
    console.error('markBookingCompleted error', err);
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
 * Create booking
 */
// backend/controllers/booking.js
export const createBooking = async (req, res) => {
  try {
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
      providerId: providerId,     // assign owner as provider
      status: 'accepted',         // auto-accept so payment can be made immediately
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

    // notify provider (best-effort)
    try {
      const provider = await ParkFinderSecondUser.findById(providerId);
      if (provider && provider.email) {
        sendNotification(provider.email, 'New Booking Accepted', `A booking for your space (${parkingSpaceId}) has been created and is awaiting payment.`);
      }
    } catch (err) {
      console.warn('Warning: notify provider failed', err);
    }

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
    const booking = await Booking.findById(req.params.id).populate('parkingSpace');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    if (
      parkingSpace.owner.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
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

    // Set expiry (10 minutes from now)
    const expiresInMs = 10 * 60 * 1000;
    booking.otp = otp;
    booking.otpExpires = new Date(Date.now() + expiresInMs);
    booking.otpVerified = false;

    await booking.save();

    return res.status(200).json({
      otp,
      expiresAt: booking.otpExpires,
      bookingId: booking._id
    });
  } catch (error) {
    console.error('generateOTP error', error);
    return res.status(500).json({ message: 'Failed to generate OTP', error: error.message });
  }
};

/**
 * Verify OTP (provider triggers; booking must be accepted first)
 * On success: marks booking confirmed, sets startedAt and sessionEndAt, schedules completion
//  */
// export const verifyOTP = async (req, res) => {
//   try {
//     const bookingId = req.params.id;
//     const { otp } = req.body;
//     const providerId = req.user._id;

//     if (!otp) {
//       return res.status(400).json({ message: 'OTP is required' });
//     }

//     const booking = await Booking.findById(bookingId).populate('parkingSpace');
//     if (!booking) {
//       return res.status(404).json({ message: 'Booking not found' });
//     }

//     // Only the provider can verify this OTP (if providerId exists)
//     if (booking.providerId && booking.providerId.toString() !== providerId.toString()) {
//       return res.status(403).json({ message: 'Not authorized to verify OTP for this booking' });
//     }

//     // Check booking must be accepted by provider first
//     if (booking.status !== 'accepted') {
//       return res.status(400).json({ message: 'Booking must be accepted to verify OTP' });
//     }

//     // Check OTP presence and expiry
//     if (!booking.otp || !booking.otpExpires || new Date() > booking.otpExpires) {
//       return res.status(400).json({ message: 'OTP expired or not generated' });
//     }

//     if (booking.otp !== otp.toString()) {
//       return res.status(400).json({ message: 'Invalid OTP' });
//     }

//     // OTP valid -> mark booking confirmed and set startedAt
//     booking.status = 'confirmed';
//     booking.otpVerified = true;
//     booking.startedAt = new Date();

//     // Calculate session duration based on booking start/end times (fallback to 1 hour)
//     let sessionMs = 0;
//     if (booking.startTime && booking.endTime) {
//       sessionMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
//       if (sessionMs <= 0) sessionMs = 60 * 60 * 1000;
//     } else {
//       sessionMs = 60 * 60 * 1000;
//     }

//     booking.sessionEndAt = new Date(booking.startedAt.getTime() + sessionMs);

//     // Clear OTP fields
//     booking.otp = null;
//     booking.otpExpires = null;

//     await booking.save();

//     // Schedule an in-memory timer (best-effort). Will not survive a process restart.
//     const msUntilEnd = booking.sessionEndAt.getTime() - Date.now();
//     if (msUntilEnd > 0) {
//       const timer = setTimeout(() => {
//         markBookingCompleted(booking._id).catch(err => console.error(err));
//       }, msUntilEnd);
//       bookingTimers.set(booking._id.toString(), timer);
//     } else {
//       // Already passed -> mark completed immediately
//       await markBookingCompleted(booking._id);
//     }

//     console.log(`OTP verified for booking ${bookingId}, parking session started`);

//     return res.status(200).json({
//       message: 'OTP verified successfully, parking session started',
//       booking
//     });
//   } catch (error) {
//     console.error('verifyOTP error', error);
//     return res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
//   }
// };


// backend/controllers/booking.js
// Replace current verifyOTP with this:
export const verifyOTP = async (req, res) => {
  try {
    const bookingId = req.params.id;
    let { otp } = req.body;
    const providerId = req.user._id;

    if (!otp && otp !== 0) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    otp = otp.toString().trim();

    const booking = await Booking.findById(bookingId)
      .populate({ path: 'parkingSpace', populate: { path: 'owner', select: '_id name email' } })
      .populate('user', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Authorization: providerId OR parkingSpace.owner fallback
    let isAuthorized = false;
    if (booking.providerId) {
      isAuthorized = booking.providerId.toString() === providerId.toString();
    } else if (booking.parkingSpace && booking.parkingSpace.owner) {
      isAuthorized = booking.parkingSpace.owner._id.toString() === providerId.toString();
    }
    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized to verify OTP for this booking' });

    // allow accepted or confirmed
    if (!['accepted', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Booking must be accepted or confirmed to verify OTP' });
    }

    if (!booking.otp || !booking.otpExpires) return res.status(400).json({ message: 'OTP not generated for this booking' });

    if (new Date(booking.otpExpires) < new Date()) return res.status(400).json({ message: 'OTP expired' });

    if (booking.otp.toString().trim() !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // OTP ok -> start session
    booking.status = 'active';
    booking.otpVerified = true;
    booking.startedAt = new Date();
    let sessionMs = 60 * 60 * 1000;
    if (booking.startTime && booking.endTime) {
      sessionMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
      if (sessionMs <= 0) sessionMs = 60 * 60 * 1000;
    }
    booking.sessionEndAt = new Date(booking.startedAt.getTime() + sessionMs);

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
  } catch (err) {
    console.error('verifyOTP error', err);
    return res.status(500).json({ message: 'Failed to verify OTP', error: err.message });
  }
};
