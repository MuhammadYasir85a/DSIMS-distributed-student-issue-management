const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    contact_no: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "student",
      enum: ["student"],
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("Student", studentSchema);