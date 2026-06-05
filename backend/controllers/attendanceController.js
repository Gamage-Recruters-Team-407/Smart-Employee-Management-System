import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";

/**
 * @desc Record login time - start of session
 * @route POST /api/attendance/login
 */
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

/**
 * @desc Record logout time / Mark employee as inactive (Auto logout)
 * @route POST /api/attendance/logout
 */
export const recordLogout = async (req, res) => {
  try {
    const { attendanceId } = req.body;

    // Find the attendance record and update logout time & status
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        logoutTime: new Date(),
        status: "Inactive", // අනිත් branch එකෙන් ආපු වෙනස්කම
        activityStatus: false,
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Calculate working hours (HEAD එකෙන් ආපු logic එක)
    let workingHours = 0;
    if (attendance.logoutTime && attendance.loginTime) {
      workingHours = (attendance.logoutTime - attendance.loginTime) / (1000 * 60 * 60);
    }

    res.status(200).json({
      message: "Logout recorded successfully (Employee marked as inactive)",
      attendance,
      workingHours: workingHours.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// 💡 Compatibility සඳහා markInactive ලෙසද මෙම ශ්‍රිතයම export කරමු
export const markInactive = recordLogout;

/**
 * @desc Get today's attendance for an employee
 * @route GET /api/attendance/today/:employeeId
 */
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

/**
 * @desc Get all inactive employees (for admin dashboard)
 * @route GET /api/attendance/inactive
 */
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

/**
 * @desc Get attendance optionally filtered by date
 * @route GET /api/attendance
 */
export const getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date } : {};
    const attendance = await Attendance.find(query).populate("employee");
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc Get attendance history for a specific employeeId
 * @route GET /api/attendance/history/:employeeId
 */
export const getAttendanceByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const attendance = await Attendance.find({ employee: employee._id }).populate("employee").sort({ date: -1 });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc Create or update attendance manually (admin)
 * @route POST /api/attendance/mark
 */
export const markAttendance = async (req, res) => {
  try {
    const { employee, date, status, checkInTime, checkOutTime } = req.body;
    
    // Find employee by their custom employeeId
    const employeeDoc = await Employee.findOne({ employeeId: employee });
    if (!employeeDoc) {
      return res.status(404).json({ message: `Employee with ID ${employee} not found` });
    }

    // Find existing record
    let attendance = await Attendance.findOne({
      employee: employeeDoc._id,
      date: date
    });

    // Helper to parse HH:MM into a Date object on the specified date
    const parseTimeToDate = (timeStr, baseDateStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":");
      const d = new Date(baseDateStr);
      d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return d;
    };

    const loginTime = parseTimeToDate(checkInTime, date);
    const logoutTime = parseTimeToDate(checkOutTime, date);

    if (attendance) {
      // Update existing record
      attendance.status = status;
      attendance.checkInTime = checkInTime || null;
      attendance.checkOutTime = checkOutTime || null;
      attendance.loginTime = loginTime;
      attendance.logoutTime = logoutTime;
      await attendance.save();
    } else {
      // Create new record
      attendance = new Attendance({
        employee: employeeDoc._id,
        date,
        status,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        loginTime,
        logoutTime,
      });
      await attendance.save();
    }

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * @desc Record check-in automatically from frontend authService.checkIn
 * @route POST /api/attendance/checkin
 */
export const checkIn = async (req, res) => {
  try {
    const { date, checkInTime, location } = req.body;

    let employeeDoc = await Employee.findOne({ email: req.user.email });
    if (!employeeDoc) {
      const employeeCount = await Employee.countDocuments();
      const newEmpId = `emp-${String(employeeCount + 1).padStart(3, '0')}`;
      
      const names = (req.user.name || "Test User").split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'User';

      employeeDoc = new Employee({
        employeeId: newEmpId,
        firstName,
        lastName,
        email: req.user.email,
        joiningDate: new Date(),
        status: "Active",
      });
      await employeeDoc.save();
    }

    let attendance = await Attendance.findOne({
      employee: employeeDoc._id,
      date: date
    });

    let loginTime = null;
    if (checkInTime) {
      const [hours, minutes] = checkInTime.split(":");
      const loginDate = new Date(date);
      loginDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      loginTime = loginDate;
    }

    let status = "Present";
    if (checkInTime) {
      const [hours, minutes] = checkInTime.split(":");
      const totalMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
      if (totalMinutes > 9 * 60 + 15) { // after 09:15
        status = "Late";
      }
    }

    if (attendance) {
      attendance.checkInTime = attendance.checkInTime || checkInTime;
      attendance.loginTime = attendance.loginTime || loginTime;
      attendance.location = location || attendance.location;
      attendance.activityStatus = true;
      await attendance.save();
    } else {
      attendance = new Attendance({
        employee: employeeDoc._id,
        date: date,
        checkInTime: checkInTime,
        loginTime: loginTime,
        status: status,
        location: location || "Office",
        activityStatus: true
      });
      await attendance.save();
    }

    res.status(200).json({
      message: "Check-in recorded successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Record check-out automatically from frontend authService.checkOut
 * @route POST /api/attendance/checkout
 */
export const checkOut = async (req, res) => {
  try {
    const { date, checkOutTime } = req.body;

    let employeeDoc = await Employee.findOne({ email: req.user.email });
    if (!employeeDoc) {
      const employeeCount = await Employee.countDocuments();
      const newEmpId = `emp-${String(employeeCount + 1).padStart(3, '0')}`;
      
      const names = (req.user.name || "Test User").split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'User';

      employeeDoc = new Employee({
        employeeId: newEmpId,
        firstName,
        lastName,
        email: req.user.email,
        joiningDate: new Date(),
        status: "Active",
      });
      await employeeDoc.save();
    }

    let attendance = await Attendance.findOne({
      employee: employeeDoc._id,
      date: date
    });

    let logoutTime = null;
    if (checkOutTime) {
      const [hours, minutes] = checkOutTime.split(":");
      const logoutDate = new Date(date);
      logoutDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      logoutTime = logoutDate;
    }

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeDoc._id,
        date: date,
        status: "Present",
        activityStatus: false,
        checkOutTime: checkOutTime,
        logoutTime: logoutTime
      });
    } else {
      attendance.checkOutTime = checkOutTime;
      attendance.logoutTime = logoutTime;
      attendance.activityStatus = false;
    }

    await attendance.save();

    res.status(200).json({
      message: "Check-out recorded successfully",
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get attendance history for the logged-in employee
 * @route GET /api/attendance/my-history
 */
export const getMyAttendanceHistory = async (req, res) => {
  try {
    let employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      const employeeCount = await Employee.countDocuments();
      const newEmpId = `emp-${String(employeeCount + 1).padStart(3, '0')}`;
      
      const names = (req.user.name || "Test User").split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'User';

      employee = new Employee({
        employeeId: newEmpId,
        firstName,
        lastName,
        email: req.user.email,
        joiningDate: new Date(),
        status: "Active",
      });
      await employee.save();
    }
    const attendance = await Attendance.find({ employee: employee._id }).populate("employee").sort({ date: -1 });
    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};