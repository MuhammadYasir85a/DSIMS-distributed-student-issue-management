const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  listAllAdmins,
  getAdminDetail,
  getAdminIssues,
  getAdminFeedback,
  getAdminLeaderboard,
  updateAdminStatus
} = require("../controllers/admin_management.controller");

// All routes require super_admin
router.get("/", protect, authorizeRoles("super_admin"), listAllAdmins);
router.get("/leaderboard", protect, authorizeRoles("super_admin"), getAdminLeaderboard);
router.get("/:admin_id", protect, authorizeRoles("super_admin"), getAdminDetail);
router.get("/:admin_id/issues", protect, authorizeRoles("super_admin"), getAdminIssues);
router.get("/:admin_id/feedback", protect, authorizeRoles("super_admin"), getAdminFeedback);
router.patch("/:admin_id/status", protect, authorizeRoles("super_admin"), updateAdminStatus);



module.exports = router;