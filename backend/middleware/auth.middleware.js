const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/tokenBlacklist.model");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const token = authHeader.split(" ")[1];

    // ✅ NEW: Check blacklist first
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ message: "Token invalidated. Please log in again." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;   // ✅ Pass token to next handler (for logout)
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = protect;