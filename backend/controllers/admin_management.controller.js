const mongoose = require("mongoose");
const Admin = require("../models/admins.model");
const Issue = require("../models/issues.model");
const Feedback = require("../models/feedback.model");
const Notification = require("../models/notifications.model");

/* ==============================
   SUPER ADMIN — LIST ALL ADMINS
============================== */
const listAllAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = {};

    // Filters
    if (req.query.role && ["department_admin", "management", "super_admin"].includes(req.query.role)) {
      filters.role = req.query.role;
    }
    if (req.query.status && ["active", "inactive"].includes(req.query.status)) {
      filters.status = req.query.status;
    }
    if (req.query.campus_id && mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      filters.campus_id = req.query.campus_id;
    }
    if (req.query.department_id && mongoose.Types.ObjectId.isValid(req.query.department_id)) {
      filters.department_id = req.query.department_id;
    }

    // Search by name or email
    if (req.query.search) {
      const safeSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filters.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } }
      ];
    }

    const [admins, total] = await Promise.all([
      Admin.find(filters)
        .select("-password_hash -reset_password_token -reset_password_expires")
        .populate("campus_id", "name")
        .populate("department_id", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Admin.countDocuments(filters)
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error("List admins error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — GET ADMIN DETAIL + STATS
============================== */
const getAdminDetail = async (req, res) => {
  try {
    const { admin_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({ message: "Invalid admin id." });
    }

    const admin = await Admin.findById(admin_id)
      .select("-password_hash -reset_password_token -reset_password_expires")
      .populate("campus_id", "name location")
      .populate("department_id", "name type")
      .lean();

    if (!admin) return res.status(404).json({ message: "Admin not found." });

    const adminObjId = new mongoose.Types.ObjectId(admin_id);

    // Get issue stats
    const [issueStats, feedbackStats, recentIssues] = await Promise.all([
      Issue.aggregate([
        { $match: { assigned_to_admin_id: adminObjId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),
      Feedback.aggregate([
        { $match: { admin_id: adminObjId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avg_rating: { $avg: "$rating" },
            low: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
            high: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
            disputed: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ["$issue_final_status", "resolved"] },
                    { $eq: ["$was_actually_resolved", false] }
                  ]},
                  1, 0
                ]
              }
            }
          }
        }
      ]),
      Issue.find({ assigned_to_admin_id: admin_id })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("title status priority primary_category createdAt updatedAt")
        .lean()
    ]);

    // Build issue stats map
    const issueStatusMap = {
      submitted: 0, under_review: 0, in_progress: 0,
      resolved: 0, closed: 0, rejected: 0
    };
    let totalAssigned = 0;
    issueStats.forEach(s => {
      issueStatusMap[s._id] = s.count;
      totalAssigned += s.count;
    });

    const fb = feedbackStats[0] || { total: 0, avg_rating: 0, low: 0, high: 0, disputed: 0 };

    res.json({
      admin,
      issue_stats: {
        total_assigned: totalAssigned,
        by_status: issueStatusMap,
        resolution_rate: totalAssigned > 0
          ? parseFloat(((issueStatusMap.resolved + issueStatusMap.closed) / totalAssigned * 100).toFixed(2))
          : 0
      },
      feedback_stats: {
        total_feedbacks: fb.total,
        average_rating: fb.avg_rating ? parseFloat(fb.avg_rating.toFixed(2)) : 0,
        low_ratings: fb.low,
        high_ratings: fb.high,
        disputed_resolutions: fb.disputed
      },
      recent_issues: recentIssues
    });
  } catch (error) {
    console.error("Admin detail error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — GET ADMIN'S HANDLED ISSUES
============================== */
const getAdminIssues = async (req, res) => {
  try {
    const { admin_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({ message: "Invalid admin id." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = { assigned_to_admin_id: admin_id };
    if (req.query.status) filters.status = req.query.status;

    const [issues, total] = await Promise.all([
      Issue.find(filters)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("student_id", "name student_id")
        .populate("department_id", "name")
        .populate("campus_id", "name")
        .select("title status priority primary_category subcategory resolution_summary is_anonymous createdAt updatedAt")
        .lean(),
      Issue.countDocuments(filters)
    ]);

    // Anonymize
    const safeIssues = issues.map(i => {
      if (i.is_anonymous) {
        return { ...i, student_id: { name: "Anonymous", student_id: "HIDDEN" } };
      }
      return i;
    });

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      issues: safeIssues
    });
  } catch (error) {
    console.error("Admin issues error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — GET ADMIN'S FEEDBACK
   (Full student identity visible to super admin)
============================== */
const getAdminFeedback = async (req, res) => {
  try {
    const { admin_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({ message: "Invalid admin id." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = { admin_id };
    if (req.query.rating) {
      const r = parseInt(req.query.rating);
      if (r >= 1 && r <= 5) filters.rating = r;
    }
    if (req.query.flagged === "true") filters.flag_for_review = true;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("issue_id", "title status primary_category")
        .populate("student_id", "name student_id email")  // FULL visibility for super admin
        .lean(),
      Feedback.countDocuments(filters)
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      feedbacks
    });
  } catch (error) {
    console.error("Admin feedback error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — ADMIN LEADERBOARD
============================== */
const getAdminLeaderboard = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sortOrder = req.query.sort === "worst" ? 1 : -1;

    const matchStage = { createdAt: { $gte: fromDate } };
    if (req.query.campus_id && mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      matchStage.campus_id = new mongoose.Types.ObjectId(req.query.campus_id);
    }

    const leaderboard = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$admin_id",
          total_feedbacks: { $sum: 1 },
          avg_rating: { $avg: "$rating" },
          total_issues_rated: { $addToSet: "$issue_id" }
        }
      },
      {
        $lookup: {
          from: "admins",
          localField: "_id",
          foreignField: "_id",
          as: "admin"
        }
      },
      { $unwind: "$admin" },
      {
        $lookup: {
          from: "departments",
          localField: "admin.department_id",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $lookup: {
          from: "campuses",
          localField: "admin.campus_id",
          foreignField: "_id",
          as: "campus"
        }
      },
      {
        $project: {
          admin_name: "$admin.name",
          admin_email: "$admin.email",
          admin_status: "$admin.status",
          campus_name: { $arrayElemAt: ["$campus.name", 0] },
          department_name: { $arrayElemAt: ["$department.name", 0] },
          total_feedbacks: 1,
          avg_rating: { $round: ["$avg_rating", 2] },
          issues_rated: { $size: "$total_issues_rated" }
        }
      },
      { $sort: { avg_rating: sortOrder } }
    ]);

    res.json({
      period_days: days,
      sort: sortOrder === 1 ? "worst_first" : "best_first",
      total: leaderboard.length,
      leaderboard
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — SUSPEND / REACTIVATE ADMIN
============================== */
const updateAdminStatus = async (req, res) => {
  try {
    const { admin_id } = req.params;
    const { new_status, reason } = req.body;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(admin_id)) {
      return res.status(400).json({ message: "Invalid admin id." });
    }

    if (!["active", "inactive"].includes(new_status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'." });
    }

    if (!reason || reason.trim().length < 20) {
      return res.status(400).json({
        message: "A reason (min 20 characters) is required for accountability."
      });
    }

    const admin = await Admin.findById(admin_id);
    if (!admin) return res.status(404).json({ message: "Admin not found." });

    // Cannot suspend yourself
    if (admin._id.toString() === String(user.user_id)) {
      return res.status(400).json({ message: "You cannot change your own status." });
    }

    // Cannot suspend other super admins unless you're also super admin
    // (already guaranteed by route-level role check, but double-check)
    if (admin.role === "super_admin") {
      // Count active super admins
      const activeSuperAdmins = await Admin.countDocuments({
        role: "super_admin",
        status: "active"
      });
      if (new_status === "inactive" && activeSuperAdmins <= 1) {
        return res.status(400).json({
          message: "Cannot suspend the last active super admin. System would become unmanageable."
        });
      }
    }

    if (admin.status === new_status) {
      return res.status(400).json({ message: `Admin is already '${new_status}'.` });
    }

    const oldStatus = admin.status;
    admin.status = new_status;
    await admin.save();

    // Notify the admin
    await Notification.create({
      recipient_id: admin._id,
      recipient_role: admin.role,
      issue_id: null,
      message: new_status === "inactive"
        ? `Your account has been suspended by super admin. Reason: ${reason.trim()}`
        : `Your account has been reactivated by super admin. Reason: ${reason.trim()}`
    });

    res.json({
      message: `Admin status changed from '${oldStatus}' to '${new_status}'.`,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status
      },
      reason: reason.trim()
    });
  } catch (error) {
    console.error("Update admin status error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  listAllAdmins,
  getAdminDetail,
  getAdminIssues,
  getAdminFeedback,
  getAdminLeaderboard,
  updateAdminStatus
};