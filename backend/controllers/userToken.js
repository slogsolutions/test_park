
import UserToken from "../models/UserToken.js";

export const saveToken = async (req, res) => {
  try {
    const { userId, fcmToken, deviceInfo } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ message: "Missing userId or fcmToken" });
    }

    const policy = process.env.FIREBASE_TOKEN_POLICY || "multiple";

    if (policy === "single") {
      // remove all previous tokens for this user
      await UserToken.deleteMany({ userId });
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

