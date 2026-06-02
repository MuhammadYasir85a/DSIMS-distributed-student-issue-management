const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["department_admin", "management", "super_admin"],
    },
    campus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },                                            // ✅ FIXED: Added missing closing brace
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // ✅ NEW: track last login for security audits
    last_login: {
      type: Date,
      default: null,
    },
    // ✅ NEW: password reset support for admins too
    reset_password_token: {
      type: String,
      default: null,
    },
    reset_password_expires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }   // ✅ FIXED: enable auto timestamps instead of manual created_at
);

adminSchema.index({ campus_id: 1 });

module.exports = mongoose.model("Admin", adminSchema);