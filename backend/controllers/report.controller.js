const mongoose = require("mongoose");
const Issue = require("../models/issues.model");

/* ==============================
   Helper — build match stage
============================== */
const buildMatchStage = (req) => {
  const matchStage = {};
  const user = req.user;

  // ✅ Multi-campus isolation
  if (user.role === "management") {
    matchStage.campus_id = new mongoose.Types.ObjectId(user.campus_id);
  } else if (req.query.campus_id) {
    if (mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      matchStage.campus_id = new mongoose.Types.ObjectId(req.query.campus_id);
    }
  }

  // ✅ Optional date filter
  if (req.query.from || req.query.to) {
    matchStage.createdAt = {};
    if (req.query.from) matchStage.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) matchStage.createdAt.$lte = new Date(req.query.to);
  }

  return matchStage;
};

/* ==============================
   ISSUES COUNT BY STATUS
============================== */
const getIssueCountByStatus = async (req, res) => {
  try {
    const matchStage = buildMatchStage(req);

    const result = await Issue.aggregate([
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Status count error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ISSUES COUNT BY CATEGORY
============================== */
const getIssueCountByCategory = async (req, res) => {
  try {
    const matchStage = buildMatchStage(req);

    const result = await Issue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            primary_category: "$primary_category",
            subcategory: "$subcategory"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Category count error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   MONTHLY ISSUE TREND
============================== */
const getMonthlyIssueTrend = async (req, res) => {
  try {
    const matchStage = buildMatchStage(req);

    const result = await Issue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Monthly trend error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIssueCountByStatus,
  getIssueCountByCategory,
  getMonthlyIssueTrend
};