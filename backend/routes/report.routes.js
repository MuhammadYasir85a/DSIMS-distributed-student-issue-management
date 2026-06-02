const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getIssueCountByStatus,
  getIssueCountByCategory,
  getMonthlyIssueTrend,
  getResolutionMetrics,
  getDepartmentPerformance
} = require("../controllers/report.controller");

const router = express.Router();

router.get(
  "/status-count",
  protect,
  authorizeRoles("management", "super_admin"),
  getIssueCountByStatus
);

router.get(
  "/category-count",                                      // ✅ FIXED: added missing path
  protect,
  authorizeRoles("management", "super_admin"),
  getIssueCountByCategory
);

router.get(
  "/monthly-trend",
  protect,
  authorizeRoles("management", "super_admin"),
  getMonthlyIssueTrend
);

// ✅ NEW: Resolution time KPIs
router.get(
  "/resolution-metrics",
  protect,
  authorizeRoles("management", "super_admin"),
  getResolutionMetrics
);

// ✅ NEW: Per-department performance
router.get(
  "/department-performance",
  protect,
  authorizeRoles("management", "super_admin"),
  getDepartmentPerformance
);

module.exports = router;