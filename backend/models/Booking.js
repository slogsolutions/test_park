// import mongoose from 'mongoose';

// const bookingSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'ParkFinderSecondUser',
//     required: true,
//   },
//   parkingSpace: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'ParkfindersecondParkingSpace',
//     required: true,
//   },
//   providerId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'ParkFinderSecondUser',
//   },
//   pricePerHour: {
//     type: Number,
//     required: true,
//   },
//   startTime: {
//     type: Date,
//     required: true,
//   },
//   endTime: {
//     type: Date,
//     required: true,
//   },
//   totalPrice: {
//     type: Number,
//     required: true,
//   },
//   vehicleNumber: String,
//   vehicleType: String,
//   vehicleModel: String,
//   contactNumber: String,
//   chassisNumber: String,
//   drivingLicenseUrl: String, // Store the file URL
//   status: {
//     type: String,
//     enum: ['pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'],  // Changed to lowercase
//     default: 'pending',  // Default is lowercase 'pending'
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'refunded'],
//     default: 'pending',
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// // export default mongoose.model('parkfindersecondBooking', bookingSchema);
// // ✅ Prevent OverwriteModelError
// export default mongoose.models.parkfindersecondBooking ||
//   mongoose.model('parkfindersecondBooking', bookingSchema);





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
  drivingLicenseUrl: String, // Store the file URL
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Prevent OverwriteModelError
export default mongoose.models.parkfindersecondBooking ||
  mongoose.model('parkfindersecondBooking', bookingSchema);
