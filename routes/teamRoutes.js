const express = require("express");
const multer = require("multer");
const Team = require("../models/Team");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const {
  compressAndUploadImage,
  deleteImageFromCloudinary,
} = require("../utils/imageUpload");
const { sendTeamRegistrationEmail } = require("../utils/emailService");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// @route   POST /api/teams/register
// @desc    Register a solo team and send confirmation email
// @access  Private
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const { teamName } = req.body;
    const teamSize = "Solo";
    const members = [];

    // Check if team name already exists
    const existingTeamName = await Team.findOne({ teamName });
    if (existingTeamName) {
      return res.status(400).json({
        message: "Team name already exists. Please choose a different name.",
      });
    }

    // Check if user is already in a team
    const existingTeam = await Team.findOne({
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (existingTeam) {
      return res.status(400).json({
        message: "You are already registered in a team",
      });
    }

    // Generate unique registration number
    const teamCount = await Team.countDocuments();
    const registrationNumber = `TEAM${String(teamCount + 1).padStart(4, "0")}`;

    // Create team
    const team = new Team({
      teamName,
      leader: req.user._id,
      members,
      teamSize,
      registrationNumber,
      paymentStatus: "pending"
    });

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate("leader", "name email registrationNumber phone university");

    // Send registration confirmation email
    const emailData = {
      teamName: team.teamName,
      registrationNumber: team.registrationNumber,
      teamSize: team.teamSize,
      leaderName: populatedTeam.leader.name,
      leaderEmail: populatedTeam.leader.email,
      amount: 79, // Solo registration fee
    };

    // Send email asynchronously (don't wait for it)
    sendTeamRegistrationEmail(emailData).catch(err => {
      console.error("Failed to send registration email:", err);
    });

    res.status(201).json({
      message: "Solo registration successful. Confirmation email sent. Please complete payment and upload documents.",
      team: populatedTeam,
    });
  } catch (error) {
    console.error("Team registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// @route   POST /api/teams/save-transaction
// @desc    Save transaction ID after manual payment
// @access  Private
router.post("/save-transaction", authMiddleware, async (req, res) => {
  try {
    const { teamId, transactionId, amount } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" });
    }

    // Find the team and verify ownership
    const team = await Team.findOne({
      _id: teamId,
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found or you are not authorized",
      });
    }

    // Save transaction details
    team.transactionId = transactionId;
    team.paymentAmount = amount * 100; // Store in paise for consistency
    team.paymentCompletedAt = new Date();
    
    await team.save();

    res.json({
      message: "Transaction ID saved successfully. Please upload your documents.",
      transactionId: team.transactionId
    });
  } catch (error) {
    console.error("Save transaction error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/teams
// @desc    Get all verified teams
// @access  Public
router.get("/", async (req, res) => {
  try {
    const teams = await Team.find({ paymentStatus: "verified" })
      .populate("leader", "name email registrationNumber")
      .populate("members", "name email registrationNumber")
      .sort({ createdAt: -1 });

    res.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/teams/my-team
// @desc    Get current user's team
// @access  Private
router.get("/my-team", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findOne({
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    })
      .populate("leader", "name email registrationNumber phone university")
      .populate("members", "name email registrationNumber phone university");

    if (!team) {
      return res.status(404).json({ message: "No team found" });
    }

    res.json({ team });
  } catch (error) {
    console.error("Get my team error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/teams/upload-documents
// @desc    Upload payment screenshot and ID card
// @access  Private
router.post(
  "/upload-documents",
  authMiddleware,
  upload.fields([
    { name: "paymentScreenshot", maxCount: 1 },
    { name: "idCard", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { teamId } = req.body;

      if (!req.files?.paymentScreenshot || !req.files?.idCard) {
        return res.status(400).json({ 
          message: "Both payment screenshot and ID card are required" 
        });
      }

      // Find the team and verify ownership
      const team = await Team.findOne({
        _id: teamId,
        $or: [{ leader: req.user._id }, { members: req.user._id }],
      });

      if (!team) {
        return res.status(404).json({
          message: "Team not found or you are not authorized",
        });
      }

      // Check if transaction ID is saved
      if (!team.transactionId) {
        return res.status(400).json({
          message: "Please complete payment and save transaction ID first",
        });
      }

      // Delete old images from Cloudinary if they exist
      if (team.paymentScreenshotCloudinaryId) {
        await deleteImageFromCloudinary(team.paymentScreenshotCloudinaryId);
      }
      if (team.idCardCloudinaryId) {
        await deleteImageFromCloudinary(team.idCardCloudinaryId);
      }

      // Upload payment screenshot
      const paymentUpload = await compressAndUploadImage(
        req.files.paymentScreenshot[0],
        `${teamId}_payment`
      );

      // Upload ID card
      const idCardUpload = await compressAndUploadImage(
        req.files.idCard[0],
        `${teamId}_idcard`
      );

      if (!paymentUpload.success || !idCardUpload.success) {
        return res.status(500).json({
          message: "Failed to process and upload images",
        });
      }

      // Update team with document details
      team.paymentScreenshot = paymentUpload.url;
      team.paymentScreenshotCloudinaryId = paymentUpload.cloudinaryId;
      team.idCard = idCardUpload.url;
      team.idCardCloudinaryId = idCardUpload.cloudinaryId;
      team.documentsUploadedAt = new Date();
      
      await team.save();

      res.json({
        message: "Documents uploaded successfully. Waiting for admin verification.",
        paymentScreenshot: team.paymentScreenshot,
        idCard: team.idCard,
        compressionInfo: {
          paymentScreenshot: {
            originalSize: paymentUpload.originalSize,
            compressedSize: paymentUpload.compressedSize,
            compressionRatio: paymentUpload.compressionRatio + "%",
          },
          idCard: {
            originalSize: idCardUpload.originalSize,
            compressedSize: idCardUpload.compressedSize,
            compressionRatio: idCardUpload.compressionRatio + "%",
          }
        },
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({
        message: "Server error during document upload",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

module.exports = router;