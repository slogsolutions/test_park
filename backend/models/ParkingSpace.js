
// import mongoose from "mongoose";

// const parkingSpaceSchema = new mongoose.Schema({
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "ParkFinderSecondUser",
//     required: true,
//   },
//   title: {
//     type: String,
//     required: true,
//   },
//   description: String,
//   location: {
//     type: {
//       type: String,
//       enum: ["Point"],
//       required: true,
//     },
//     coordinates: {
//       type: [Number], // [longitude, latitude]
//       required: true,
//     },
//   },
//   address: {
//     street: String,
//     city: String,
//     state: String,
//     zipCode: String,
//     country: String,
//   },
//   priceParking: {
//     type: Number,
//   },
//   pricePerHour: {
//     type: Number,
//     required: true,
//   },
//   availability: [
//     {
//       date: Date,
//       slots: [
//         {
//           startTime: Date,
//           endTime: Date,
//           isBooked: {
//             type: Boolean,
//             default: false,
//           },
//         },
//       ],
//     },
//   ],
//   amenities: [
//     {
//       type: String,
//       enum: ["covered", "security", "charging", "cctv", "wheelchair"],
//     },
//   ],
//   availableSpots: {
//     type: Number,
//   },
//   photos: [String],
//   rating: {
//     type: Number,
//     min: 0,
//     max: 5,
//     default: 0,
//   },
//   reviews: [
//     {
//       user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "ParkFinderSecondUser",
//       },
//       rating: Number,
//       comment: String,
//       createdAt: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//   ],
//   status: {
//     type: String,
//     enum: ["active", "inactive", "pending"],
//     default: "pending",
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// parkingSpaceSchema.index({ location: "2dsphere" });

// // ✅ Prevent OverwriteModelError
// export default mongoose.models.ParkfindersecondParkingSpace ||
//   mongoose.model("ParkfindersecondParkingSpace", parkingSpaceSchema);


import mongoose from "mongoose";

const parkingSpaceSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkFinderSecondUser",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  priceParking: {
    type: Number,
  },
  pricePerHour: {
    type: Number,
    required: true,
  },
  availability: [
    {
      date: Date,
      slots: [
        {
          startTime: Date,
          endTime: Date,
          isBooked: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  ],
  amenities: [
    {
      type: String,
      enum: ["covered", "security", "charging", "cctv", "wheelchair"],
    },
  ],
  availableSpots: {
    type: Number,
  },
  photos: [String],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParkFinderSecondUser",
      },
      rating: Number,
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ["submitted", "pending"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

parkingSpaceSchema.index({ location: "2dsphere" });

// Prevent OverwriteModelError
export default mongoose.models.ParkfindersecondParkingSpace ||
  mongoose.model("ParkfindersecondParkingSpace", parkingSpaceSchema);