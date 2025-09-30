import express from 'express';
import Razorpay from 'razorpay';
import { protect } from '../middleware/auth.js';
const router = express.Router();
import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';
import crypto from 'crypto';

// Initialize Razorpay with your credentials from env (do NOT hardcode in repo)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_eQoJ7XZxUf37D7',   // fallback to current test id if env not set
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'BGzT1IIBANjZukY8LR9Pmjyy',  // fallback to current test secret if env not set
});

// Payment initiation route
router.post('/initiate-payment', protect, async (req, res) => {
  const { bookingId, amount } = req.body;

  console.log("this is data for intial payment");

  if (!bookingId || !amount) {
    console.log('no booking id and no ammount');
    return res.status(400).json({ error: 'Booking ID and amount are required' });
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Convert amount to smallest currency unit (e.g., paise)
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error in initiate-payment route:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

router.post('/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  console.log("Verify Payment Request Data:", req.body);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  try {
    // Generate the signature to verify using your razorpay key_secret from env
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || 'BGzT1IIBANjZukY8LR9Pmjyy';
    const generatedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log("Generated Signature:", generatedSignature);

    if (generatedSignature !== razorpay_signature) {
      console.log("Signature mismatch:", { generatedSignature, receivedSignature: razorpay_signature });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Signature is valid — proceed to reserve a spot atomically and mark booking paid
    // 1) load booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("Booking not found for ID:", bookingId);
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If booking already paid, return success (avoid double-decrement)
    if (booking.paymentStatus === 'paid') {
      console.log('Booking already marked as paid:', bookingId);
      return res.status(200).json({ success: true, message: 'Payment already recorded for this booking', booking });
    }

    // booking should reference parkingSpace id (adjust field name if different)
    const parkingId = booking.parkingSpace;
    if (!parkingId) {
      console.warn('Booking does not reference a parkingSpace:', bookingId);
      return res.status(400).json({ error: 'Booking is missing parking space reference' });
    }

    // Atomically decrement availableSpots only if > 0 to avoid negative counts
    const updatedParking = await ParkingSpace.findOneAndUpdate(
      { _id: parkingId, availableSpots: { $gt: 0 } },
      { $inc: { availableSpots: -1 } },
      { new: true }
    );

    if (!updatedParking) {
      // No parking found or no spots left — payment was verified by Razorpay but we cannot reserve spot
      // Return 409 conflict so client can handle (refund/notify user)
      console.warn('Payment verified but no spot available to decrement for parking', parkingId);
      return res.status(409).json({ error: 'Payment verified but parking has no available spots. Please contact support.' });
    }

    // Successfully decremented parking.availableSpots -> now update booking to 'paid'
    booking.paymentStatus = 'paid';
    // Optionally change booking.status to 'confirmed' or similar if you track that.
    booking.status = booking.status || 'confirmed';
    // you can also set payment details on booking for bookkeeping
    booking.paymentDetails = booking.paymentDetails || {};
    booking.paymentDetails.razorpay_order_id = razorpay_order_id;
    booking.paymentDetails.razorpay_payment_id = razorpay_payment_id;
    booking.paymentDetails.razorpay_signature = razorpay_signature;
    booking.paymentDetails.paidAt = new Date();

    const savedBooking = await booking.save();

    // Emit socket events so frontend updates immediately (if io is attached to the app)
    try {
      const io = req.app && req.app.get && req.app.get('io');
      if (io) {
        io.emit('parking-updated', {
          parkingId: updatedParking._id.toString(),
          availableSpots: updatedParking.availableSpots
        });

        // If you use per-user rooms keyed by user id, emit confirmation to that room
        if (savedBooking.user) {
          io.to(savedBooking.user.toString()).emit('booking-confirmed', { bookingId: savedBooking._id.toString() });
        }
      }
    } catch (e) {
      console.warn('Socket emit failed in verify-payment:', e);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and spot reserved',
      booking: savedBooking,
      parking: updatedParking
    });

  } catch (error) {
    console.error("Error in verify-payment route:", error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

export default router;
