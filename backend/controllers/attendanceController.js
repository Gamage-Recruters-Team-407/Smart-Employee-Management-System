import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Record login time - start of session
export const recordLogin = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // Create new attendance record with login time
    const attendance = new Attendance({
      employee: employeeId,
      loginTime: new Date(),
      status: "Present",
      activityStatus: true, // Initially active
    });

    await attendance.save();

    res.status(201).json({
      message: "Login recorded successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Record logout time - end of session
export const recordLogout = async (req, res) => {
  try {
    const { attendanceId } = req.body;

    // Find the attendance record and update logout time
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
      message: "Logout recorded successfully",
      attendance,
      workingHours: workingHours.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Mark employee as inactive (auto logout)
export const markInactive = async (req, res) => {
  try {
    const { attendanceId } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        logoutTime: new Date(),
        status: "Inactive",
        activityStatus: false,
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.status(200).json({
      message: "Employee marked as inactive (auto logout)",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get today's attendance for an employee
export const getTodayAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      createdAt: { $gte: today },
    });

    res.status(200).json({
      message: "Attendance fetched successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get all inactive employees (for admin dashboard)
export const getInactiveEmployees = async (req, res) => {
  try {
    const inactiveEmployees = await Attendance.find({
      status: "Inactive",
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
      },
    })
      .populate("employee", "name email")
      .select("employee status loginTime logoutTime createdAt");

    res.status(200).json({
      message: "Inactive employees fetched",
      inactiveEmployees,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
