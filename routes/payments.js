const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const QRCode = require("qrcode");
const Team = require("../models/Team");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Payment amounts based on team size (in paise, 100 paise = 1 INR)
const PAYMENT_AMOUNTS = {
  Solo: 50000, // ₹500
  Duo: 80000, // ₹800
  Team: 120000, // ₹1200
};

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order
// @access  Private
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.body;

    // Find team and verify ownership
    const team = await Team.findOne({
      _id: teamId,
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found or you are not authorized",
      });
    }

    // Check if payment already verified
    if (team.paymentStatus === "verified") {
      return res.status(400).json({
        message: "Payment already verified for this team",
      });
    }

    // Get payment amount based on team size
    const amount = PAYMENT_AMOUNTS[team.teamSize];

    // Create Razorpay order
    const options = {
      amount: amount,
      currency: "INR",
      receipt: `team_${team.registrationNumber}_${Date.now()}`,
      notes: {
        teamId: team._id.toString(),
        teamName: team.teamName,
        teamSize: team.teamSize,
        registrationNumber: team.registrationNumber,
      },
    };

    const order = await razorpay.orders.create(options);

    // Save order details to team
    team.razorpayOrderId = order.id;
    team.paymentAmount = amount;
    await team.save();

    res.json({
      orderId: order.id,
      amount: amount,
      currency: order.currency,
      teamName: team.teamName,
      registrationNumber: team.registrationNumber,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      message: "Failed to create payment order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payment/verify-payment
// @desc    Verify Razorpay payment and generate QR code
// @access  Private
router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      teamId,
    } = req.body;

    // Find team
    const team = await Team.findOne({
      _id: teamId,
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    }).populate("leader", "name email registrationNumber")
      .populate("members", "name email registrationNumber");

    if (!team) {
      return res.status(404).json({
        message: "Team not found or you are not authorized",
      });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Fetch payment details from Razorpay to confirm
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      return res.status(400).json({
        message: "Payment not successful",
      });
    }

    // Generate QR Code data
    const qrData = {
      teamName: team.teamName,
      registrationNumber: team.registrationNumber,
      teamSize: team.teamSize,
      leader: {
        name: team.leader.name,
        email: team.leader.email,
        registrationNumber: team.leader.registrationNumber,
      },
      members: team.members.map((member) => ({
        name: member.name,
        email: member.email,
        registrationNumber: member.registrationNumber,
      })),
      problemStatement: team.problemStatement,
      paymentId: razorpay_payment_id,
      amount: payment.amount / 100,
      verifiedAt: new Date().toISOString(),
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 400,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Update team with payment details
    team.paymentStatus = "verified";
    team.razorpayPaymentId = razorpay_payment_id;
    team.razorpaySignature = razorpay_signature;
    team.paymentVerifiedAt = new Date();
    team.qrCode = qrCodeDataUrl;
    await team.save();

    res.json({
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      amount: payment.amount / 100,
      qrCode: qrCodeDataUrl,
      team: {
        teamName: team.teamName,
        registrationNumber: team.registrationNumber,
        teamSize: team.teamSize,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payment/team-qr/:teamId
// @desc    Get team QR code
// @access  Private
router.get("/team-qr/:teamId", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findOne({
      _id: req.params.teamId,
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found or you are not authorized",
      });
    }

    if (!team.qrCode) {
      return res.status(404).json({
        message: "QR code not generated yet. Please complete payment first.",
      });
    }

    res.json({
      qrCode: team.qrCode,
      teamName: team.teamName,
      registrationNumber: team.registrationNumber,
    });
  } catch (error) {
    console.error("Get QR code error:", error);
    res.status(500).json({
      message: "Failed to fetch QR code",
    });
  }
});

// @route   GET /api/payment/status/:teamId
// @desc    Get payment status
// @access  Private
router.get("/status/:teamId", authMiddleware, async (req, res) => {
  try {
    const team = await Team.findOne({
      _id: req.params.teamId,
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found or you are not authorized",
      });
    }

    res.json({
      paymentStatus: team.paymentStatus,
      paymentAmount: team.paymentAmount ? team.paymentAmount / 100 : null,
      razorpayPaymentId: team.razorpayPaymentId || null,
      paymentVerifiedAt: team.paymentVerifiedAt || null,
      hasQrCode: !!team.qrCode,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      message: "Failed to fetch payment status",
    });
  }
});

module.exports = router;