const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

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
  adminEditIssue,
  superAdminDeleteIssue,
  reopenIssue,
  getStudentDashboardStats,
  getAdminDashboardStats,
  getAllIssuesSuperAdmin
} = require("../controllers/issues.controller");

// ✅ Per-user rate limit on issue creation (anti-spam)
// Uses ipKeyGenerator helper to handle IPv6 properly
const issueCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 10,                    // 10 issues per hour per user
  keyGenerator: (req, res) => {
    // Prefer user ID if logged in, otherwise fall back to IP (with IPv6 helper)
    return req.user?.user_id?.toString() || ipKeyGenerator(req, res);
  },
  message: { message: "Too many issues created in a short time. Please wait." },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================
// Dashboard stats (specific paths first)
// ============================
router.get("/dashboard/student", protect, authorizeRoles("student"), getStudentDashboardStats);
router.get("/dashboard/admin",   protect, authorizeRoles("department_admin"), getAdminDashboardStats);

// ============================
// Super admin — view ALL issues (read-only, cross-campus)
// IMPORTANT: This must come BEFORE /:issue_id route
// ============================
router.get("/all", protect, authorizeRoles("super_admin"), getAllIssuesSuperAdmin);

// ============================
// Student-side
// ============================
router.post("/", protect, authorizeRoles("student"), issueCreationLimiter, createIssue);
router.get("/my", protect, authorizeRoles("student"), getMyIssues);

// ============================
// Admin-side list
// ============================
router.get("/department", protect, authorizeRoles("department_admin"), getDepartmentIssues);

// ============================
// Admin status / assign / edit
// ============================
router.patch("/:issue_id/status",     protect, authorizeRoles("department_admin"), updateIssueStatus);
router.patch("/:issue_id/assign",     protect, authorizeRoles("department_admin"), assignIssueToAdmin);
router.patch("/:issue_id/admin-edit", protect, authorizeRoles("department_admin"), adminEditIssue);

// ============================
// Student reopen
// ============================
router.patch("/:issue_id/reopen", protect, authorizeRoles("student"), reopenIssue);

// ============================
// Super admin delete (specific path before /:issue_id)
// ============================
router.delete("/:issue_id/super-delete", protect, authorizeRoles("super_admin"), superAdminDeleteIssue);

// ============================
// Student edit / delete own issue
// ============================
router.patch("/:issue_id",  protect, authorizeRoles("student"), updateOwnIssue);
router.delete("/:issue_id", protect, authorizeRoles("student"), deleteOwnIssue);

// ============================
// Single issue (placed LAST so it doesn't catch other paths)
// ============================
router.get("/:issue_id", protect, getIssueById);

module.exports = router;