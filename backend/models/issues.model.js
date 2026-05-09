const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    updater_role: {
      type: String,
      enum: ["department_admin", "management", "super_admin"],
      required: true,
    },
    message: { type: String, required: true },
    old_status: { type: String },
    new_status: { type: String },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    file_name: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "in_progress",
        "resolved",
        "closed",
        "rejected",
      ],
      default: "submitted",
    },
    campus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    assigned_to_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    attachments: [attachmentSchema],
    updates: [updateSchema],
    is_anonymous: { type: Boolean, default: false },
    resolution_summary: { type: String, default: null },
  },
  { timestamps: true }
);

// Enterprise indexes
issueSchema.index({ campus_id: 1 });
issueSchema.index({ department_id: 1, status: 1 });
issueSchema.index({ student_id: 1 });
issueSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Issue", issueSchema);