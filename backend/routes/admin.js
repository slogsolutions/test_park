// // // // // // import express from "express";
// // // // // // import { protect, adminOnly } from "../middleware/auth.js";
// // // // // // import User from "../models/User.js";
// // // // // // import Booking from "../models/booking.js";
// // // // // // import ParkingSpace from "../models/parkingspace.js";

// // // // // // const router = express.Router();

// // // // // // // ==============================
// // // // // // // Get all users
// // // // // // // ==============================
// // // // // // router.get("/users", protect, adminOnly, async (req, res) => {
// // // // // //   try {
// // // // // //     const users = await User.find();
// // // // // //     res.json({ users });
// // // // // //   } catch (err) {
// // // // // //     res.status(500).json({ error: err.message });
// // // // // //   }
// // // // // // });

// // // // // // // ==============================
// // // // // // // Get all bookings
// // // // // // // ==============================
// // // // // // router.get("/bookings", protect, adminOnly, async (req, res) => {
// // // // // //   try {
// // // // // //     const bookings = await Booking.find()
// // // // // //       .populate("user", "name email") // ✅ FIXED field name
// // // // // //       .populate("parkingSpace", "title address pricePerHour"); // ✅ FIXED field name
// // // // // //     res.json({ bookings });
// // // // // //   } catch (err) {
// // // // // //     res.status(500).json({ error: err.message });
// // // // // //   }
// // // // // // });

// // // // // // // ==============================
// // // // // // // Get all parking spaces
// // // // // // // ==============================
// // // // // // router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
// // // // // //   try {
// // // // // //     const spaces = await ParkingSpace.find().populate("owner", "name email");
// // // // // //     res.json({ spaces });
// // // // // //   } catch (err) {
// // // // // //     res.status(500).json({ error: err.message });
// // // // // //   }
// // // // // // });

// // // // // // export default router;

// // // // // // server/routes/admin.js
// // // // // import express from "express";
// // // // // import { protect, adminOnly } from "../middleware/auth.js";
// // // // // import User from "../models/User.js";
// // // // // import Booking from "../models/booking.js";
// // // // // import ParkingSpace from "../models/parkingspace.js";

// // // // // const router = express.Router();

// // // // // // ==============================
// // // // // // Get all users
// // // // // // ==============================
// // // // // router.get("/users", protect, adminOnly, async (req, res) => {
// // // // //   try {
// // // // //     const users = await User.find();
// // // // //     res.json({ users });
// // // // //   } catch (err) {
// // // // //     res.status(500).json({ error: err.message });
// // // // //   }
// // // // // });

// // // // // // ==============================
// // // // // // Get all bookings
// // // // // // ==============================
// // // // // router.get("/bookings", protect, adminOnly, async (req, res) => {
// // // // //   try {
// // // // //     const bookings = await Booking.find()
// // // // //       .populate("user", "name email")   // ✅ FIXED (your schema has "name")
// // // // //       .populate("parkingSpace", "title address"); // ✅ FIXED (correct field)
// // // // //     res.json({ bookings });
// // // // //   } catch (err) {
// // // // //     res.status(500).json({ error: err.message });
// // // // //   }
// // // // // });

// // // // // // ==============================
// // // // // // Get all parking spaces
// // // // // // ==============================
// // // // // router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
// // // // //   try {
// // // // //     const spaces = await ParkingSpace.find()
// // // // //       .populate("owner", "name email"); // ✅ FIXED (your schema has "name")
// // // // //     res.json({ spaces });
// // // // //   } catch (err) {
// // // // //     res.status(500).json({ error: err.message });
// // // // //   }
// // // // // });

// // // // // export default router;


// // // // import express from "express";
// // // // import { protect, adminOnly } from "../middleware/auth.js";
// // // // import User from "../models/User.js";

// // // // // Import with exact file names (case sensitive)
// // // // import Booking from "../models/booking.js";
// // // // import ParkingSpace from "../models/parkingspace.js";

// // // // const router = express.Router();

// // // // // ==============================
// // // // // Get all users
// // // // // ==============================
// // // // router.get("/users", protect, adminOnly, async (req, res) => {
// // // //   try {
// // // //     const users = await User.find();
// // // //     res.json({ users });
// // // //   } catch (err) {
// // // //     console.error("Error fetching users:", err);
// // // //     res.status(500).json({ error: err.message });
// // // //   }
// // // // });

// // // // // ==============================
// // // // // Get all bookings
// // // // // ==============================
// // // // router.get("/bookings", protect, adminOnly, async (req, res) => {
// // // //   try {
// // // //     const bookings = await Booking.find()
// // // //       .populate("user", "name email")
// // // //       .populate("parkingSpace", "title address location pricePerHour");
    
// // // //     console.log("Bookings found:", bookings.length);
// // // //     res.json({ bookings });
// // // //   } catch (err) {
// // // //     console.error("Error fetching bookings:", err);
// // // //     res.status(500).json({ error: err.message });
// // // //   }
// // // // });

// // // // // ==============================
// // // // // Get all parking spaces
// // // // // ==============================
// // // // router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
// // // //   try {
// // // //     // First try without populate to see if basic query works
// // // //     const spaces = await ParkingSpace.find();
// // // //     console.log("Raw spaces found:", spaces.length);
    
// // // //     // Then try with populate
// // // //     const spacesWithOwner = await ParkingSpace.find()
// // // //       .populate("owner", "name email")
// // // //       .lean(); // Use lean() for better performance
    
// // // //     console.log("Spaces with owner:", spacesWithOwner.length);
// // // //     res.json({ spaces: spacesWithOwner });
// // // //   } catch (err) {
// // // //     console.error("Error fetching parking spaces:", err);
// // // //     res.status(500).json({ error: err.message });
// // // //   }
// // // // });

// // // // // ==============================
// // // // // Debug route to check model status
// // // // // ==============================
// // // // router.get("/debug", protect, adminOnly, async (req, res) => {
// // // //   try {
// // // //     const userCount = await User.countDocuments();
// // // //     const bookingCount = await Booking.countDocuments();
// // // //     const spaceCount = await ParkingSpace.countDocuments();
    
// // // //     res.json({
// // // //       users: userCount,
// // // //       bookings: bookingCount,
// // // //       parkingSpaces: spaceCount,
// // // //       models: {
// // // //         User: User.modelName,
// // // //         Booking: Booking.modelName,
// // // //         ParkingSpace: ParkingSpace.modelName
// // // //       }
// // // //     });
// // // //   } catch (err) {
// // // //     console.error("Debug error:", err);
// // // //     res.status(500).json({ error: err.message });
// // // //   }
// // // // });

// // // // export default router;

// // // import express from "express";
// // // import { protect, adminOnly } from "../middleware/auth.js";
// // // import User from "../models/User.js";
// // // import Booking from "../models/booking.js";
// // // import ParkingSpace from "../models/parkingspace.js";

// // // const router = express.Router();

// // // // User routes (existing)
// // // router.get("/users", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const users = await User.find();
// // //     res.json({ users });
// // //   } catch (err) {
// // //     console.error("Error fetching users:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // router.put("/users/:id", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const updateData = req.body;
// // //     const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// // //     if (!user) return res.status(404).json({ error: "User not found" });
// // //     res.json({ user });
// // //   } catch (err) {
// // //     console.error("Error updating user:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // router.patch("/users/:id/verify", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const { isVerified, kycStatus } = req.body;
// // //     const updateData = {};
// // //     if (isVerified !== undefined) updateData.isVerified = isVerified;
// // //     if (kycStatus) updateData.kycStatus = kycStatus;
// // //     const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// // //     if (!user) return res.status(404).json({ error: "User not found" });
// // //     res.json({ user });
// // //   } catch (err) {
// // //     console.error("Error verifying user:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // router.delete("/users/:id", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const user = await User.findByIdAndDelete(id);
// // //     if (!user) return res.status(404).json({ error: "User not found" });
// // //     res.json({ message: "User deleted successfully" });
// // //   } catch (err) {
// // //     console.error("Error deleting user:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Bookings routes
// // // router.get("/bookings", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const bookings = await Booking.find()
// // //       .populate("user", "name email")
// // //       .populate("parkingSpace", "name description location pricePerHour");
// // //     console.log("Bookings found:", bookings.length);
// // //     res.json({ bookings });
// // //   } catch (err) {
// // //     console.error("Error fetching bookings:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // router.put("/bookings/:id", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const updateData = req.body;
// // //     const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// // //     if (!booking) return res.status(404).json({ error: "Booking not found" });
// // //     res.json({ booking });
// // //   } catch (err) {
// // //     console.error("Error updating booking:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // router.patch("/bookings/:id/status", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const { status } = req.body;
// // //     const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
// // //     if (!booking) return res.status(404).json({ error: "Booking not found" });
// // //     res.json({ booking });
// // //   } catch (err) {
// // //     console.error("Error updating booking status:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // router.delete("/bookings/:id", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const { id } = req.params;
// // //     const booking = await Booking.findByIdAndDelete(id);
// // //     if (!booking) return res.status(404).json({ error: "Booking not found" });
// // //     res.json({ message: "Booking deleted successfully" });
// // //   } catch (err) {
// // //     console.error("Error deleting booking:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Parking spaces routes
// // // router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const spaces = await ParkingSpace.find()
// // //       .populate("owner", "name email")
// // //       .lean();
// // //     console.log("Spaces with owner:", spaces.length);
// // //     res.json({ spaces });
// // //   } catch (err) {
// // //     console.error("Error fetching parking spaces:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // Debug route
// // // router.get("/debug", protect, adminOnly, async (req, res) => {
// // //   try {
// // //     const userCount = await User.countDocuments();
// // //     const bookingCount = await Booking.countDocuments();
// // //     const spaceCount = await ParkingSpace.countDocuments();
// // //     res.json({
// // //       users: userCount,
// // //       bookings: bookingCount,
// // //       parkingSpaces: spaceCount,
// // //       models: {
// // //         User: User.modelName,
// // //         Booking: Booking.modelName,
// // //         ParkingSpace: ParkingSpace.modelName
// // //       }
// // //     });
// // //   } catch (err) {
// // //     console.error("Debug error:", err);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // export default router;

// // import express from "express";
// // import { protect, adminOnly } from "../middleware/auth.js";
// // import User from "../models/User.js";
// // import Booking from "../models/booking.js";
// // import ParkingSpace from "../models/parkingspace.js";

// // const router = express.Router();

// // // User routes (existing)
// // router.get("/users", protect, adminOnly, async (req, res) => {
// //   try {
// //     const users = await User.find();
// //     res.json({ users });
// //   } catch (err) {
// //     console.error("Error fetching users:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.put("/users/:id", protect, adminOnly, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const updateData = req.body;
// //     const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// //     if (!user) return res.status(404).json({ error: "User not found" });
// //     res.json({ user });
// //   } catch (err) {
// //     console.error("Error updating user:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.patch("/users/:id/verify", protect, adminOnly, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { isVerified, kycStatus } = req.body;
// //     const updateData = {};
// //     if (isVerified !== undefined) updateData.isVerified = isVerified;
// //     if (kycStatus) updateData.kycStatus = kycStatus;
// //     const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// //     if (!user) return res.status(404).json({ error: "User not found" });
// //     res.json({ user });
// //   } catch (err) {
// //     console.error("Error verifying user:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.delete("/users/:id", protect, adminOnly, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const user = await User.findByIdAndDelete(id);
// //     if (!user) return res.status(404).json({ error: "User not found" });
// //     res.json({ message: "User deleted successfully" });
// //   } catch (err) {
// //     console.error("Error deleting user:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // Bookings routes
// // router.get("/bookings", protect, adminOnly, async (req, res) => {
// //   try {
// //     const bookings = await Booking.find()
// //       .populate("user", "name email")
// //       .populate("parkingSpace", "title address location pricePerHour");
// //     console.log("Bookings found:", bookings.length);
// //     res.json({ bookings });
// //   } catch (err) {
// //     console.error("Error fetching bookings:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.put("/bookings/:id", protect, adminOnly, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const updateData = req.body;
// //     const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
// //     if (!booking) return res.status(404).json({ error: "Booking not found" });
// //     res.json({ booking });
// //   } catch (err) {
// //     console.error("Error updating booking:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.patch("/bookings/:id/status", protect, adminOnly, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const { status } = req.body;
// //     const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
// //     if (!booking) return res.status(404).json({ error: "Booking not found" });
// //     res.json({ booking });
// //   } catch (err) {
// //     console.error("Error updating booking status:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // router.delete("/bookings/:id", protect, adminOnly, async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     const booking = await Booking.findByIdAndDelete(id);
// //     if (!booking) return res.status(404).json({ error: "Booking not found" });
// //     res.json({ message: "Booking deleted successfully" });
// //   } catch (err) {
// //     console.error("Error deleting booking:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // Parking spaces routes
// // router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
// //   try {
// //     const spaces = await ParkingSpace.find()
// //       .populate("owner", "name email")
// //       .lean();
// //     console.log("Spaces with owner:", spaces.length);
// //     res.json({ spaces });
// //   } catch (err) {
// //     console.error("Error fetching parking spaces:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // Debug route
// // router.get("/debug", protect, adminOnly, async (req, res) => {
// //   try {
// //     const userCount = await User.countDocuments();
// //     const bookingCount = await Booking.countDocuments();
// //     const spaceCount = await ParkingSpace.countDocuments();
// //     res.json({
// //       users: userCount,
// //       bookings: bookingCount,
// //       parkingSpaces: spaceCount,
// //       models: {
// //         User: User.modelName,
// //         Booking: Booking.modelName,
// //         ParkingSpace: ParkingSpace.modelName
// //       }
// //     });
// //   } catch (err) {
// //     console.error("Debug error:", err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // export default router;


// import express from "express";
// import { protect, adminOnly } from "../middleware/auth.js";
// import User from "../models/User.js";
// import Booking from "../models/Booking.js";
// import ParkingSpace from "../models/ParkingSpace.js";
// const router = express.Router();

// // User routes (existing)
// router.get("/users", protect, adminOnly, async (req, res) => {
//   try {
//     const users = await User.find();
//     res.json({ users });
//   } catch (err) {
//     console.error("Error fetching users:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.put("/users/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
//     const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
//     if (!user) return res.status(404).json({ error: "User not found" });
//     res.json({ user });
//   } catch (err) {
//     console.error("Error updating user:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.patch("/users/:id/verify", protect, adminOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isVerified, kycStatus } = req.body;
//     const updateData = {};
//     if (isVerified !== undefined) updateData.isVerified = isVerified;
//     console.log("1 -> undefiend")
//     if (kycStatus) updateData.kycStatus = kycStatus;
//     console.log("2 -> kycStatus:", kycStatus)

//     const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
//     console.log("1 -> updated ",user)
//     if (!user) return res.status(404).json({ error: "User not found" });
//     res.json({ user });
//   } catch (err) {
//     console.error("Error verifying user:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.delete("/users/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findByIdAndDelete(id);
//     if (!user) return res.status(404).json({ error: "User not found" });
//     res.json({ message: "User deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting user:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Bookings routes
// router.get("/bookings", protect, adminOnly, async (req, res) => {
//   try {
//     const bookings = await Booking.find()
//       .populate("user", "name email")
//       .populate("parkingSpace", "title address location pricePerHour");
//     console.log("Bookings found:", bookings.length);
//     res.json({ bookings });
//   } catch (err) {
//     console.error("Error fetching bookings:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.put("/bookings/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;
//     const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
//     if (!booking) return res.status(404).json({ error: "Booking not found" });
//     res.json({ booking });
//   } catch (err) {
//     console.error("Error updating booking:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.patch("/bookings/:id/status", protect, adminOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
//     const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
//     if (!booking) return res.status(404).json({ error: "Booking not found" });
//     res.json({ booking });
//   } catch (err) {
//     console.error("Error updating booking status:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// router.delete("/bookings/:id", protect, adminOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const booking = await Booking.findByIdAndDelete(id);
//     if (!booking) return res.status(404).json({ error: "Booking not found" });
//     res.json({ message: "Booking deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting booking:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Parking spaces routes
// router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
//   try {
//     const spaces = await ParkingSpace.find()
//       .populate("owner", "name email")
//       .lean();
//     console.log("Spaces with owner:", spaces.length);
//     res.json({ spaces });
//   } catch (err) {
//     console.error("Error fetching parking spaces:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // Debug route
// router.get("/debug", protect, adminOnly, async (req, res) => {
//   try {
//     const userCount = await User.countDocuments();
//     const bookingCount = await Booking.countDocuments();
//     const spaceCount = await ParkingSpace.countDocuments();
//     res.json({
//       users: userCount,
//       bookings: bookingCount,
//       parkingSpaces: spaceCount,
//       models: {
//         User: User.modelName,
//         Booking: Booking.modelName,
//         ParkingSpace: ParkingSpace.modelName
//       }
//     });
//   } catch (err) {
//     console.error("Debug error:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;



import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import ParkingSpace from "../models/ParkingSpace.js";
import seeder from "../seeder.js";
const router = express.Router();

// User routes (existing)

router.post("/seed", async(req,res) => {
  try{
    console.log("Seeding started...");
    await seeder();
    res.status(200).json({message: "Seeded Successfully"});
  }
  catch(err){
    console.error("Error seeding data:", err);
    res.status(500).json({ error: err.message });
  }
})

router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/users/:id/verify", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, kycStatus } = req.body;
    const updateData = {};
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    console.log("1 -> undefiend")
    if (kycStatus) updateData.kycStatus = kycStatus;
    console.log("2 -> kycStatus:", kycStatus)

    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    console.log("1 -> updated ",user)
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Error verifying user:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Bookings routes
router.get("/bookings", protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("parkingSpace", "title address location pricePerHour");
    console.log("Bookings found:", bookings.length);
    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/bookings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ booking });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/bookings/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ booking });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/bookings/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ error: err.message });
  }
});

// Parking spaces routes
router.get("/parkingspaces", protect, adminOnly, async (req, res) => {
  try {
    const spaces = await ParkingSpace.find()
      .populate("owner", "name email")
      .lean();
    console.log("Spaces with owner:", spaces.length);
    res.json({ spaces });
  } catch (err) {
    console.error("Error fetching parking spaces:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/parkingspaces/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const space = await ParkingSpace.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!space) return res.status(404).json({ error: "Parking space not found" });
    res.json({ space });
  } catch (err) {
    console.error("Error updating parking space:", err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/parkingspaces/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log("here",status);
    const space = await ParkingSpace.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!space) return res.status(404).json({ error: "Parking space not found" });
    res.json({ space });
  } catch (err) {
    console.error("Error updating parking space status:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/parkingspaces/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const space = await ParkingSpace.findByIdAndDelete(id);
    if (!space) return res.status(404).json({ error: "Parking space not found" });
    res.json({ message: "Parking space deleted successfully" });
  } catch (err) {
    console.error("Error deleting parking space:", err);
    res.status(500).json({ error: err.message });
  }
});

// Debug route
router.get("/debug", protect, adminOnly, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const bookingCount = await Booking.countDocuments();
    const spaceCount = await ParkingSpace.countDocuments();
    res.json({
      users: userCount,
      bookings: bookingCount,
      parkingSpaces: spaceCount,
      models: {
        User: User.modelName,
        Booking: Booking.modelName,
        ParkingSpace: ParkingSpace.modelName
      }
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;