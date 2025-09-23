import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import ParkingSpace from "../models/ParkingSpace.js";
import seeder from "../seeder.js";
import NotificationService from "../service/NotificationService.js"; //for firebase 
const router = express.Router();

// User routes (existing) 
router.post("/firebase",async(req,res) => {
   try{
    const {title , deviceToken , body} = req.body;
    await NotificationService.sendNotification(deviceToken,title,body);
    res.status(200).json({message : "Notification sent successfully",success: true});

   }
   catch(err){
    console.log("error occured in sending notification");
    res.status(500).json({error : err.message ,success :false});
   }
})



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