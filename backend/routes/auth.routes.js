const express = require("express");
const router = express.Router();   // ✅ added

const {
  registerStudent,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword
} = require("../controllers/auth.controller");

router.post("/register", registerStudent);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

module.exports = router;