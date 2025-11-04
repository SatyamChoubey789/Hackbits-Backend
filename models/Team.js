const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    problemStatement: {
      type: String,
      required: true,
    },
    teamSize: {
      type: String,
      enum: ["Solo", "Duo", "Team"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    // Payment related fields
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    paymentAmount: {
      type: Number, // Amount in paise
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    // QR Code
    qrCode: {
      type: String, // Base64 encoded QR code data URL
      default: null,
    },
    // Legacy payment screenshot fields (keep for backward compatibility)
    paymentScreenshot: {
      type: String,
      default: null,
    },
    paymentScreenshotCloudinaryId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Team", teamSchema);