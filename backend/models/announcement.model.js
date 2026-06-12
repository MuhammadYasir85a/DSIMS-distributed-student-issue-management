const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    campus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    recipients_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ campus_id: 1, createdAt: -1 });

module.exports = mongoose.model("Announcement", announcementSchema);