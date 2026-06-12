const mongoose = require("mongoose");

const resourceRequestSchema = new mongoose.Schema(
  {
    requester_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    campus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    request_type: {
      type: String,
      enum: ["budget", "equipment", "staff", "permission", "other"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    review_remarks: {
      type: String,
      default: "",
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

resourceRequestSchema.index({ campus_id: 1, status: 1, createdAt: -1 });
resourceRequestSchema.index({ requester_id: 1, createdAt: -1 });

module.exports = mongoose.model("ResourceRequest", resourceRequestSchema);