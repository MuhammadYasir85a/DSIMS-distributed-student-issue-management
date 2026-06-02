const Student = require("../models/students.model");
const Notification = require("../models/notifications.model");

/* ==============================
   GET PENDING STUDENTS
============================== */
const getPendingStudents = async (req, res) => {
  try {
    const user = req.user;

    const filters = {
      status: "pending",
      is_email_verified: true
    };

    if (user.role === "department_admin") {
      filters.campus_id = user.campus_id;
      filters.department_id = user.department_id;
    } else if (user.role === "management") {
      filters.campus_id = user.campus_id;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filters)
        .select("name email student_id campus_id department_id semester")
        .populate("campus_id", "name")
        .populate("department_id", "name")
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filters)
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: students.length,
      students
    });
  } catch (error) {
    console.error("Get pending students error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   APPROVE STUDENT
============================== */
const approveStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const user = req.user;

    const student = await Student.findById(student_id);
    if (!student) return res.status(404).json({ message: "Student not found." });

    if (user.role === "department_admin") {
      if (
        student.campus_id.toString() !== String(user.campus_id) ||
        student.department_id.toString() !== String(user.department_id)
      ) {
        return res.status(403).json({ message: "Unauthorized to approve this student." });
      }
    } else if (user.role === "management") {
      if (student.campus_id.toString() !== String(user.campus_id)) {
        return res.status(403).json({ message: "Unauthorized to approve this student." });
      }
    }

    if (student.status === "active") {
      return res.status(400).json({ message: "Student is already active." });
    }

    if (!student.is_email_verified) {
      return res.status(400).json({ message: "Student email not verified yet." });
    }

    student.status = "active";
    await student.save();

    // ✅ NEW: notify student
    await Notification.create({
      recipient_id: student._id,
      recipient_role: "student",
      issue_id: null,
      message: "Your account has been approved. You can now log in and submit issues."
    });

    res.json({
      message: "Student approved successfully.",
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        student_id: student.student_id,
        status: student.status
      }
    });
  } catch (error) {
    console.error("Approve student error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   REJECT STUDENT — now requires reason
============================== */
const rejectStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { reject_reason } = req.body;
    const user = req.user;

    if (!reject_reason || reject_reason.trim().length < 20) {
      return res.status(400).json({
        message: "A rejection reason (min 20 characters) is required for accountability."
      });
    }

    const student = await Student.findById(student_id);
    if (!student) return res.status(404).json({ message: "Student not found." });

    if (user.role === "department_admin") {
      if (
        student.campus_id.toString() !== String(user.campus_id) ||
        student.department_id.toString() !== String(user.department_id)
      ) {
        return res.status(403).json({ message: "Unauthorized." });
      }
    } else if (user.role === "management") {
      if (student.campus_id.toString() !== String(user.campus_id)) {
        return res.status(403).json({ message: "Unauthorized." });
      }
    }

    student.status = "suspended";
    await student.save();

    // ✅ NEW: notify student
    await Notification.create({
      recipient_id: student._id,
      recipient_role: "student",
      issue_id: null,
      message: `Your registration was rejected. Reason: ${reject_reason.trim()}`
    });

    res.json({
      message: "Student rejected.",
      student_id: student._id,
      reason: reject_reason.trim()
    });
  } catch (error) {
    console.error("Reject student error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingStudents,
  approveStudent,
  rejectStudent
};