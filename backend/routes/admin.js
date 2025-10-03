import express from "express";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
// import admin from "../utils/firebase.js";
import UserToken from "../models/UserToken.js";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import ParkingSpace from "../models/ParkingSpace.js";
import seeder from "../seeder.js";
import NotificationService from "../service/NotificationService.js"; //for firebase 

import DeviceToken from '../models/DeviceToken.js'; // adjust path if needed
const router = express.Router();




router.post("/firebase", async (req, res) => {
  try {
    const {
      title,
      body,
      userId,
      username,
      fullName,
      email,
      userIds,
      deviceToken,
      allUsers
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Missing title or body" });
    }

    let tokens = [];

    const getTokensByUserId = async (id) => {
      const docs = await UserToken.find({ userId: id }).select("token -_id");
      return docs.map(d => d.token);
    };

    // 1️⃣ All users
    if (allUsers) {
      const docs = await UserToken.find({}).select("token -_id");
      tokens = docs.map(d => d.token);
    }
    // 2️⃣ Direct device token
    else if (deviceToken) {
      tokens = [deviceToken];
    }
    // 3️⃣ Single user by ID
    else if (userId) {
      tokens = await getTokensByUserId(userId);
    }
    // 4️⃣ Single user by username
    else if (username) {
      const user = await User.findOne({ name: username });
      if (!user) return res.status(404).json({ message: "User not found" });
      tokens = await getTokensByUserId(user._id);
    }
    // 5️⃣ By full name
    else if (fullName) {
      const user = await User.findOne({ "kycData.fullName": fullName });
      if (!user) return res.status(404).json({ message: "User not found" });
      tokens = await getTokensByUserId(user._id);
    }
    // 6️⃣ By email
    else if (email) {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      tokens = await getTokensByUserId(user._id);
    }
    // 7️⃣ List of user IDs
    else if (Array.isArray(userIds) && userIds.length > 0) {
      const docs = await UserToken.find({ userId: { $in: userIds } }).select("token -_id");
      tokens = docs.map(d => d.token);
    }
    // No target provided
    else {
      return res.status(400).json({ message: "No target specified" });
    }

    if (tokens.length === 0) {
      return res.status(404).json({ message: "No tokens found for target" });
    }

    // ✅ Send notification
    let response;
    if (tokens.length === 1) {
      response = await NotificationService.sendToDevice(tokens[0], title, body);
    } else {
      response = await NotificationService.sendToMultiple(tokens, title, body);
    }

    return res.json({
      success: true,
      tokensSent: tokens.length,
      response
    });
  } catch (err) {
    console.error("Notification error:", err);
    return res.status(500).json({ message: "Failed to send notification", error: err.message });
  }
});

/**
 * POST /api/save-token-basic
 * Body: { fcmToken: string (required), userId?: string, deviceInfo?: string }
 *
 * Behavior:
 * - Requires fcmToken.
 * - If userId provided => attach to token (set/overwrite).
 * - If userId NOT provided => do not overwrite an existing userId (keep previous attachment).
 * - Upserts by token, updates lastSeen & deviceInfo.
 */
router.post('/save-token-basic', async (req, res) => {
  try {
    const { fcmToken, userId, deviceInfo } = req.body || {};

    console.log('[save-token-basic] payload:', {
      hasFcmToken: !!fcmToken,
      userId: userId ?? null,
      deviceInfo,
      ip: req.ip,
      ts: new Date().toISOString(),
    });

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    // Build update: always update lastSeen & deviceInfo
    const update = {
      $set: {
        lastSeen: new Date(),
        deviceInfo: deviceInfo ?? null,
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    // If userId explicitly provided, attach/overwrite it.
    if (userId) {
      update.$set.userId = userId;
    }

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    // If userId not provided, we want to avoid overwriting existing userId.
    // findOneAndUpdate with $set won't overwrite fields not in $set, so this logic is safe.
    const doc = await DeviceToken.findOneAndUpdate({ token: fcmToken }, update, opts).exec();

    return res.json({
      success: true,
      message: 'Token saved (basic)',
      token: { id: doc._id, userId: doc.userId ?? null, token: doc.token },
    });
  } catch (err) {
    console.error('[save-token-basic] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/android-basic-save
 * Body: { fcmToken: string (required), deviceInfo?: string }
 *
 * Minimal smoke-test: stores token with userId=null (if new) or updates lastSeen if exists.
 */
router.post('/android-basic-save', async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body || {};

    console.log('[android-basic-save] payload:', {
      hasFcmToken: !!fcmToken,
      deviceInfo,
      ip: req.ip,
      ts: new Date().toISOString(),
    });

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'fcmToken is required' });
    }

    const filter = { token: fcmToken };
    const update = {
      $set: { lastSeen: new Date(), deviceInfo: deviceInfo ?? null },
      $setOnInsert: { createdAt: new Date(), userId: null },
    };
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };

    const doc = await DeviceToken.findOneAndUpdate(filter, update, opts).exec();

    return res.json({
      success: true,
      message: 'Token recorded (android-basic-save)',
      token: { id: doc._id, userId: doc.userId ?? null, token: doc.token },
    });
  } catch (err) {
    console.error('[android-basic-save] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/debug/tokens
 * Dev-only: returns recent tokens for quick verification
 * Query: ?limit=100
 */
router.get('/debug/tokens', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 2000);
    const docs = await DeviceToken.find({}, { userId: 1, token: 1, deviceInfo: 1, lastSeen: 1 })
      .sort({ lastSeen: -1 })
      .limit(limit)
      .lean()
      .exec();
    return res.json({ success: true, count: docs.length, tokens: docs });
  } catch (err) {
    console.error('[debug/tokens] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});



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
