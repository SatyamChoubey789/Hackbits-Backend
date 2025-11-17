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
    enum: ['Solo'],
    required: true
  },
  problemStatement: {
    type: String,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Payment related fields
  transactionId: {
    type: String,
    // Payment ID from Razorpay or UPI transaction ID
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
  // Ticket fields (replaces QR code)
  ticketNumber: {
    type: String,
    unique: true,
    sparse: true,
    // Format: HACK2025-001
  },
  ticketQRCode: {
    type: String
    // Small QR code for ticket (optional backup)
  },
  ticketHTML: {
    type: String
    // Full HTML ticket for viewing/printing
  },
  // Check-in fields
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkinTime: {
    type: Date
  },
  checkinBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  rejectionReason: {
    type: String
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
teamSchema.index({ ticketNumber: 1 });
teamSchema.index({ checkedIn: 1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;