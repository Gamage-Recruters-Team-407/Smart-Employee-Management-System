import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create attendance record if employee profile exists
    let attendance = null;
    const employee = await Employee.findOne({ email: user.email });
    if (employee) {
      // Check if attendance already exists for today to prevent duplicates on relogin
      const todayStr = new Date().toISOString().split('T')[0];
      attendance = await Attendance.findOne({ employee: employee._id, date: todayStr });

      if (!attendance) {
        attendance = new Attendance({
          employee: employee._id,
          loginTime: new Date(),
          status: "Present",
          activityStatus: true,
        });
        await attendance.save();
      }
    }

    // Create JWT token (include both id and userId for middleware compatibility)
    const token = jwt.sign(
      { id: user._id, userId: user._id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      attendance: attendance ? {
        id: attendance._id,
        loginTime: attendance.loginTime,
      } : null,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { attendanceId } = req.body || {};

    if (!attendanceId) {
      return res.status(200).json({
        message: "Logout successful (no attendance session to update)",
      });
    }

    // Update attendance record with logout time
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        logoutTime: new Date(),
        activityStatus: false,
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Calculate working hours
    const workingHours =
      (attendance.logoutTime - attendance.loginTime) / (1000 * 60 * 60);

    res.status(200).json({
      message: "Logout successful",
      attendance,
      workingHours: workingHours.toFixed(2),
    });
  } catch (error) {
    console.error("Error in logoutUser:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};