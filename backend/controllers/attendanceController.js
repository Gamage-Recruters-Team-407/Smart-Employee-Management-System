import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

// Helper function to format Date object into HH:MM
const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Helper function to get today's date in YYYY-MM-DD format based on local time
const getLocalDateString = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split("T")[0];
};

/**
 * @desc Get all attendance records for a specific date
 * @route GET /api/attendance
 */
export const getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || getLocalDateString();

    const records = await Attendance.find({ date: targetDate }).populate(
      "employee",
      "employeeId firstName lastName email department designation"
    );

    // Map records to include a virtual 'name' field for frontend compatibility
    const formattedRecords = records.map((record) => {
      const rec = record.toObject();
      if (rec.employee) {
        rec.employee.name = `${rec.employee.firstName || ""} ${rec.employee.lastName || ""}`.trim();
      }
      return rec;
    });

    res.status(200).json(formattedRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance records", error: error.message });
  }
};

/**
 * @desc Mark/update attendance manually (Admin/HR)
 * @route POST /api/attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const { employee, date, status, checkInTime, checkOutTime } = req.body;

    if (!employee || !date || !status) {
      return res.status(400).json({ message: "Employee ID, date, and status are required." });
    }

    // Verify employee exists using custom employeeId
    const employeeExists = await Employee.findOne({ employeeId: employee });
    if (!employeeExists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Prepare update data
    const updateData = { status };

    if (checkInTime) {
      updateData.checkInTime = checkInTime;
      const [hours, minutes] = checkInTime.split(":");
      const loginDate = new Date(date);
      loginDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      updateData.loginTime = loginDate;
    }

    if (checkOutTime) {
      updateData.checkOutTime = checkOutTime;
      const [hours, minutes] = checkOutTime.split(":");
      const logoutDate = new Date(date);
      logoutDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      updateData.logoutTime = logoutDate;
    }

    // Upsert attendance record for employee + date using DB ObjectId
    const record = await Attendance.findOneAndUpdate(
      { employee: employeeExists._id, date },
      { $set: updateData },
      { new: true, upsert: true }
    ).populate("employee", "employeeId firstName lastName email department designation");

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: "Error marking attendance", error: error.message });
  }
};

/**
 * @desc Record employee Check-In (Self Attendance)
 * @route POST /api/attendance/check-in
 */
export const checkIn = async (req, res) => {
  try {
    const { location } = req.body;
    // Retrieve employeeId from logged-in session context or fallback to body
    const employeeId = req.employee?.employeeId || req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID (employeeId) is required." });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const todayStr = getLocalDateString();
    const now = new Date();
    const timeStr = formatTime(now);

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
        },
        $set: {
          loginTime: now,
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
export const checkOut = async (req, res) => {
  try {
    // Retrieve employeeId from logged-in session context or fallback to body
    const employeeId = req.employee?.employeeId || req.body.employeeId;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID (employeeId) is required." });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const todayStr = getLocalDateString();
    const now = new Date();
    const timeStr = formatTime(now);

    // Find attendance record for today using DB ObjectId
    const attendance = await Attendance.findOne({ employee: employee._id, date: todayStr });
    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found for today." });
    }

    attendance.logoutTime = now;
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
export const getEmployeeAttendanceHistory = async (req, res) => {
  try {
    let { employeeId } = req.params;
    
    // Support fetching own history using 'me' or when route doesn't specify ID
    if (employeeId === "me" || !employeeId) {
      employeeId = req.employee?.employeeId;
    }

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const history = await Attendance.find({ employee: employee._id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendance history", error: error.message });
  }
};

/**
 * @desc Get daily attendance status counts/report
 * @route GET /api/attendance/report/daily
 */
export const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || getLocalDateString();

    const records = await Attendance.find({ date: targetDate });

    const report = {
      date: targetDate,
      totalMarked: records.length,
      present: records.filter((r) => r.status === "Present").length,
      late: records.filter((r) => r.status === "Late").length,
      absent: records.filter((r) => r.status === "Absent").length,
      halfDay: records.filter((r) => r.status === "Half-Day").length,
    };

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Error generating daily report", error: error.message });
  }
};
