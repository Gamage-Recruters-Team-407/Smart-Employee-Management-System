import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Utility: sign a JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Utility: Send email (you need to implement this)
// For now, we'll log the code to console for testing
const sendResetCodeEmail = async (email, code) => {
  // In production, use nodemailer to send actual email
  console.log(`=========================================`);
  console.log(`Password Reset Request for: ${email}`);
  console.log(`Your 6-digit reset code: ${code}`);
  console.log(`This code expires in 10 minutes`);
  console.log(`=========================================`);
  
  // For development, you can also return the code in response
  // DON'T do this in production!
  return true;
};

// ─── POST /api/auth/register ────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

// ─── POST /api/auth/forgot-password ─────────────────────────────────────────
// Sends a 6-digit reset code to user's email
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await User.findOne({ email });
    
    // For security, always return success even if email doesn't exist
    if (!user) {
      return res.status(200).json({ 
        message: "If an account exists with this email, a reset code has been sent." 
      });
    }

    // Generate 6-digit random code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the code before storing (for security)
    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");
    
    // Store hashed code and expiry in database
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    
    // Send email with the actual code
    await sendResetCodeEmail(email, resetCode);
    
    res.status(200).json({ 
      message: "If an account exists with this email, a reset code has been sent." 
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ─── POST /api/auth/verify-reset-code ────────────────────────────────────────
// Verifies the 6-digit reset code
router.post("/verify-reset-code", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: "Email and reset code are required." });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Invalid code format. Please enter a 6-digit code." });
  }

  try {
    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");
    
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset code. Please request a new one." 
      });
    }
    
    res.status(200).json({ 
      message: "Code verified successfully. You can now reset your password." 
    });
  } catch (err) {
    console.error("Verify code error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── POST /api/auth/reset-password-with-code ─────────────────────────────────
// Resets password using email, code, and new password
router.post("/reset-password-with-code", async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({ 
      message: "Email, reset code, and new password are required." 
    });
  }

  // Password validation
  if (password.length < 6) {
    return res.status(400).json({ 
      message: "Password must be at least 6 characters long." 
    });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ 
      message: "Password must contain at least one uppercase letter." 
    });
  }

  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ 
      message: "Password must contain at least one lowercase letter." 
    });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ 
      message: "Password must contain at least one number." 
    });
  }

  try {
    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");
    
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset code. Please request a new one." 
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    res.status(200).json({ 
      message: "Password reset successful. You can now login with your new password." 
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.status(200).json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
router.post("/logout", protect, async (req, res) => {
  // Client-side token removal is enough for JWT
  res.status(200).json({ message: "Logged out successfully." });
});

export default router;