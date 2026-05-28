import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

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

    const employee = await Employee.findOne({ employeeId });
    
    if(!employee){
      return res.status(404).json({
        message:"Employee not found"
      })
    }

    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
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