const Student = require("../models/students.model");

/* ==============================
   GET PENDING STUDENTS
============================== */
const getPendingStudents = async (req, res) => {
  try {
    const students = await Student.find({
      status: "pending",
      is_email_verified: true
    }).select("name email student_id campus_id department_id");

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   APPROVE STUDENT
============================== */
const approveStudent = async (req, res) => {
  try {
    const { student_id } = req.params;

    const student = await Student.findById(student_id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    student.status = "active";
    await student.save();

    res.json({ message: "Student approved successfully." });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingStudents,
  approveStudent
};