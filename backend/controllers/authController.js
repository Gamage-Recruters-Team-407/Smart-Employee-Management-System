import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";

// ─────────────────────────────────────────────
// Generate JWT
// ─────────────────────────────────────────────
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// ─────────────────────────────────────────────
// Format User Response Object
// ─────────────────────────────────────────────
const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ─────────────────────────────────────────────
// Register User
// ─────────────────────────────────────────────
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email || "").toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "Employee",
    });

    // This creates Employee and saves user._id into Employee.userId
    const employee = await resolveEmployeeForAuthUser(user, {
      createIfMissing: true,
    });

    res.status(201).json({
      token: generateToken(user._id, user.role),
      user: formatUser(user),
      employee,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Login User (with Attendance tracking)
// ─────────────────────────────────────────────
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Attendance login tracking logic
    const attendance = await Attendance.create({
      employee: user._id,
      loginTime: new Date(),
      status: "Present",
      activityStatus: true,
    });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      token,
      user: formatUser(user),
      attendance: {
        id: attendance._id,
        loginTime: attendance.loginTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Logout User
// ─────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    const { attendanceId } = req.body;

    if (!attendanceId) {
      return res.status(400).json({
        message: "Attendance ID is required",
      });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        logoutTime: new Date(),
        activityStatus: false,
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance record not found",
      });
    }

    const workingHours = (attendance.logoutTime - attendance.loginTime) / (1000 * 60 * 60);

    res.status(200).json({
      message: "Logout successful",
      attendance,
      workingHours: workingHours.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get Current Logged-in User Profile
// ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Forgot & Reset Password Endpoints (HEAD එකෙන් බේරාගන්නා ලදී)
// ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // TODO: මෙතනට ඔයාගේ OTP/Code generate කරලා Email කරන logic එක ලියන්න.
    res.status(200).json({ message: "Reset code sent successfully if email exists" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    res.status(200).json({ message: "Reset code verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPasswordWithCode = async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compatibility සඳහා සාමාන්‍用 token-based reset functions
export const resetPassword = async (req, res) => { res.status(200).json({ message: "Kept for compatibility" }); };
export const verifyResetToken = async (req, res) => { res.status(200).json({ message: "Kept for compatibility" }); };