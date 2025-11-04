const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Team = require('../models/Team');
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

// @route   POST /api/checkin
// @desc    Check-in a team using QR code data
// @access  Private (Admin only)
router.post('/', adminAuthMiddleware, async (req, res) => {
  try {
    const { registrationNumber, method = 'qr_scan' } = req.body;

    if (!registrationNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Registration number is required' 
      });
    }

    // Find team by registration number
    const team = await Team.findOne({ registrationNumber })
      .populate('leader', 'name email registrationNumber phone university')
      .populate('members', 'name email registrationNumber phone university');

    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found with this registration number' 
      });
    }

    // Check if payment is verified
    if (team.paymentStatus !== 'verified') {
      return res.status(400).json({ 
        success: false,
        message: 'Team payment not verified. Cannot check-in.',
        paymentStatus: team.paymentStatus
      });
    }

    // Check if already checked in
    if (team.checkedIn) {
      return res.status(200).json({ 
        success: false,
        alreadyCheckedIn: true,
        message: 'Team already checked in',
        checkInTime: team.checkInTime,
        checkInCount: team.checkInCount,
        team: {
          teamName: team.teamName,
          registrationNumber: team.registrationNumber,
          teamSize: team.teamSize,
          leader: team.leader,
          members: team.members,
          checkInTime: team.checkInTime,
          checkedIn: team.checkedIn
        }
      });
    }

    // Perform check-in
    team.checkedIn = true;
    team.checkInTime = new Date();
    team.checkedInBy = req.admin._id;
    team.checkInCount += 1;
    
    // Add to history
    team.checkInHistory.push({
      timestamp: new Date(),
      checkedInBy: req.admin._id,
      method: method
    });

    await team.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      team: {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber,
        teamSize: team.teamSize,
        leader: team.leader,
        members: team.members,
        checkInTime: team.checkInTime,
        checkedIn: team.checkedIn,
        checkInCount: team.checkInCount
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during check-in' 
    });
  }
});

// @route   GET /api/checkin/stats
// @desc    Get check-in statistics
// @access  Private (Admin only)
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments({ paymentStatus: 'verified' });
    const checkedInTeams = await Team.countDocuments({ checkedIn: true });
    const pendingCheckIns = totalTeams - checkedInTeams;

    // Get recent check-ins (last 10)
    const recentCheckIns = await Team.find({ checkedIn: true })
      .select('teamName registrationNumber checkInTime leader')
      .populate('leader', 'name email')
      .sort({ checkInTime: -1 })
      .limit(10);

    res.json({
      stats: {
        totalVerifiedTeams: totalTeams,
        checkedInTeams,
        pendingCheckIns,
        checkInRate: totalTeams > 0 ? ((checkedInTeams / totalTeams) * 100).toFixed(1) : 0
      },
      recentCheckIns
    });

  } catch (error) {
    console.error('Get check-in stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/checkin/history
// @desc    Get all checked-in teams
// @access  Private (Admin only)
router.get('/history', adminAuthMiddleware, async (req, res) => {
  try {
    const checkedInTeams = await Team.find({ checkedIn: true })
      .populate('leader', 'name email registrationNumber phone university')
      .populate('members', 'name email registrationNumber phone university')
      .populate('checkedInBy', 'username')
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: checkedInTeams.length,
      teams: checkedInTeams
    });

  } catch (error) {
    console.error('Get check-in history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/checkin/undo/:teamId
// @desc    Undo check-in for a team
// @access  Private (Admin only)
router.post('/undo/:teamId', adminAuthMiddleware, async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ 
        success: false,
        message: 'Team not found' 
      });
    }

    if (!team.checkedIn) {
      return res.status(400).json({ 
        success: false,
        message: 'Team is not checked in' 
      });
    }

    team.checkedIn = false;
    team.checkInTime = null;
    team.checkedInBy = null;
    
    await team.save();

    res.json({
      success: true,
      message: 'Check-in undone successfully',
      team: {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber
      }
    });

  } catch (error) {
    console.error('Undo check-in error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   POST /api/checkin/verify
// @desc    Verify if a team can be checked in (without actually checking in)
// @access  Private (Admin only)
router.post('/verify', adminAuthMiddleware, async (req, res) => {
  try {
    const { registrationNumber } = req.body;

    const team = await Team.findOne({ registrationNumber })
      .select('teamName registrationNumber paymentStatus checkedIn checkInTime')
      .populate('leader', 'name email');

    if (!team) {
      return res.status(404).json({ 
        success: false,
        canCheckIn: false,
        message: 'Team not found' 
      });
    }

    const canCheckIn = team.paymentStatus === 'verified' && !team.checkedIn;

    res.json({
      success: true,
      canCheckIn,
      team: {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber,
        paymentStatus: team.paymentStatus,
        checkedIn: team.checkedIn,
        checkInTime: team.checkInTime
      },
      message: canCheckIn 
        ? 'Team can be checked in' 
        : team.checkedIn 
          ? 'Team already checked in' 
          : 'Payment not verified'
    });

  } catch (error) {
    console.error('Verify check-in error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;
