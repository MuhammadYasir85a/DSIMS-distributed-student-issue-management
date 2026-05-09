const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { createIssue, getDepartmentIssues, updateIssueStatus, assignIssueToAdmin } = require("../controllers/issues.controller");
const router = express.Router();

// ✅ Student creates issue
router.post(
  "/",
  protect,
  authorizeRoles("student"),
  createIssue
);

// ✅ Admin views department issues
router.get(
  "/department",
  protect,
  authorizeRoles("department_admin"),
  getDepartmentIssues
);

router.patch(
  "/:issue_id/status",
  protect,
  authorizeRoles("department_admin"),
  updateIssueStatus
);


router.patch(
  "/:issue_id/assign",
  protect,
  authorizeRoles("department_admin"),
  assignIssueToAdmin
);

module.exports = router;