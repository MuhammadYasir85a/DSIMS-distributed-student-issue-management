const Issue = require("../models/issues.model");

/* ==============================
   ISSUES COUNT BY STATUS
============================== */
const getIssueCountByStatus = async (req, res) => {
  try {
    const result = await Issue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ISSUES COUNT BY DEPARTMENT
============================== */
const getIssueCountByDepartment = async (req, res) => {
  try {
    const result = await Issue.aggregate([
      {
        $group: {
          _id: "$department_id",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   MONTHLY ISSUE TREND
============================== */
const getMonthlyIssueTrend = async (req, res) => {
  try {
    const result = await Issue.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIssueCountByStatus,
  getIssueCountByDepartment,
  getMonthlyIssueTrend
};