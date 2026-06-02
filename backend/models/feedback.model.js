const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      unique: true
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
    issue_final_status: {
      type: String,
      enum: ["resolved", "rejected", "closed"],
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    was_actually_resolved: {
      type: Boolean,
      required: true
    },
    comment: {
      type: String,
      maxlength: 2000,
      trim: true,
      default: null
    },
    flag_for_review: {
      type: Boolean,
      default: false
    },
    requires_super_admin_attention: {
      type: Boolean,
      default: false
    },
    super_admin_reviewed: {
      type: Boolean,
      default: false
    },
    super_admin_reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },
    super_admin_notes: {
      type: String,
      default: null,
      maxlength: 2000
    },
    campus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    }
  },
  { timestamps: true }
);

feedbackSchema.index({ admin_id: 1, createdAt: -1 });
feedbackSchema.index({ requires_super_admin_attention: 1, super_admin_reviewed: 1 });
feedbackSchema.index({ campus_id: 1, department_id: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ student_id: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);