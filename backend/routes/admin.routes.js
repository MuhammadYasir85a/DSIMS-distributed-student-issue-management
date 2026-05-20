const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const { getPendingStudents, approveStudent } = require("../controllers/admin.controller");

const router = express.Router();

// ✅ Only department_admin or management can view pending students
router.get(
  "/pending-students",
  protect,
  authorizeRoles("department_admin", "management", "super_admin"),
  getPendingStudents
);

// ✅ Approve student
router.patch(
  "/approve/:student_id",
  protect,
  authorizeRoles("department_admin", "management", "super_admin"),
  approveStudent
);

module.exports = router;