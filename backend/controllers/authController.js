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

// ─── SEND RESET LINK EMAIL ──────────────────────────────────────────────────
const sendResetLinkEmail = async (email, resetLink) => {
  console.log("=================================");
  console.log(`📧 Password Reset Request: ${email}`);
  console.log(`🔗 Reset Link: ${resetLink}`);
  console.log(`⏰ Expires in 10 minutes`);
  console.log("=================================");

  console.log(`📝 [DEV] Use this link: ${resetLink}`);

  if (process.env.EMAIL_ENABLED === "false") {
    console.log("📧 [SIMULATED] Email would be sent to:", email);
    return true;
  }

  const transporter = createTransporter();
  
  if (!transporter) {
    console.log("📧 [FALLBACK] No email config. Link:", resetLink);
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
        .btn { display:inline-block; background-color:#4f46e5; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:16px; font-weight:600; }
        .footer { background:#f9fafb; padding:20px 40px; text-align:center; border-top:1px solid #e5e7eb; }
        .footer p { margin:0; font-size:12px; color:#6b7280; }
        .link-box { background:#f3f4f6; border-radius:8px; padding:16px; margin:24px 0; word-break: break-all; }
        .link-box a { color:#4f46e5; text-decoration:underline; }
      </style>
    </head>
    <body style="margin:0;padding:40px 16px;background-color:#f4f6f8;font-family:Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8;padding:40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
              <tr>
                <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;">🔐 Password Reset</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 20px;font-size:16px;color:#1f2937;">Hello,</p>
                  <p style="margin:0 0 20px;font-size:16px;color:#1f2937;">
                    We received a request to reset your password for your SEMS account.
                  </p>
                  
                  <p style="margin:0 0 16px;font-size:14px;color:#1f2937;">
                    Click the button below to reset your password:
                  </p>

                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetLink}" 
                       style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Reset Password
                    </a>
                  </div>

                  <div style="background-color:#f3f4f6;border-radius:8px;padding:16px;margin:24px 0;word-break:break-all;">
                    <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">Or copy and paste this link in your browser:</p>
                    <a href="${resetLink}" style="color:#4f46e5;text-decoration:underline;font-size:14px;">${resetLink}</a>
                  </div>

                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
                    ⏰ This link will expire in <strong>10 minutes</strong>.
                  </p>
                  <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
                    If you didn't request this, please ignore this email.
                  </p>

                  <hr />
                  
                  <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
                    Or go to: ${frontendUrl}/reset-password
                  </p>
                </td>
              </tr>
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
      subject: "🔐 Password Reset Link - SEMS",
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

// ─── FORGOT PASSWORD (JWT BASED) ──────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required.",
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    
    // IMPORTANT: Select resetPasswordToken and resetPasswordExpire fields
    const user = await User.findOne(
      { email: normalizedEmail }
    ).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      console.log(`⚠️ Password reset attempted for non-existent email: ${normalizedEmail}`);
      return res.status(200).json({
        message: "If an account exists with this email, a reset link has been sent.",
      });
    }

    console.log(`✅ User found: ${user.email}`);

    // Generate JWT token for password reset (10 minutes expiry)
    const resetToken = jwt.sign(
      { id: user._id.toString() },
      getJwtSecret(),
      { expiresIn: '10m' }
    );

    console.log(`🔑 Generated token: ${resetToken}`);

    // Save token to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save();
    
    console.log(`✅ Token saved successfully!`);

    // Create reset link
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    // Send email with reset link
    await sendResetLinkEmail(normalizedEmail, resetLink);

    res.status(200).json({
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

// ─── VERIFY RESET TOKEN (JWT BASED) ──────────────────────────────────────
export const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, getJwtSecret());
    
    // IMPORTANT: Select resetPasswordToken and resetPasswordExpire fields
    const user = await User.findById(decoded.id)
      .select('+resetPasswordToken +resetPasswordExpire');
    
    if (!user) {
      console.log(`❌ User not found for ID: ${decoded.id}`);
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    console.log(`🔍 User found: ${user.email}`);
    console.log(`🔍 DB Token: ${user.resetPasswordToken}`);
    console.log(`🔍 Request Token: ${token}`);

    // Check if token matches
    if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
      console.log(`❌ Token mismatch`);
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // Check if token is expired
    if (user.resetPasswordExpire < Date.now()) {
      console.log(`❌ Token expired`);
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    console.log(`✅ Token verified successfully for user: ${user.email}`);
    res.status(200).json({
      message: "Reset token is valid.",
    });
  } catch (err) {
    console.error("Verify token error:", err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({
        message: "Invalid reset token.",
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({
        message: "Reset token has expired.",
      });
    }
    res.status(400).json({
      message: "Invalid or expired reset token.",
    });
  }
};

// ─── RESET PASSWORD BY TOKEN (JWT BASED) ─────────────────────────────────
export const resetPasswordByToken = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      message: "Password is required.",
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, getJwtSecret());
    
    // IMPORTANT: Select resetPasswordToken and resetPasswordExpire fields
    const user = await User.findById(decoded.id)
      .select('+resetPasswordToken +resetPasswordExpire');
    
    if (!user) {
      console.log(`❌ User not found for ID: ${decoded.id}`);
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // Check if token matches
    if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
      console.log(`❌ Token mismatch`);
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // Check if token is expired
    if (user.resetPasswordExpire < Date.now()) {
      console.log(`❌ Token expired`);
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // Update password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    console.log(`✅ Password reset successful for user: ${user.email}`);
    res.status(200).json({
      message: "Password reset successful.",
    });
  } catch (err) {
    console.error("Reset token error:", err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({
        message: "Invalid reset token.",
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({
        message: "Reset token has expired.",
      });
    }
    res.status(400).json({
      message: "Invalid or expired reset token.",
    });
  }
};

// ─── VERIFY RESET CODE (CODE BASED) ──────────────────────────────────────
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

// ─── RESET PASSWORD WITH CODE (CODE BASED) ──────────────────────────────
export const resetPasswordWithCode = async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({
      message: "Email, code and password are required.",
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