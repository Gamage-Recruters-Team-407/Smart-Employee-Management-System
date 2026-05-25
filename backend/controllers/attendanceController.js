import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

//This part is copied from tharuka's code
// Record login time - start of session
export const checkIn = async (req, res) => {
  try {
    const { location, checkInTime, date } = req.body;
    // Retrieve employeeId from logged-in session context, req.user or fallback to body
    let employeeId = req.employee?.employeeId || req.body.employeeId;

    if (!employeeId && req.user) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp("^" + req.user.email + "$", "i") } });
      employeeId = emp?.employeeId;
    }

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID (employeeId) is required." });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const todayStr = date || getLocalDateString();
    const now = new Date();
    const timeStr = checkInTime || formatTime(now);

    let loginDate = now;
    if (date && checkInTime) {
      const [hours, minutes] = checkInTime.split(":");
      loginDate = new Date(date);
      loginDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }

    // Define late threshold (e.g., 09:00 AM)
    const lateThreshold = "09:00";
    let status = "Present";
    if (timeStr > lateThreshold) {
      status = "Late";
    }

    // Create or update check-in record using DB ObjectId
    const attendance = await Attendance.findOneAndUpdate(
      { employee: employee._id, date: todayStr },
      {
        $setOnInsert: {
          employee: employee._id,
          date: todayStr,
          location: location || "Office",
          loginTime: loginDate,
          checkInTime: timeStr,
          status: status,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Checked in successfully", data: attendance });
  } catch (error) {
    res.status(500).json({ message: "Error checking in", error: error.message });
  }
};

/**
 * @desc Record employee Check-Out (Self Attendance)
 * @route POST /api/attendance/check-out
 */

//this part is copied from tharuka's code
export const checkOut = async (req, res) => {
  try {
    const { checkOutTime, date } = req.body;
    // Retrieve employeeId from logged-in session context, req.user or fallback to body
    let employeeId = req.employee?.employeeId || req.body.employeeId;

    if (!employeeId && req.user) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp("^" + req.user.email + "$", "i") } });
      employeeId = emp?.employeeId;
    }

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID (employeeId) is required." });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const todayStr = date || getLocalDateString();
    const now = new Date();
    const timeStr = checkOutTime || formatTime(now);

    // Find attendance record for today using DB ObjectId
    const attendance = await Attendance.findOne({ employee: employee._id, date: todayStr });
    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found for today." });
    }

    let logoutDate = now;
    if (date && checkOutTime) {
      const [hours, minutes] = checkOutTime.split(":");
      logoutDate = new Date(date);
      logoutDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }

    attendance.logoutTime = logoutDate;
    attendance.checkOutTime = timeStr;
    await attendance.save();

    res.status(200).json({ message: "Checked out successfully", data: attendance });
  } catch (error) {
    res.status(500).json({ message: "Error checking out", error: error.message });
  }
};

/**
 * @desc Get attendance history for a single employee
 * @route GET /api/attendance/employee/:employeeId
 */



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