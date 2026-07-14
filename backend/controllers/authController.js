import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";
import { getJwtSecret } from "../utils/jwtSecret.js";

const signToken = (id) =>
  jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendResetCodeEmail = async (email, code) => {
  console.log("=================================");
  console.log(`Password Reset Request: ${email}`);
  console.log(`Reset Code: ${code}`);
  console.log("Expires in 10 minutes");
  console.log("=================================");
  return true;
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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required.",
    });
  }

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
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

    await sendResetCodeEmail(email, resetCode);

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

export const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      message: "Email and reset code are required.",
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
    const hashedCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
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