import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  updateBookingStatus,
  getBookingById,
  deleteById,
  getProviderBookings,
} from '../controllers/booking.js';
import User from '../models/User.js';
const router = express.Router();
import Razorpay from 'razorpay'
const razorpayInstance = new Razorpay({
  key_id: 'rzp_test_eQoJ7XZxUf37D7', // Replace with your Razorpay key
  key_secret: 'your_razorpay_key_secret', // Replace with your Razorpay secret
});

router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/provider-bookings', protect, getProviderBookings);
router.put('/:id/status', protect, updateBookingStatus);
router.get('/:id', protect, getBookingById);
router.delete('/:bookingId',protect,deleteById);





router.put("/:id/update-payment-status",protect, async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  try {
    // Find the booking by ID and update payment status
    const booking = await Booking.findById(id);
    console.log(booking);
    
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

// move it to user modal 
router.post('/add-vehicle',protect, async (req, res) => {
  const { make, model, year, licensePlate, chassisNumber, registrationDate } = req.body;
  
  if (!make || !model || !year || !licensePlate) {
    return res.status(400).json({ message: 'All required fields must be filled.' });
  }

  try {
    const user = await User.findById(req.user.id); // Assuming user is authenticated and req.user contains user ID

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
  console.log("Inside vehicles route"); // Debugging
  try {
    console.log('User ID from protect middleware:', req.user?.id); // Debugging

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found'); // Debugging
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Fetched vehicles:', user.vehicles); // Debugging
    res.status(200).json(user.vehicles || []);
  } catch (error) {
    console.error('Error fetching vehicles:', error.message); // Debugging
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.delete('/data/vehicles/:vehicleId', protect, async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const user = await User.findById(req.user.id); // Assuming req.user contains the logged-in user
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find the vehicle to be deleted and remove it
    const vehicleIndex = user.vehicles.findIndex(vehicle => vehicle._id.toString() === vehicleId);
    if (vehicleIndex === -1) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    // Remove the vehicle from the user's vehicles array
    user.vehicles.splice(vehicleIndex, 1);
    await user.save();

    res.status(200).json({ message: 'Vehicle deleted successfully!' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});


export default router;