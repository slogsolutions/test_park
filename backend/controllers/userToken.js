// import UserToken from "../models/UserToken.js";
// import dotenv from "dotenv";
// dotenv.config({ path: "./.env" });
// import admin from "../utils/firebase.js";
// // import User from "../models/User.js";  

// // Save token (called on login / whenever you get token on client)
// export const saveToken = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { fcmToken, deviceInfo } = req.body;

//     if (!fcmToken) {
//       return res.status(400).json({ message: "Missing fcmToken" });
//     }

//     const policy = process.env.TOKEN_POLICY || "multiple";

//     if (policy === "single") {
//       // Remove all previous tokens for user → single device behavior
//       await UserToken.deleteMany({ userId });
//     }

//     // Upsert this token
//     await UserToken.updateOne(
//       { token: fcmToken },
//       { $set: { userId, token: fcmToken, deviceInfo } },
//       { upsert: true }
//     );

//     return res.json({ message: "Token saved" });
//   } catch (err) {
//     console.error("Error saving token:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // Remove token (called on logout or when user revokes)
// export const removeToken = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { fcmToken } = req.body;

//     if (!fcmToken) {
//       return res.status(400).json({ message: "Missing fcmToken" });
//     }

//     await UserToken.deleteOne({ userId, token: fcmToken });

//     return res.json({ message: "Token removed" });
//   } catch (err) {
//     console.error("Error removing token:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


// controllers/userToken.js
import UserToken from "../models/UserToken.js";

export const saveToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken, deviceInfo } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "Missing fcmToken" });
    }

    const policy = process.env.FIREBASE_TOKEN_POLICY || "multiple";

    if (policy === "single") {
      // remove all previous tokens for this user
      await UserToken.deleteMany({ userId });

      // create only the latest one
      await UserToken.create({ userId, token: fcmToken, deviceInfo });
    } else {
      // multiple-device behavior
      const exists = await UserToken.findOne({ userId, token: fcmToken });
      if (!exists) {
        await UserToken.create({ userId, token: fcmToken, deviceInfo });
      }
    }

    return res.json({ message: "Token saved" });
  } catch (err) {
    console.error("Error saving token:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "Missing fcmToken" });
    }

    await UserToken.deleteOne({ userId, token: fcmToken });

    return res.json({ message: "Token removed" });
  } catch (err) {
    console.error("Error removing token:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

