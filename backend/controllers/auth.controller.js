const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Student = require("../models/students.model");
const Admin = require("../models/admins.model");
const Campus = require("../models/campuses.model");
const Department = require("../models/departments.model");

/* ==============================
   REGISTER STUDENT
============================== */
const registerStudent = async (req, res) => {
  try {
    const {
      student_id, name, email, password,
      campus_id, department_id, semester, contact_no
    } = req.body;

    // ✅ Required fields check
    if (!student_id || !name || !email || !password || !campus_id || !department_id || !semester || !contact_no) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ Strict student email format
    const studentEmailRegex = /^[a-z]{4}\d{2}[abcd]\d{3}@namal\.edu\.pk$/;
    if (!studentEmailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid student email format. Example: bscs23a123@namal.edu.pk"
      });
    }

    // ✅ Password length
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    // ✅ Campus validation
    const campus = await Campus.findById(campus_id);
    if (!campus) return res.status(400).json({ message: "Invalid campus selected." });

    // ✅ Department validation
    const department = await Department.findById(department_id);
    if (!department) return res.status(400).json({ message: "Invalid department selected." });

    if (department.campus_id.toString() !== campus_id.toString()) {
      return res.status(400).json({ message: "Department does not belong to selected campus." });
    }

    // ✅ Duplicate checks
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
   LOGIN
============================== */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    let user = await Student.findOne({ email });
    let role;

    if (user) {
      role = "student";

      if (!user.is_email_verified)
        return res.status(403).json({ message: "Email not verified." });

      if (user.status !== "active")
        return res.status(403).json({ message: "Awaiting admin approval." });
    } else {
      user = await Admin.findOne({ email });
      if (!user) return res.status(400).json({ message: "Invalid credentials." });

      if (user.status !== "active")
        return res.status(403).json({ message: "Account is inactive." });

      role = user.role;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      {
        user_id: user._id,
        role,
        campus_id: user.campus_id,
        department_id: user.department_id || null
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role,
        campus_id: user.campus_id,
        department_id: user.department_id || null
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

/* ==============================
   FORGOT PASSWORD
============================== */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const student = await Student.findOne({ email });
    if (!student) return res.status(404).json({ message: "No account found with this email." });

    if (!student.is_email_verified) {
      return res.status(403).json({ message: "Email not verified." });
    }

    const reset_token = crypto.randomBytes(32).toString("hex");
    const reset_password_expires = new Date(Date.now() + 60 * 60 * 1000);

    student.reset_password_token = reset_token;
    student.reset_password_expires = reset_password_expires;
    await student.save();

    console.log("\n===== PASSWORD RESET SIMULATION =====");
    console.log(`Reset link for ${email}:`);
    console.log(`http://localhost:5000/auth/reset-password/${reset_token}`);
    console.log("=====================================\n");

    res.json({ message: "Password reset link generated. Check console." });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   RESET PASSWORD
============================== */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const student = await Student.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() }
    });

    if (!student) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    student.password_hash = await bcrypt.hash(new_password, 10);
    student.reset_password_token = null;
    student.reset_password_expires = null;
    await student.save();

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerStudent,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword
};