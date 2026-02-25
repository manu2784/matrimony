const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  tokenHash: String,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
exports.RefreshToken = RefreshToken;
