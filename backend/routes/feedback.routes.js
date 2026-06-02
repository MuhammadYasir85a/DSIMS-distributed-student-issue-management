const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  submitFeedback,
  getMyFeedback,
  getMyAdminFeedback,
  getMyAdminSummary,
  getEscalatedFeedbacks,
  reviewFeedback,
  getAdminPerformanceReport
} = require("../controllers/feedback.controller");

// ============================
// Super admin
// ============================
router.get(
  "/admin-performance",
  protect,
  authorizeRoles("super_admin"),
  getAdminPerformanceReport
);

router.get(
  "/escalated",
  protect,
  authorizeRoles("super_admin"),
  getEscalatedFeedbacks
);

router.patch(
  "/:feedback_id/review",
  protect,
  authorizeRoles("super_admin"),
  reviewFeedback
);

// ============================
// Department admin
// ============================
router.get(
  "/my-admin-feedback",
  protect,
  authorizeRoles("department_admin"),
  getMyAdminFeedback
);

router.get(
  "/my-summary",
  protect,
  authorizeRoles("department_admin"),
  getMyAdminSummary
);

// ============================
// Student
// ============================
router.post(
  "/issue/:issue_id",
  protect,
  authorizeRoles("student"),
  submitFeedback
);

router.get(
  "/issue/:issue_id/my",
  protect,
  authorizeRoles("student"),
  getMyFeedback
);

module.exports = router;