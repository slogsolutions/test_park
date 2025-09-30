// backend/cronjob.js
import express from 'express';
import Razorpay from 'razorpay';
import { protect } from './middleware/auth.js';
const router = express.Router();
import Booking from './models/Booking.js';
import ParkingSpace from './models/ParkingSpace.js';
import crypto from 'crypto';
import cron from 'node-cron';

// Initialize Razorpay with your credentials (kept as in your file)
const razorpay = new Razorpay({
  key_id: 'rzp_test_eQoJ7XZxUf37D7',   // Replace with your Razorpay Key ID or set env
  key_secret: 'BGzT1IIBANjZukY8LR9Pmjyy',  // Replace with your Razorpay Key Secret or set env
});

// --- Payment initiation route (unchanged) ---
router.post('/initiate-payment', protect, async (req, res) => {
  const { bookingId, amount } = req.body;

  console.log("this is data for intial payment");

  if (!bookingId || !amount) {
    console.log('no booking id and no ammount');
    return res.status(400).json({ error: 'Booking ID and amount are required' });
  }

  try {
    const options = {
      amount: amount * 100, // Convert amount to smallest currency unit (e.g., paise)
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

// --- Verify payment route (unchanged logic) ---
router.post('/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  console.log("Verify Payment Request Data:", req.body);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  try {
    // Generate the signature to verify using your razorpay key_secret
    const generatedSignature = crypto
      .createHmac('sha256', 'BGzT1IIBANjZukY8LR9Pmjyy') // Use Razorpay key_secret
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

    // Optionally emit an event or websocket notification here to update frontend maps/lists
    try {
      const io = req.app && req.app.get && req.app.get('io');
      if (io) {
        io.emit('parking-updated', {
          parkingId: updatedParking._id.toString(),
          availableSpots: updatedParking.availableSpots
        });

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

/**
 * startBookingCompletionCron
 *
 * Runs every minute and:
 *  - finds bookings that have ended (endTime <= now) and were occupying spots (status 'confirmed', paymentStatus 'paid')
 *  - marks them completed
 *  - increments ParkingSpace.availableSpots safely (clamped by totalSpots if present)
 *  - emits socket events 'parking-released' and per-user 'booking-completed'
 *
 * Exported as a named function so your index.js can import and run it on server start.
 */
export function startBookingCompletionCron() {
  // schedule and return the task so index.js (or tests) can keep reference if needed
  const task = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      console.log(`[cron] running release job at ${now.toISOString()}`);

      const finishedBookings = await Booking.find({
        endTime: { $lte: now },
        status: { $in: ['confirmed'] },
        paymentStatus: 'paid'
      }).limit(200);

      if (!finishedBookings || finishedBookings.length === 0) {
        return;
      }

      console.log(`[cron] found ${finishedBookings.length} finished booking(s) to process`);

      for (const booking of finishedBookings) {
        try {
          // mark booking completed
          booking.status = 'completed';
          booking.completedAt = new Date();
          if (!booking.endedAt) booking.endedAt = booking.completedAt;
          await booking.save();

          // increment parking.availableSpots safely
          const parkingId = booking.parkingSpace;
          if (!parkingId) {
            console.warn(`[cron] booking ${booking._id} missing parkingSpace reference`);
            continue;
          }

          const parking = await ParkingSpace.findById(parkingId);
          if (!parking) {
            console.warn(`[cron] parking ${parkingId} not found for booking ${booking._id}`);
            continue;
          }

          const current = typeof parking.availableSpots === 'number' ? parking.availableSpots : 0;
          const total = typeof parking.totalSpots === 'number' && parking.totalSpots > 0 ? parking.totalSpots : null;
          let newAvailable = current + 1;
          if (total !== null) newAvailable = Math.min(newAvailable, total);

          if (newAvailable !== current) {
            parking.availableSpots = newAvailable;
            await parking.save();

            // emit socket events
            try {
              const io = global.io;
              if (io) {
                io.emit('parking-released', {
                  parkingId: parking._id.toString(),
                  availableSpots: parking.availableSpots
                });

                if (booking.user) {
                  io.to(booking.user.toString()).emit('booking-completed', { bookingId: booking._id.toString() });
                }
              } else {
                console.log('[cron] io not configured; skipping socket emit for parking release');
              }
            } catch (emitErr) {
              console.warn('[cron] socket emit error while releasing parking spot', emitErr);
            }
          } else {
            console.log(`[cron] parking ${parking._id} already at cap or no change required`);
          }
        } catch (innerErr) {
          console.error(`[cron] failed to process booking ${booking._id}:`, innerErr);
        }
      }
    } catch (err) {
      console.error('[cron] release job failed:', err);
    }
  }, {
    scheduled: true
  });

  return task;
}

export default router;
