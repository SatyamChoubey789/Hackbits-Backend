const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamSize: {
    type: String,
    enum: ['Solo', 'Duo', 'Team'],
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Payment related fields
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  paymentAmount: {
    type: Number
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  paymentCompletedAt: {
    type: Date
  },
  paymentVerifiedAt: {
    type: Date
  },
  // Document upload fields
  paymentScreenshot: {
    type: String  // Cloudinary URL
  },
  paymentScreenshotCloudinaryId: {
    type: String
  },
  idCard: {
    type: String  // Cloudinary URL
  },
  idCardCloudinaryId: {
    type: String
  },
  documentsUploadedAt: {
    type: Date
  },
  // QR Code
  qrCode: {
    type: String  // Data URL
  },
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },checkedIn: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  checkInCount: {
    type: Number,
    default: 0
  },
  checkInHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    method: {
      type: String,
      enum: ['qr_scan', 'manual_entry'],
      default: 'qr_scan'
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
teamSchema.index({ leader: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ registrationNumber: 1 });
teamSchema.index({ paymentStatus: 1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;