const express = require("express");
const protect = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  getIssueCountByStatus,
  getIssueCountByDepartment,
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
  "/department-count",
  protect,
  authorizeRoles("management", "super_admin"),
  getIssueCountByDepartment
);

router.get(
  "/monthly-trend",
  protect,
  authorizeRoles("management", "super_admin"),
  getMonthlyIssueTrend
);

module.exports = router;