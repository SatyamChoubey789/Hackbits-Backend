const express = require('express');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const Admin = require('../models/Admin');
const Team = require('../models/Team');
const User = require('../models/User');
const { 
  sendVerificationSuccessEmail, 
  sendVerificationRejectedEmail 
} = require('../utils/emailService');

const router = express.Router();

// Admin authentication middleware
const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Private
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const payload = {
      adminId: admin._id,
      username: admin.username,
      role: admin.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// @route   GET /api/admin/teams
// @desc    Get all teams with payment details
// @access  Private (Admin only)
router.get('/teams', adminAuthMiddleware, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('leader', 'name email registrationNumber phone university')
      .populate('members', 'name email registrationNumber phone university')
      .sort({ createdAt: -1 });

    res.json({ teams });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/teams/:teamId/payment-status
// @desc    Update team payment status, generate QR, and send email
// @access  Private (Admin only)
router.put('/teams/:teamId/payment-status', adminAuthMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { paymentStatus, rejectionReason } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const team = await Team.findById(teamId)
      .populate('leader', 'name email registrationNumber phone university')
      .populate('members', 'name email registrationNumber phone university');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if documents are uploaded
    if (paymentStatus === 'verified' && (!team.paymentScreenshot || !team.idCard)) {
      return res.status(400).json({ 
        message: 'Cannot verify team. Payment screenshot and ID card not uploaded yet.' 
      });
    }

    // Check if payment is completed
    if (paymentStatus === 'verified' && !team.razorpayPaymentId) {
      return res.status(400).json({ 
        message: 'Cannot verify team. Payment not completed yet.' 
      });
    }

    const previousStatus = team.paymentStatus;
    team.paymentStatus = paymentStatus;

    // If verified, generate QR code
    if (paymentStatus === 'verified') {
      // Generate QR Code data
      const qrData = {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber,
        teamSize: team.teamSize,
        leader: {
          name: team.leader.name,
          email: team.leader.email,
          registrationNumber: team.leader.registrationNumber,
          phone: team.leader.phone,
          university: team.leader.university
        },
        members: team.members.map((member) => ({
          name: member.name,
          email: member.email,
          registrationNumber: member.registrationNumber,
          phone: member.phone,
          university: member.university
        })),
        paymentId: team.razorpayPaymentId,
        amount: team.paymentAmount ? team.paymentAmount / 100 : 0,
        verifiedAt: new Date().toISOString(),
        verifiedBy: req.admin.username
      };

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 400,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      team.qrCode = qrCodeDataUrl;
      team.paymentVerifiedAt = new Date();
      team.verifiedBy = req.admin._id;

      await team.save();

      // Send verification success email with QR code
      const emailData = {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber,
        teamSize: team.teamSize,
        leaderName: team.leader.name,
        leaderEmail: team.leader.email,
        paymentId: team.razorpayPaymentId,
        amount: team.paymentAmount ? team.paymentAmount / 100 : 0,
        verifiedAt: team.paymentVerifiedAt,
        qrCode: qrCodeDataUrl,
        members: team.members
      };

      // Send email asynchronously
      sendVerificationSuccessEmail(emailData).catch(err => {
        console.error("Failed to send verification email:", err);
      });

    } else if (paymentStatus === 'rejected') {
      // Clear QR code if rejected
      team.qrCode = null;
      team.paymentVerifiedAt = null;
      team.verifiedBy = null;

      await team.save();

      // Send rejection email
      const emailData = {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber,
        leaderName: team.leader.name,
        leaderEmail: team.leader.email,
        reason: rejectionReason || 'Payment or document verification failed'
      };

      // Send email asynchronously
      sendVerificationRejectedEmail(emailData).catch(err => {
        console.error("Failed to send rejection email:", err);
      });
    } else {
      // Just update status to pending
      await team.save();
    }

    // Populate team data for response
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email registrationNumber phone university')
      .populate('members', 'name email registrationNumber phone university');

    const message = paymentStatus === 'verified' 
      ? 'Payment verified, QR code generated, and confirmation email sent'
      : paymentStatus === 'rejected'
      ? 'Payment rejected and notification email sent'
      : 'Status updated to pending';

    res.json({
      message: message,
      team: updatedTeam
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/change-password
// @desc    Change admin password
// @access  Private (Admin only)
router.put('/change-password', adminAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();
    const verifiedPayments = await Team.countDocuments({ paymentStatus: 'verified' });
    const pendingPayments = await Team.countDocuments({ paymentStatus: 'pending' });
    const rejectedPayments = await Team.countDocuments({ paymentStatus: 'rejected' });
    const totalUsers = await User.countDocuments();
    const paymentsCompleted = await Team.countDocuments({ razorpayPaymentId: { $exists: true, $ne: null } });
    const documentsUploaded = await Team.countDocuments({ 
      paymentScreenshot: { $exists: true, $ne: null },
      idCard: { $exists: true, $ne: null }
    });

    res.json({
      stats: {
        totalTeams,
        verifiedPayments,
        pendingPayments,
        rejectedPayments,
        totalUsers,
        paymentsCompleted,
        documentsUploaded,
        paymentVerificationRate: totalTeams > 0 ? ((verifiedPayments / totalTeams) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;