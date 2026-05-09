const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    recipient_role: {
      type: String,
      enum: ["student", "department_admin", "management", "super_admin"],
      required: true,
    },
    issue_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

notificationSchema.index({ recipient_id: 1, is_read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);