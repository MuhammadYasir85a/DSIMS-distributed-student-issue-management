const mongoose = require("mongoose");
const Issue = require("../models/issues.model");

/* ==============================
   Helper — build match stage
============================== */
const buildMatchStage = (req) => {
  const matchStage = {};
  const user = req.user;

  if (user.role === "management") {
    matchStage.campus_id = new mongoose.Types.ObjectId(user.campus_id);
  } else if (req.query.campus_id) {
    if (mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      matchStage.campus_id = new mongoose.Types.ObjectId(req.query.campus_id);
    }
  }

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
          _id: { primary_category: "$primary_category", subcategory: "$subcategory" },
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
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
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

/* ==============================
   RESOLUTION METRICS (NEW)
============================== */
const getResolutionMetrics = async (req, res) => {
  try {
    const matchStage = buildMatchStage(req);
    matchStage.status = { $in: ["resolved", "closed"] };

    const result = await Issue.aggregate([
      { $match: matchStage },
      {
        $project: {
          primary_category: 1,
          resolution_time_hours: {
            $divide: [
              { $subtract: ["$updatedAt", "$createdAt"] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $group: {
          _id: "$primary_category",
          avg_hours: { $avg: "$resolution_time_hours" },
          min_hours: { $min: "$resolution_time_hours" },
          max_hours: { $max: "$resolution_time_hours" },
          count: { $sum: 1 }
        }
      },
      { $sort: { avg_hours: -1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Resolution metrics error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   DEPARTMENT PERFORMANCE (NEW)
============================== */
const getDepartmentPerformance = async (req, res) => {
  try {
    const matchStage = buildMatchStage(req);

    const result = await Issue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$department_id",
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          closed:   { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          pending:  { $sum: { $cond: [{ $in: ["$status", ["submitted", "under_review"]] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: "$department" },
      {
        $project: {
          department_name: "$department.name",
          total: 1,
          resolved: 1,
          closed: 1,
          pending: 1,
          rejected: 1,
          resolution_rate: {
            $cond: [
              { $eq: ["$total", 0] },
              0,
              { $multiply: [{ $divide: [{ $add: ["$resolved", "$closed"] }, "$total"] }, 100] }
            ]
          }
        }
      },
      { $sort: { resolution_rate: -1 } }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Department performance error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIssueCountByStatus,
  getIssueCountByCategory,
  getMonthlyIssueTrend,
  getResolutionMetrics,
  getDepartmentPerformance
};