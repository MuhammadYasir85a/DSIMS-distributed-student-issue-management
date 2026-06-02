const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");

const {
  registerStudent,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateMyProfile,
  logoutUser
} = require("../controllers/auth.controller");

router.post("/register", registerStudent);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.post("/logout", protect, logoutUser);

// ✅ NEW: get logged-in user (frontend session restore)
router.get("/me", protect, getCurrentUser);

// ✅ NEW: update own profile / change password
router.patch("/me", protect, updateMyProfile);

module.exports = router;