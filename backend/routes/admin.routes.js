const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getPendingStudents,
  approveStudent,
  rejectStudent
} = require("../controllers/admin.controller");

router.get(
  "/pending-students",
  protect,
  authorizeRoles("department_admin", "management", "super_admin"),
  getPendingStudents
);

router.patch(
  "/approve/:student_id",
  protect,
  authorizeRoles("department_admin", "management", "super_admin"),
  approveStudent
);

router.patch(
  "/reject/:student_id",
  protect,
  authorizeRoles("department_admin", "management", "super_admin"),
  rejectStudent
);

module.exports = router;