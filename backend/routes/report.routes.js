const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getIssueCountByStatus,
  getIssueCountByCategory,
  getMonthlyIssueTrend
} = require("../controllers/report.controller");

const router = express.Router();

router.get(
  "/status-count",
  protect,
  authorizeRoles("management", "super_admin"),
  getIssueCountByStatus
);

router.get(
  "/category-count",
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

module.exports = router;