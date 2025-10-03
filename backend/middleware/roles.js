// backend/middleware/roles.js
export const captainOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Support both naming conventions: isCaptain (camel) or iscaptain (lowercase)
    const isCaptainFlag =
      typeof req.user.isCaptain !== "undefined"
        ? req.user.isCaptain
        : req.user.iscaptain; // fallback if model used lowercase

    if (!isCaptainFlag) {
      return res.status(403).json({ message: "Access denied. Captain role required." });
    }
    next();
  } catch (err) {
    console.error("captainOnly middleware error:", err);
    return res.status(500).json({ message: "Server error in role check" });
  }
};

export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const isAdminFlag = req.user.isAdmin || req.user.isadmin;
    if (!isAdminFlag) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    next();
  } catch (err) {
    console.error("adminOnly middleware error:", err);
    return res.status(500).json({ message: "Server error in role check" });
  }
};
