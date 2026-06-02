const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,   // ✅ FIXED: was missing type
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
      required: false,                        // ✅ FIXED: allow system notifs without an issue
      default: null,
    },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: true }                        // ✅ FIXED: use auto timestamps
);

notificationSchema.index({ recipient_id: 1, is_read: 1 });
notificationSchema.index({ recipient_id: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);