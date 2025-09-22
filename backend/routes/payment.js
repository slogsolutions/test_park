import express   from 'express';
import Razorpay from 'razorpay';
import { protect } from '../middleware/auth.js';
const router = express.Router();
import Booking from '../models/Booking.js';
import crypto from 'crypto'; 
// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_eQoJ7XZxUf37D7',   // Replace with your Razorpay Key ID
  key_secret: 'BGzT1IIBANjZukY8LR9Pmjyy',  // Replace with your Razorpay Key Secret
});

// Payment initiation route
router.post('/initiate-payment',protect, async (req, res) => {
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



router.post('/verify-payment', protect, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  console.log("Verify Payment Request Data:", req.body);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  try {
    // Generate the signature to verify
    const generatedSignature = crypto
      .createHmac('sha256', 'BGzT1IIBANjZukY8LR9Pmjyy') // Use Razorpay key_secret
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log("Generated Signature:", generatedSignature);

    if (generatedSignature === razorpay_signature) {
      // Update booking payment status
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { paymentStatus: 'paid' }, // Change to 'paid' to match schema
        { new: true } // Return the updated document
      );

      if (!updatedBooking) {
        console.log("Booking not found for ID:", bookingId);
        return res.status(404).json({ error: 'Booking not found' });
      }

      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      console.log("Signature mismatch:", { generatedSignature, receivedSignature: razorpay_signature });
      return res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error("Error in verify-payment route:", error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
});

  export default router;