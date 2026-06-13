const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Student = require("../models/students.model");
const Admin = require("../models/admins.model");
const Campus = require("../models/campuses.model");
const Department = require("../models/departments.model");

// ✅ Frontend base URL (used for clickable links in emails / dev console)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/* ==============================
   REGISTER STUDENT
============================== */
const registerStudent = async (req, res) => {
  try {
    const {
      student_id, name, email, password,
      campus_id, department_id, semester, contact_no
    } = req.body;

    if (!student_id || !name || !email || !password || !campus_id || !department_id || !semester || !contact_no) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const studentEmailRegex = /^[a-z]{4}\d{2}[abcdef]\d{3,6}@namal\.edu\.pk$/;
    if (!studentEmailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid student email format. Example: bscs23a123@namal.edu.pk"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const campus = await Campus.findById(campus_id);
    if (!campus) return res.status(400).json({ message: "Invalid campus selected." });

    const department = await Department.findById(department_id);
    if (!department) return res.status(400).json({ message: "Invalid department selected." });

    if (department.campus_id.toString() !== campus_id.toString()) {
      return res.status(400).json({ message: "Department does not belong to selected campus." });
    }

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already registered." });

    const existingStudentId = await Student.findOne({ student_id });
    if (existingStudentId) return res.status(400).json({ message: "Student ID already registered." });

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await Student.create({
      student_id, name, email, password_hash,
      campus_id, department_id, semester, contact_no,
      verification_token, verification_token_expires,
      status: "pending",
      is_email_verified: false
    });

    console.log("\n===== EMAIL SIMULATION =====");
    console.log(`Verification link for ${email}:`);
    console.log(`http://localhost:5000/auth/verify/${verification_token}`);
    console.log("============================\n");

    res.status(201).json({
      message: "Registration successful. Verify email and wait for admin approval."
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   VERIFY EMAIL
============================== */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const student = await Student.findOne({
      verification_token: token,
      verification_token_expires: { $gt: new Date() }
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    student.is_email_verified = true;
    student.verification_token = null;
    student.verification_token_expires = null;
    await student.save();

    res.json({ message: "Email verified. Awaiting admin approval." });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   LOGIN — now embeds name & email in JWT + tracks last_login
============================== */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    let user = await Student.findOne({ email })
      .populate("campus_id", "name")
      .populate("department_id", "name");
    let role;

    if (user) {
      role = "student";

      if (!user.is_email_verified)
        return res.status(403).json({ message: "Email not verified." });

      if (user.status !== "active")
        return res.status(403).json({ message: "Awaiting admin approval." });
    } else {
      user = await Admin.findOne({ email })
        .populate("campus_id", "name")
        .populate("department_id", "name");
      if (!user) return res.status(400).json({ message: "Invalid credentials." });

      if (user.status !== "active")
        return res.status(403).json({ message: "Account is inactive." });

      role = user.role;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    // ✅ NEW: Track last login (non-blocking — don't fail login if this fails)
    try {
      user.last_login = new Date();
      await user.save();
    } catch (e) { /* silent */ }

    // ✅ Token expiry: 1h for student, 8h for admins
    const tokenExpiry = role === "student" ? "1h" : "8h";

    // ✅ JWT now includes name & email
    const token = jwt.sign(
      {
        user_id: user._id,
        name: user.name,
        email: user.email,
        role,
        campus_id: user.campus_id?._id || user.campus_id,
        department_id: user.department_id?._id || user.department_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        campus: user.campus_id,        // populated object
        department: user.department_id // populated object (or null)
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/* ==============================
   GET CURRENT USER — for frontend session restore
============================== */
const getCurrentUser = async (req, res) => {
  try {
    const { user_id, role } = req.user;

    let user;
    if (role === "student") {
      user = await Student.findById(user_id)
        .select("-password_hash -verification_token -verification_token_expires -reset_password_token -reset_password_expires")
        .populate("campus_id", "name location")
        .populate("department_id", "name type")
        .lean();
    } else {
      user = await Admin.findById(user_id)
        .select("-password_hash -reset_password_token -reset_password_expires")
        .populate("campus_id", "name location")
        .populate("department_id", "name type")
        .lean();
    }

    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is no longer active." });
    }

    res.json({ user: { ...user, role } });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   FORGOT PASSWORD — now supports admin too
============================== */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    // Try student first
    let account = await Student.findOne({ email });
    let accountType = "student";

    if (!account) {
      account = await Admin.findOne({ email });
      accountType = "admin";
    }

    if (!account) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    if (accountType === "student" && !account.is_email_verified) {
      return res.status(403).json({ message: "Email not verified." });
    }

    const reset_token = crypto.randomBytes(32).toString("hex");
    const reset_password_expires = new Date(Date.now() + 60 * 60 * 1000);

    account.reset_password_token = reset_token;
    account.reset_password_expires = reset_password_expires;
    await account.save();

    // ✅ FIXED: link now points to the FRONTEND page, not backend route
    console.log("\n===== PASSWORD RESET SIMULATION =====");
    console.log(`Reset link for ${email} (${accountType}):`);
    console.log(`${FRONTEND_URL}/reset-password/${reset_token}`);
    console.log("=====================================\n");

    res.json({ message: "Password reset link generated. Check console." });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   RESET PASSWORD — now supports admin too
============================== */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // Look in both Student and Admin
    let account = await Student.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() }
    });

    if (!account) {
      account = await Admin.findOne({
        reset_password_token: token,
        reset_password_expires: { $gt: new Date() }
      });
    }

    if (!account) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    account.password_hash = await bcrypt.hash(new_password, 10);
    account.reset_password_token = null;
    account.reset_password_expires = null;
    await account.save();

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   UPDATE OWN PROFILE — for both student & admin
============================== */
const updateMyProfile = async (req, res) => {
  try {
    const { user_id, role } = req.user;
    const { contact_no, current_password, new_password } = req.body;

    const Model = role === "student" ? Student : Admin;
    const user = await Model.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found." });

    let changedFields = [];

    if (contact_no && role === "student") {
      user.contact_no = contact_no;
      changedFields.push("contact_no");
    }

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: "Current password is required to change password." });
      }
      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password incorrect." });
      }
      if (new_password.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters." });
      }
      user.password_hash = await bcrypt.hash(new_password, 10);
      changedFields.push("password");
    }

    if (changedFields.length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      updated_fields: changedFields
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

const TokenBlacklist = require("../models/tokenBlacklist.model");

const logoutUser = async (req, res) => {
  try {
    const token = req.token;
    const user_id = req.user.user_id;

    // Decode to get expiry
    const decoded = jwt.decode(token);
    const expires_at = new Date(decoded.exp * 1000);

    // Add to blacklist (TTL will auto-clean later)
    await TokenBlacklist.create({
      token,
      user_id,
      expires_at
    });

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    // If already blacklisted (duplicate), still treat as success
    if (error.code === 11000) {
      return res.json({ message: "Already logged out." });
    }
    console.error("Logout error:", error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  registerStudent,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateMyProfile,
  logoutUser
};