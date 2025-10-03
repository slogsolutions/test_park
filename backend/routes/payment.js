// backend/routes/payment.js
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import Booking from '../models/Booking.js';

const router = express.Router();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_eQoJ7XZxUf37D7';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'BGzT1IIBANjZukY8LR9Pmjyy';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * normalizeToPaise
 * - If opts.isPaise === true -> treat incoming value as integer paise (round and return)
 * - Otherwise (isPaise === false or undefined) -> treat incoming value as rupees and convert to paise (multiply by 100)
 *
 * NOTE: We intentionally do NOT attempt heuristic guessing. The frontend should pass isPaise=true when sending paise.
 */
function normalizeToPaise(amount, opts = { isPaise: undefined }) {
  const parsed = Number(amount);
  if (Number.isNaN(parsed) || parsed <= 0) return null;

  if (opts.isPaise === true) {
    return Math.round(parsed); // already paise (integer)
  }

  // treat as rupees (default)
  // allow decimals (e.g. 45.5 -> 4550 paise)
  return Math.round(parsed * 100);
}

/**
 * POST /api/payment/initiate-payment
 * body: { bookingId, amount, isPaise? }
 *
 * amount: either rupees (e.g. 45 or 45.5) or paise (e.g. 4500) when isPaise === true
 */
router.post('/initiate-payment', protect, async (req, res) => {
  try {
    const { bookingId, amount, isPaise } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId required' });
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ success: false, message: 'amount required' });
    }

    const amountPaise = normalizeToPaise(amount, { isPaise });
    if (!amountPaise || !Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount (could not normalize to paise)' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const shortBooking = String(bookingId).slice(-8);
    const shortTs = Date.now().toString().slice(-6);
    const receipt = `r_${shortBooking}_${shortTs}`;

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1,
    };

    console.log('[initiate-payment] creating order', { bookingId, amountPaise, isPaise });
    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      receipt: order.receipt,
      bookingId,
    });
  } catch (err) {
    console.error('[initiate-payment] error', err);
    return res.status(500).json({ success: false, message: 'Failed to create order', error: err.message || err });
  }
});

/**
 * POST /api/payment/verify-payment
 * body: { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, extend?, isPaise? }
 *
 * Behavior:
 *  - verify signature
 *  - fetch payment to obtain captured amount (preferred)
 *  - increment booking.totalPrice by paid amount (in rupees)
 *  - set booking.paymentStatus = 'paid'
 *  - if extend true => extend endTime by 1 hour, generate secondOtp and secondOtpExpires and return it
 */
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, extend } = req.body;
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing required verification fields' });
    }

    // verify signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.warn('[verify-payment] signature mismatch', { generatedSignature, razorpay_signature });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // fetch payment (preferred) to get exact captured amount
    let paidPaise = null;
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      paidPaise = Number(payment.amount); // paise
      console.log('[verify-payment] payment fetched', { paymentId: razorpay_payment_id, paidPaise, captured: payment.captured });
    } catch (errFetch) {
      console.warn('[verify-payment] payment fetch failed', errFetch);
      // fallback to fetching order if necessary (less preferred)
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        // The order.amount is the order's total amount; payment may be different — but use fallback if needed
        paidPaise = Number(order.amount);
        console.log('[verify-payment] fallback using order.amount', { orderId: razorpay_order_id, paidPaise });
      } catch (errOrder) {
        console.error('[verify-payment] order fetch fallback failed', errOrder);
      }
    }

    if (!paidPaise || isNaN(paidPaise) || paidPaise <= 0) {
      return res.status(400).json({ success: false, message: 'Unable to determine paid amount from Razorpay' });
    }

    const paidRupees = Number((paidPaise / 100.0).toFixed(2)); // rupees with two decimals

    // update booking safely (increment)
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const previousTotal = Number(booking.totalPrice || 0);
    booking.totalPrice = Number((previousTotal + paidRupees).toFixed(2)); // store with two decimals
    booking.paymentStatus = 'paid';

    // if extension: extend endTime by 1 hour and generate secondOtp
    let generatedOtp = null;
    if (extend === true || extend === 'true' || extend === 1) {
      const currentEndTs = booking.endTime ? new Date(booking.endTime).getTime() : Date.now();
      const baseTs = isNaN(currentEndTs) ? Date.now() : currentEndTs;
      booking.endTime = new Date(baseTs + 60 * 60 * 1000);
      generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      booking.secondOtp = generatedOtp;
      booking.secondOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    }

    await booking.save();

    const populated = await Booking.findById(booking._id).populate('parkingSpace').populate('user', 'name email');

    console.log('[verify-payment] done', {
      bookingId,
      paidPaise,
      paidRupees,
      previousTotal,
      newTotal: booking.totalPrice,
      extend: !!extend,
      generatedOtp: !!generatedOtp
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and booking updated',
      booking: populated,
      paidAmount: paidRupees,
      previousTotal,
      newTotal: booking.totalPrice,
      otp: generatedOtp ? { otp: generatedOtp, expiresAt: booking.secondOtpExpires } : null
    });
  } catch (err) {
    console.error('[verify-payment] error', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: err.message || err });
  }
});

export default router;
