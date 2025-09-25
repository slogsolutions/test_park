// backend/models/Booking.js
import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkFinderSecondUser',
    required: true,
  },
  parkingSpace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkfindersecondParkingSpace',
    required: true,
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkFinderSecondUser',
    default: null,
  },
  pricePerHour: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  vehicleNumber: String,
  vehicleType: String,
  vehicleModel: String,
  contactNumber: String,
  chassisNumber: String,
  drivingLicenseUrl: String,
  status: {
  type: String,
  enum: ['pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'],
  default: 'confirmed', // 👈 now confirmed by default
},
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },

  // NEW: OTP fields
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },

  // Track when booking was actually started & completed
  startedAt: {
    type: Date,
    default: null,
  },
  sessionEndAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.parkfindersecondBooking ||
  mongoose.model('parkfindersecondBooking', bookingSchema);
