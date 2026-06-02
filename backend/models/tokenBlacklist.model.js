const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    expires_at: {
      type: Date,
      required: true,
      // ✅ MongoDB TTL — auto-deletes expired tokens
      expires: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);