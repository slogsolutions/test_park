// backend/routes/payment.js
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Prefer env vars; fallback to the test keys you had (safe for dev)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_eQoJ7XZxUf37D7';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'BGzT1IIBANjZukY8LR9Pmjyy';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payment/initiate-payment
 * body: { bookingId, amount }
 * `amount` may be rupees (decimal or integer) or paise (integer).
 * This endpoint normalizes to integer paise and creates a Razorpay order.
 */
router.post('/initiate-payment', protect, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    console.log('initiate-payment request', { bookingId, amount });

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ success: false, message: 'amount is required' });
    }

    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Normalize to integer paise
    // if (!Number.isInteger(parsed)) {
    //   // decimal -> rupees supplied, convert to paise
    //   amountPaise = Math.round(parsed));
    // } else {
    //   // integer -> ambiguous: choose heuristic:
    //   // if < 1000 assume rupees (e.g., 250 => 25000 paise), else assume paise (e.g., 25000)
    //   if (parsed < 1000) {
    //     amountPaise = parsed * 100;
    //   } else {
    //     amountPaise = parsed;
    //   }
    // }

    let amountPaise = Math.round(parsed); // always treat as rupees for simplicity
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Finalized amount invalid; must be positive integer (paise)' });
    }

    // verify booking exists (recommended)
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Build a short receipt id (must be <= 40 chars). Use last 8 chars of bookingId + short timestamp slice.
    // Example: r_89ab12cd_345678
    const shortBooking = String(bookingId).slice(-8);
    const shortTs = Date.now().toString().slice(-6);
    const receipt = `r_${shortBooking}_${shortTs}`; // guaranteed short

    const options = {
      amount: amountPaise, // integer paise
      currency: 'INR',
      receipt,
      payment_capture: 1, // auto capture
    };

    console.log('Creating razorpay order with options:', options);

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      bookingId,
    });
  } catch (err) {
    // Provide useful debug info while keeping response friendly
    console.error('Error in initiate-payment route:', err);
    const debug = err && err.error ? err.error : err.message || String(err);
    return res.status(500).json({ success: false, message: 'Failed to create Razorpay order', error: debug });
  }
});

/**
 * POST /api/payment/verify-payment
 * body: { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Verifies signature and marks booking paymentStatus = 'paid'
 */
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('verify-payment request', { bookingId, razorpay_order_id, razorpay_payment_id });

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log('generatedSignature:', generatedSignature, 'received:', razorpay_signature);

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // mark booking as paid
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.paymentStatus = 'paid';
    await booking.save();

    return res.status(200).json({ success: true, message: 'Payment verified', booking });
  } catch (err) {
    console.error('verify-payment error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: err.message || err });
  }
});

export default router;
