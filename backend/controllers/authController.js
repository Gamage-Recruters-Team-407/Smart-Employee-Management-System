import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import User from "../models/User.js";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";
import { getJwtSecret } from "../utils/jwtSecret.js";

const signToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// ─── EMAIL TRANSPORTER SETUP ──────────────────────────────────────────────
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("⚠️ Email credentials not configured. Check EMAIL_USER and EMAIL_PASS in .env");
    return null;
  }

  console.log(`📧 Email configured for: ${user}`);

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const validatePassword = (password) => {
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  
  const weakPasswords = ["123456", "12345678", "qwerty", "password"];
  if (weakPasswords.includes(password.toLowerCase())) {
    return "Password is too weak. Please choose a stronger password.";
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return "Password must contain at least one letter and one number.";
  }

  return null;
};

// ─── SEND RESET CODE EMAIL ──────────────────────────────────────────────────
const sendResetCodeEmail = async (email, code) => {
  console.log("=================================");
  console.log(`📧 Password Reset Request: ${email}`);
  console.log(`🔑 Reset Code: ${code}`);
  console.log(`⏰ Expires in 10 minutes`);
  console.log("=================================");

  // Always log for debugging
  console.log(`📝 [DEV] Use this code: ${code}`);

  // Check if email is disabled
  if (process.env.EMAIL_ENABLED === "false") {
    console.log("📧 [SIMULATED] Email would be sent to:", email);
    return true;
  }

  const transporter = createTransporter();
  
  // If no transporter, fallback to console
  if (!transporter) {
    console.log("📧 [FALLBACK] No email config. Code:", code);
    return true;
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif; }
        .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .header { background:linear-gradient(135deg,#4f46e5,#6366f1); padding:32px 40px; text-align:center; }
        .header h1 { margin:0; color:#ffffff; font-size:24px; }
        .body { padding:40px; }
        .code-box { background:#f3f4f6; border-radius:8px; padding:24px; text-align:center; margin:24px 0; }
        .code-box .code { font-size:40px; font-weight:bold; color:#4f46e5; letter-spacing:10px; font-family:monospace; margin:0; }
        .code-box .label { font-size:14px; color:#6b7280; margin:0 0 8px 0; }
        .btn { display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:16px; font-weight:600; }
        .footer { background:#f9fafb; padding:20px 40px; text-align:center; border-top:1px solid #e5e7eb; }
        .footer p { margin:0; font-size:12px; color:#6b7280; }
        .text-muted { color:#6b7280; font-size:14px; }
        .text-small { font-size:12px; color:#9ca3af; }
        hr { border:none; border-top:1px solid #e5e7eb; margin:24px 0; }
      </style>
    </head>
    <body style="margin:0;padding:40px 16px;background-color:#f4f6f8;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8;padding:40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;">🔐 Password Reset</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 20px;font-size:16px;color:#1f2937;">Hello,</p>
                  <p style="margin:0 0 20px;font-size:16px;color:#1f2937;">
                    We received a request to reset your password for your SEMS account.
                  </p>
                  
                  <!-- OTP Code Box -->
                  <div style="background-color:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
                    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Your 6-digit Reset Code</p>
                    <p style="margin:0;font-size:40px;font-weight:bold;color:#4f46e5;letter-spacing:10px;font-family:monospace;">
                      ${code}
                    </p>
                  </div>

                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
                    ⏰ This code will expire in <strong>10 minutes</strong>.
                  </p>
                  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
                    If you didn't request this, please ignore this email.
                  </p>

                  <!-- Reset Button -->
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${frontendUrl}/reset-password" 
                       style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Go to Reset Password
                    </a>
                  </div>

                  <hr />
                  
                  <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
                    Or go to: ${frontendUrl}/reset-password
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#6b7280;">
                    &copy; ${new Date().getFullYear()} SEMS - Smart Employee Management System
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    console.log(`📤 Sending email to: ${email}...`);
    
    const info = await transporter.sendMail({
      from: `"SEMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Password Reset Code - SEMS",
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully to: ${email}`);
    console.log(`📨 Message ID: ${info.messageId}`);
    console.log(`📬 Response: ${info.response}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
    // Still return true for security (don't reveal if email exists)
    return true;
  }
};

// ─── REGISTER USER ───────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required.",
    });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      message: passwordError,
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();

    const exists = await User.findOne({
      email: normalizedEmail,
    });

    if (exists) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      role: role || "Employee",
    });

    await resolveEmployeeForAuthUser(user, { createIfMissing: true });

    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      message: "Server error during registration.",
    });
  }
};

// ─── LOGIN USER ──────────────────────────────────────────────────────────────
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password. Sign up first if you do not have an account.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google sign-in. Click Sign in with Google.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    await resolveEmployeeForAuthUser(user, { createIfMissing: true });

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Server error during login.",
    });
  }
};

// ─── LOGOUT USER ─────────────────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    res.status(200).json({
      message: "Logged out successfully.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      message: "Server error during logout.",
    });
  }
};

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({
      message: "Server error while fetching profile.",
    });
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required.",
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    
    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Always return success for security
    if (!user) {
      console.log(`⚠️ Password reset attempted for non-existent email: ${normalizedEmail}`);
      return res.status(200).json({
        message: "If an account exists with this email, a reset code has been sent.",
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Send email with reset code
    await sendResetCodeEmail(normalizedEmail, resetCode);

    res.status(200).json({
      message: "If an account exists with this email, a reset code has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

// ─── VERIFY RESET CODE ──────────────────────────────────────────────────────
export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      message: "Email and reset code are required.",
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    
    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset code.",
      });
    }

    res.status(200).json({
      message: "Code verified successfully.",
    });
  } catch (err) {
    console.error("Verify code error:", err);
    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
};

// ─── RESET PASSWORD WITH CODE ──────────────────────────────────────────────
export const resetPasswordWithCode = async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({
      message: "Email, code and password are required.",
    });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      message: passwordError,
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    
    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: hashedCode,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset code.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
};

// ─── VERIFY RESET TOKEN ─────────────────────────────────────────────────────
export const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    res.status(200).json({
      message: "Reset token is valid.",
    });
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
};

// ─── RESET PASSWORD BY TOKEN ───────────────────────────────────────────────
export const resetPasswordByToken = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      message: "Password is required.",
    });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      message: passwordError,
    });
  }

  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful.",
    });
  } catch (err) {
    console.error("Reset token error:", err);
    res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
};