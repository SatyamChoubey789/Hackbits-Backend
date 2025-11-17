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
  problemStatement: {
    type: String,
    // Not required anymore
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Manual Payment related fields (UPI/QR payment)
  transactionId: {
    type: String,
    // UTR/Transaction ID from UPI payment
  },
  paymentAmount: {
    type: Number
    // Amount in paise (500 rupees = 50000 paise)
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  paymentCompletedAt: {
    type: Date
    // When user submitted transaction ID
  },
  paymentVerifiedAt: {
    type: Date
    // When admin verified the payment
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
  // QR Code for event entry
  qrCode: {
    type: String  // Data URL - generated after admin verification
  },
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectionReason: {
    type: String
    // Reason if payment/verification is rejected
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster queries
teamSchema.index({ leader: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ registrationNumber: 1 });
teamSchema.index({ paymentStatus: 1 });
teamSchema.index({ transactionId: 1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;