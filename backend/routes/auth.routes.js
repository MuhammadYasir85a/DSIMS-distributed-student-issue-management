const express = require("express");
const {
  registerStudent,
  verifyEmail,
  loginUser
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerStudent);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);

module.exports = router;