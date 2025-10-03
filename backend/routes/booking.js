// backend/routes/booking.js

import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getBookingById,
  deleteById,
  getProviderBookings,
  generateOTP,
  verifyOTP,
  verifySecondOtp
} from '../controllers/booking.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Booking CRUD & listing
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/provider-bookings', protect, getProviderBookings);

// OTP endpoints
router.post('/:id/generate-otp', protect, generateOTP);
router.post('/:id/verify-otp', protect, verifyOTP);
router.post('/:id/verify-second-otp', protect, verifySecondOtp);

// Status route
router.put('/:id/status', protect, updateBookingStatus);

// Single booking, delete
router.get('/:id', protect, getBookingById);
router.delete('/:bookingId', protect, deleteById);

// Payment status update (existing)
router.put("/:id/update-payment-status", protect, async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.paymentStatus = paymentStatus;
    await booking.save();

    res.status(200).json({ message: "Payment status updated successfully", booking });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/booking/:id/add-paid-amount
 * Body: { amount: <integer paise>, extendHours?: <integer> }
 *
 * - Adds `amount` (paise) to booking.paid_amount (initializes to 0 if absent).
 * - If extendHours provided (>0), extends booking.endTime by extendHours hours and increments booking.hours_extended.
 * - Returns the updated booking.
 *
 * Note: This endpoint does NOT rely on totalPrice.
 */
router.post('/:id/add-paid-amount', protect, async (req, res) => {
  const { id } = req.params;
  const { amount, extendHours } = req.body;

  if (amount === undefined || amount === null) {
    return res.status(400).json({ message: "Missing 'amount' in request body (expected paise integer)" });
  }

  const amountInt = parseInt(amount, 10);
  if (Number.isNaN(amountInt) || amountInt <= 0) {
    return res.status(400).json({ message: "Invalid 'amount'. Expected positive integer (paise)." });
  }

  const extendInt = extendHours !== undefined && extendHours !== null ? parseInt(extendHours, 10) : 0;
  if (extendHours !== undefined && (Number.isNaN(extendInt) || extendInt < 0)) {
    return res.status(400).json({ message: "Invalid 'extendHours'. Expected non-negative integer." });
  }

  try {
    // Fetch booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Initialize fields if missing
    if (typeof booking.paid_amount !== 'number') booking.paid_amount = 0;
    if (typeof booking.hours_extended !== 'number') booking.hours_extended = 0;

    // Add paid amount
    booking.paid_amount = (booking.paid_amount ?? 0) + amountInt;

    // If extend requested, extend endTime and increment hours_extended
    if (extendInt > 0) {
      // Determine base end time. If invalid, use current time as base.
      let baseEndTs = Date.now();
      if (booking.endTime) {
        const parsed = new Date(booking.endTime).getTime();
        if (!Number.isNaN(parsed)) baseEndTs = parsed;
      }
      const newEndTs = baseEndTs + extendInt * 60 * 60 * 1000;
      booking.endTime = new Date(newEndTs).toISOString();
      booking.hours_extended = (booking.hours_extended ?? 0) + extendInt;
    }

    // Save changes
    await booking.save();

    return res.status(200).json({ message: "Paid amount (and extension if requested) applied", booking });
  } catch (error) {
    console.error("Error in add-paid-amount:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * POST /api/booking/:id/extend
 * Query or body: ?hours=1  OR  { hours: 1 }
 *
 * - Extends booking.endTime by `hours` (default 1 if not provided / invalid).
 * - Increments booking.hours_extended by `hours`.
 * - Returns updated booking.
 */
router.post('/:id/extend', protect, async (req, res) => {
  const { id } = req.params;
  // hours can come from query or body
  const rawHours = req.query.hours ?? req.body.hours ?? 1;
  const hoursInt = parseInt(rawHours, 10);

  if (Number.isNaN(hoursInt) || hoursInt <= 0) {
    return res.status(400).json({ message: "Invalid 'hours'. Expected positive integer." });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Initialize hours_extended if missing
    if (typeof booking.hours_extended !== 'number') booking.hours_extended = 0;

    // Determine base end time. If invalid, use current time as base.
    let baseEndTs = Date.now();
    if (booking.endTime) {
      const parsed = new Date(booking.endTime).getTime();
      if (!Number.isNaN(parsed)) baseEndTs = parsed;
    }

    const newEndTs = baseEndTs + hoursInt * 60 * 60 * 1000;
    booking.endTime = new Date(newEndTs).toISOString();
    booking.hours_extended = (booking.hours_extended ?? 0) + hoursInt;

    await booking.save();

    return res.status(200).json({ message: `Booking extended by ${hoursInt} hour(s)`, booking });
  } catch (error) {
    console.error("Error in extend endpoint:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Vehicle routes kept as-is in original file (if needed)
router.post('/add-vehicle', protect, async (req, res) => {
  const { make, model, year, licensePlate, chassisNumber, registrationDate } = req.body;

  if (!make || !model || !year || !licensePlate) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.vehicles.push({ make, model, year, licensePlate, chassisNumber, registrationDate });
    await user.save();

    res.status(200).json({ message: 'Vehicle added successfully!', vehicles: user.vehicles });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.get('/data/vehicles', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.vehicles || []);
  } catch (error) {
    console.error('Error fetching vehicles:', error.message);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.delete('/data/vehicles/:vehicleId', protect, async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const vehicleIndex = user.vehicles.findIndex(vehicle => vehicle._id.toString() === vehicleId);
    if (vehicleIndex === -1) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    user.vehicles.splice(vehicleIndex, 1);
    await user.save();

    res.status(200).json({ message: 'Vehicle deleted successfully!' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;
