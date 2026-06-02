const mongoose = require("mongoose");
const Feedback = require("../models/feedback.model");
const Issue = require("../models/issues.model");
const Notification = require("../models/notifications.model");

const FEEDBACK_WINDOW_DAYS = 14;

/* ==============================
   STUDENT — SUBMIT FEEDBACK
============================== */
const submitFeedback = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const {
      rating,
      was_actually_resolved,
      comment,
      flag_for_review
    } = req.body;

    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    if (rating == null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating is required and must be an integer between 1 and 5." });
    }

    if (typeof was_actually_resolved !== "boolean") {
      return res.status(400).json({
        message: "was_actually_resolved is required (true or false)."
      });
    }

    if (comment && comment.length > 2000) {
      return res.status(400).json({ message: "Comment too long (max 2000 chars)." });
    }

    // flag_for_review requires a meaningful comment
    if (flag_for_review === true) {
      if (!comment || comment.trim().length < 30) {
        return res.status(400).json({
          message: "When flagging for super admin review, a comment of at least 30 characters is required explaining the issue."
        });
      }
    }

    const issue = await Issue.findById(issue_id);
    if (!issue) return res.status(404).json({ message: "Issue not found." });

    // Ownership
    if (issue.student_id.toString() !== String(user.user_id)) {
      return res.status(403).json({
        message: "You can only give feedback on your own issues."
      });
    }

    // Must be final state
    if (!["resolved", "closed", "rejected"].includes(issue.status)) {
      return res.status(400).json({
        message: `Feedback can only be given for resolved, closed, or rejected issues. Current status: '${issue.status}'.`
      });
    }

    // Must have been assigned
    if (!issue.assigned_to_admin_id) {
      return res.status(400).json({
        message: "Cannot give feedback — this issue was never assigned to an admin."
      });
    }

    // Feedback window
    const windowMs = FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const issueAge = Date.now() - new Date(issue.updatedAt).getTime();
    if (issueAge > windowMs) {
      return res.status(400).json({
        message: `Feedback window has closed. You can only submit feedback within ${FEEDBACK_WINDOW_DAYS} days of resolution.`
      });
    }

    // One feedback per issue
    const existing = await Feedback.findOne({ issue_id });
    if (existing) {
      return res.status(400).json({
        message: "You have already submitted feedback for this issue."
      });
    }

    // Determine escalation
    const requires_super_admin_attention =
      rating <= 2 ||
      flag_for_review === true ||
      (was_actually_resolved === false && issue.status === "resolved");

    const feedback = await Feedback.create({
      issue_id,
      student_id: user.user_id,
      admin_id: issue.assigned_to_admin_id,
      issue_final_status: issue.status,
      rating,
      was_actually_resolved,
      comment: comment ? comment.trim() : null,
      flag_for_review: flag_for_review === true,
      requires_super_admin_attention,
      campus_id: issue.campus_id,
      department_id: issue.department_id
    });

    // Notify admin (anonymous — no student reference)
    await Notification.create({
      recipient_id: issue.assigned_to_admin_id,
      recipient_role: "department_admin",
      issue_id: issue._id,
      message: `You received feedback on a handled issue. Rating: ${rating}/5.`
    });

    // If escalated, notify super admins
    if (requires_super_admin_attention) {
      await Notification.create({
        recipient_id: user.user_id,
        recipient_role: "super_admin",
        issue_id: issue._id,
        message: `⚠️ Negative feedback received on issue "${issue.title}". Rating: ${rating}/5. Needs super admin review.`
      });
    }

    res.status(201).json({
      message: "Feedback submitted successfully. Thank you for helping improve the system.",
      escalated: requires_super_admin_attention,
      feedback: {
        _id: feedback._id,
        rating: feedback.rating,
        was_actually_resolved: feedback.was_actually_resolved,
        flagged: feedback.flag_for_review,
        escalated_to_super_admin: requires_super_admin_attention
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted feedback for this issue."
      });
    }
    console.error("Submit feedback error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   STUDENT — GET MY FEEDBACK FOR AN ISSUE
============================== */
const getMyFeedback = async (req, res) => {
  try {
    const { issue_id } = req.params;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(issue_id)) {
      return res.status(400).json({ message: "Invalid issue id." });
    }

    const feedback = await Feedback.findOne({
      issue_id,
      student_id: user.user_id
    })
      .populate("issue_id", "title status")
      .lean();

    if (!feedback) {
      return res.status(404).json({ message: "No feedback submitted yet for this issue." });
    }

    // Student sees their own feedback but not super admin notes
    delete feedback.super_admin_notes;
    delete feedback.super_admin_reviewed;
    delete feedback.super_admin_reviewed_by;

    res.json({ feedback });
  } catch (error) {
    console.error("Get my feedback error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ADMIN — VIEW FEEDBACK ON OWN HANDLED ISSUES
   (Student identity COMPLETELY HIDDEN)
============================== */
const getMyAdminFeedback = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = { admin_id: user.user_id };
    if (req.query.rating) {
      const r = parseInt(req.query.rating);
      if (r >= 1 && r <= 5) filters.rating = r;
    }

    const [feedbacks, total] = await Promise.all([
      Feedback.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("issue_id", "title primary_category subcategory status")
        .lean(),
      Feedback.countDocuments(filters)
    ]);

    // STRIP student identity completely
    const safeFeedbacks = feedbacks.map(f => {
      const { student_id, super_admin_notes, super_admin_reviewed, super_admin_reviewed_by, ...rest } = f;
      return { ...rest, student_id: null };
    });

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      feedbacks: safeFeedbacks
    });
  } catch (error) {
    console.error("Get admin feedback error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   ADMIN — VIEW OWN PERFORMANCE SUMMARY
============================== */
const getMyAdminSummary = async (req, res) => {
  try {
    const user = req.user;
    const days = parseInt(req.query.days) || 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const adminId = new mongoose.Types.ObjectId(user.user_id);

    const [stats, ratingBreakdown, recentFeedback] = await Promise.all([
      Feedback.aggregate([
        { $match: { admin_id: adminId, createdAt: { $gte: fromDate } } },
        {
          $group: {
            _id: null,
            total_feedbacks: { $sum: 1 },
            avg_rating: { $avg: "$rating" },
            low_ratings: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
            high_ratings: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
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
      Feedback.aggregate([
        { $match: { admin_id: adminId, createdAt: { $gte: fromDate } } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Feedback.find({ admin_id: user.user_id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("issue_id", "title status")
        .select("rating was_actually_resolved comment createdAt")
        .lean()
    ]);

    const summary = stats[0] || {
      total_feedbacks: 0, avg_rating: 0, low_ratings: 0, high_ratings: 0, disputed: 0
    };

    // Build rating breakdown
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingBreakdown.forEach(r => { breakdown[r._id] = r.count; });

    // Strip student info from recent
    const safeRecent = recentFeedback.map(f => {
      const { student_id, ...rest } = f;
      return rest;
    });

    res.json({
      period_days: days,
      summary: {
        total_feedbacks: summary.total_feedbacks,
        average_rating: summary.avg_rating ? parseFloat(summary.avg_rating.toFixed(2)) : 0,
        low_ratings: summary.low_ratings,
        high_ratings: summary.high_ratings,
        disputed_resolutions: summary.disputed
      },
      rating_breakdown: breakdown,
      recent_feedback: safeRecent
    });
  } catch (error) {
    console.error("Admin summary error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — GET ESCALATED FEEDBACKS
============================== */
const getEscalatedFeedbacks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filters = { requires_super_admin_attention: true };
    if (req.query.unreviewed === "true") filters.super_admin_reviewed = false;
    if (req.query.campus_id && mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      filters.campus_id = req.query.campus_id;
    }
    if (req.query.department_id && mongoose.Types.ObjectId.isValid(req.query.department_id)) {
      filters.department_id = req.query.department_id;
    }

    const [feedbacks, total, unreviewedCount] = await Promise.all([
      Feedback.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("issue_id", "title primary_category subcategory status resolution_summary")
        .populate("student_id", "name student_id email")
        .populate("admin_id", "name email")
        .populate("department_id", "name")
        .populate("campus_id", "name")
        .lean(),
      Feedback.countDocuments(filters),
      Feedback.countDocuments({
        requires_super_admin_attention: true,
        super_admin_reviewed: false
      })
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreviewed_count: unreviewedCount,
      feedbacks
    });
  } catch (error) {
    console.error("Get escalated feedback error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — REVIEW FEEDBACK
============================== */
const reviewFeedback = async (req, res) => {
  try {
    const { feedback_id } = req.params;
    const { super_admin_notes } = req.body;
    const user = req.user;

    if (!mongoose.Types.ObjectId.isValid(feedback_id)) {
      return res.status(400).json({ message: "Invalid feedback id." });
    }

    if (!super_admin_notes || super_admin_notes.trim().length < 20) {
      return res.status(400).json({
        message: "Review notes are required (min 20 characters)."
      });
    }

    const feedback = await Feedback.findById(feedback_id);
    if (!feedback) return res.status(404).json({ message: "Feedback not found." });

    feedback.super_admin_reviewed = true;
    feedback.super_admin_reviewed_by = user.user_id;
    feedback.super_admin_notes = super_admin_notes.trim();
    await feedback.save();

    // Notify admin (anonymous — no student mention)
    await Notification.create({
      recipient_id: feedback.admin_id,
      recipient_role: "department_admin",
      issue_id: feedback.issue_id,
      message: "Super admin has reviewed feedback on one of your handled issues."
    });

    res.json({
      message: "Feedback reviewed successfully.",
      feedback
    });
  } catch (error) {
    console.error("Review feedback error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   SUPER ADMIN — ADMIN PERFORMANCE REPORT
============================== */
const getAdminPerformanceReport = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const matchStage = { createdAt: { $gte: fromDate } };
    if (req.query.campus_id && mongoose.Types.ObjectId.isValid(req.query.campus_id)) {
      matchStage.campus_id = new mongoose.Types.ObjectId(req.query.campus_id);
    }

    const report = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$admin_id",
          total_feedbacks: { $sum: 1 },
          avg_rating: { $avg: "$rating" },
          low_ratings: { $sum: { $cond: [{ $lte: ["$rating", 2] }, 1, 0] } },
          high_ratings: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
          flagged_count: { $sum: { $cond: ["$flag_for_review", 1, 0] } },
          disputed_resolutions: {
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
          low_ratings: 1,
          high_ratings: 1,
          flagged_count: 1,
          disputed_resolutions: 1,
          performance_flag: {
            $cond: [
              {
                $or: [
                  { $lt: ["$avg_rating", 3] },
                  { $gte: ["$low_ratings", 3] },
                  { $gte: ["$disputed_resolutions", 2] }
                ]
              },
              "NEEDS_REVIEW",
              "OK"
            ]
          }
        }
      },
      { $sort: { avg_rating: 1 } }
    ]);

    res.json({
      report_window_days: days,
      total_admins_with_feedback: report.length,
      flagged_admins: report.filter(a => a.performance_flag === "NEEDS_REVIEW").length,
      admins: report
    });
  } catch (error) {
    console.error("Admin performance report error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getMyFeedback,
  getMyAdminFeedback,
  getMyAdminSummary,
  getEscalatedFeedbacks,
  reviewFeedback,
  getAdminPerformanceReport
};