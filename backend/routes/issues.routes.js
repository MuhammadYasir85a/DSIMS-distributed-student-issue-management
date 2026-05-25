const express = require("express");
const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createIssue,
  getMyIssues,
  getIssueById,
  getDepartmentIssues,
  updateIssueStatus,
  assignIssueToAdmin,
  updateOwnIssue,
  deleteOwnIssue,
  adminEditIssue,          // ← new
  superAdminDeleteIssue    // ← new
} = require("../controllers/issues.controller");

// Student creates issue
router.post("/", protect, authorizeRoles("student"), createIssue);

// Student views their own issues
router.get("/my", protect, authorizeRoles("student"), getMyIssues);

// Admin views department issues
router.get(
  "/department",
  protect,
  authorizeRoles("department_admin"),
  getDepartmentIssues
);

// Single issue (accessible by owner/admin)
router.get("/:issue_id", protect, getIssueById);

// Admin updates status
router.patch(
  "/:issue_id/status",
  protect,
  authorizeRoles("department_admin"),
  updateIssueStatus
);

// Admin assigns issue
router.patch(
  "/:issue_id/assign",
  protect,
  authorizeRoles("department_admin"),
  assignIssueToAdmin
);


// Student edits own issue (only when status === "submitted")
router.patch(
  "/:issue_id",
  protect,
  authorizeRoles("student"),
  updateOwnIssue
);

// Student deletes own issue (only when status === "submitted")
router.delete(
  "/:issue_id",
  protect,
  authorizeRoles("student"),
  deleteOwnIssue
);


// Admin edits issue details (not status)
router.patch(
  "/:issue_id/admin-edit",
  protect,
  authorizeRoles("department_admin"),
  adminEditIssue
);

// Super admin deletes a resolved/closed issue
router.delete(
  "/:issue_id/super-delete",
  protect,
  authorizeRoles("super_admin"),
  superAdminDeleteIssue
);


module.exports = router;