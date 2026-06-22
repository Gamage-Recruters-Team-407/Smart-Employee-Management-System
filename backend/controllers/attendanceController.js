import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import { getEmployeeIdForRequest } from '../utils/employeeUserLink.js';

// ─── BREAK CONFIGURATION ──────────────────────────────────────────────────
const BREAK_CONFIG = {
  breakfast: {
    label: 'Breakfast',
    start: { hours: 10, minutes: 0 },
    end: { hours: 11, minutes: 0 },
    duration: 15
  },
  lunch: {
    label: 'Lunch',
    start: { hours: 12, minutes: 30 },
    end: { hours: 14, minutes: 30 },
    duration: 60
  },
  tea: {
    label: 'Tea Time',
    start: { hours: 15, minutes: 0 },
    end: { hours: 16, minutes: 0 },
    duration: 15
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
      { returnDocument: "after" }
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
  
// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────
const getMinutesSinceMidnight = (date = new Date()) => {
  return date.getHours() * 60 + date.getMinutes();
};

const isBreakAvailable = (breakType, now = new Date()) => {
  const config = BREAK_CONFIG[breakType];
  if (!config) return false;

  const currentMinutes = getMinutesSinceMidnight(now);
  const startMinutes = config.start.hours * 60 + config.start.minutes;
  const endMinutes = config.end.hours * 60 + config.end.minutes;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

const calculateRemainingBreakTime = (breakType, now = new Date()) => {
  const config = BREAK_CONFIG[breakType];
  if (!config) return 0;

  const currentMinutes = getMinutesSinceMidnight(now);
  const endMinutes = config.end.hours * 60 + config.end.minutes;
  const remainingUntilEnd = Math.max(0, endMinutes - currentMinutes);
  
  return Math.min(config.duration, remainingUntilEnd);
};

const getCurrentBreakType = (now = new Date()) => {
  const currentMinutes = getMinutesSinceMidnight(now);
  
  for (const [type, config] of Object.entries(BREAK_CONFIG)) {
    const startMinutes = config.start.hours * 60 + config.start.minutes;
    const endMinutes = config.end.hours * 60 + config.end.minutes;
    
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return type;
    }
  }
  
  return null;
};

const getCurrentTimeString = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// ─── GET TODAY'S ATTENDANCE ──────────────────────────────────────────────
export const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForRequest(req);
    const today = new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    }).populate('employee', 'firstName lastName employeeId department');

    if (!attendance) {
      return res.status(200).json({
        success: true,
        data: {
          employee: employeeId,
          date: today,
          status: 'Not Marked',
          onlineStatus: 'Offline',
          checkInTime: null,
          checkOutTime: null,
          breakType: null,
          breakStartTime: null,
          breakRemainingSeconds: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

// ─── GET MY HISTORY ──────────────────────────────────────────────────────
export const getMyHistory = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForRequest(req);
    const { limit = 30 } = req.query;

    const records = await Attendance.find({
      employee: employeeId
    })
    .sort({ date: -1 })
    .limit(parseInt(limit))
    .populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};

// ─── CHECK-IN ─────────────────────────────────────────────────────────────
export const checkIn = async (req, res) => {
  try {
    const { date, checkInTime, location } = req.body;
    const employeeId = await getEmployeeIdForRequest(req);
    const today = date || new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        location: location || 'Office'
      });
    }

    if (attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const onTime = minutes >= 510 && minutes <= 570;
    
    attendance.checkInTime = checkInTime || getCurrentTimeString();
    attendance.status = onTime ? 'Present' : 'Late';
    attendance.onlineStatus = 'Online';

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    });
  }
};

// ─── CHECK-OUT ────────────────────────────────────────────────────────────
export const checkOut = async (req, res) => {
  try {
    const { date, checkOutTime } = req.body;
    const employeeId = await getEmployeeIdForRequest(req);
    const today = date || new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found'
      });
    }

    if (!attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out without checking in'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    attendance.checkOutTime = checkOutTime || getCurrentTimeString();
    attendance.onlineStatus = 'Offline';
    attendance.breakType = null;
    attendance.breakStartTime = null;
    attendance.breakRemainingSeconds = 0;

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: attendance
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: error.message
    });
  }
};

// ─── MARK ATTENDANCE ──────────────────────────────────────────────────────
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, email, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let employee;
    if (employeeId) {
      employee = await Employee.findOne({ employeeId });
    }
    if (!employee && email) {
      employee = await Employee.findOne({ email: email.toLowerCase().trim() });
    }
    if (!employee && req.user?._id) {
      employee = await Employee.findOne({ userId: req.user._id });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found. Please contact HR to set up your profile.'
      });
    }

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: targetDate
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: employee._id,
        date: targetDate,
        location: 'Office'
      });
    }

    if (attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today'
      });
    }

    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const onTimeLimit = 9 * 60 + 30;
    const isOnTime = minutes <= onTimeLimit;
    const statusText = isOnTime ? 'Present' : 'Late';
    
    attendance.checkInTime = getCurrentTimeString();
    attendance.status = statusText;
    attendance.onlineStatus = 'Online';

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      status: statusText,
      checkInTime: attendance.checkInTime,
      data: attendance
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// ─── START BREAK ──────────────────────────────────────────────────────────
export const startBreak = async (req, res) => {
  try {
    const { breakType } = req.body;
    const employeeId = await getEmployeeIdForRequest(req);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    if (!BREAK_CONFIG[breakType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid break type'
      });
    }

    if (!isBreakAvailable(breakType, now)) {
      return res.status(400).json({
        success: false,
        message: `${BREAK_CONFIG[breakType].label} is not available at this time`
      });
    }

    const remainingMinutes = calculateRemainingBreakTime(breakType, now);
    const remainingSeconds = Math.floor(remainingMinutes * 60);

    if (remainingSeconds <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No break time remaining'
      });
    }

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        status: 'Not Marked',
        onlineStatus: 'Offline'
      });
    }

    const breakLabel = BREAK_CONFIG[breakType].label;
    attendance.onlineStatus = breakLabel;
    attendance.breakType = breakType;
    attendance.breakStartTime = now;
    attendance.breakRemainingSeconds = remainingSeconds;

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: `${breakLabel} break started`,
      data: {
        attendance,
        breakType,
        remainingSeconds,
        breakLabel
      }
    });
  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start break',
      error: error.message
    });
  }
};

// ─── END BREAK ────────────────────────────────────────────────────────────
export const endBreak = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForRequest(req);
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found'
      });
    }

    if (!attendance.breakType || attendance.onlineStatus === 'Online') {
      return res.status(400).json({
        success: false,
        message: 'No active break to end'
      });
    }

    attendance.onlineStatus = 'Online';
    attendance.breakType = null;
    attendance.breakStartTime = null;
    attendance.breakRemainingSeconds = 0;

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Break ended successfully',
      data: attendance
    });
  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end break',
      error: error.message
    });
  }
};

// ─── GET BREAK REMAINING TIME ────────────────────────────────────────────
export const getBreakRemaining = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForRequest(req);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance || !attendance.breakType) {
      return res.status(200).json({
        success: true,
        data: {
          isOnBreak: false,
          remainingSeconds: 0
        }
      });
    }

    const startTime = new Date(attendance.breakStartTime);
    const config = BREAK_CONFIG[attendance.breakType];
    const totalAllowedMinutes = config ? calculateRemainingBreakTime(attendance.breakType, startTime) : 15;
    const totalAllowedSeconds = totalAllowedMinutes * 60;
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

    if (remainingSeconds <= 0) {
      attendance.onlineStatus = 'Online';
      attendance.breakType = null;
      attendance.breakStartTime = null;
      attendance.breakRemainingSeconds = 0;
      await attendance.save();

      return res.status(200).json({
        success: true,
        data: {
          isOnBreak: false,
          remainingSeconds: 0,
          breakEnded: true
        }
      });
    }

    attendance.breakRemainingSeconds = remainingSeconds;
    await attendance.save();

    res.status(200).json({
      success: true,
      data: {
        isOnBreak: true,
        remainingSeconds,
        breakType: attendance.breakType,
        breakLabel: attendance.onlineStatus
      }
    });
  } catch (error) {
    console.error('Get break remaining error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get break time',
      error: error.message
    });
  }
};

// ─── GET BREAK STATUS ────────────────────────────────────────────────────
export const getBreakStatus = async (req, res) => {
  try {
    const employeeId = await getEmployeeIdForRequest(req);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    const availableBreaks = [];

    for (const [type, config] of Object.entries(BREAK_CONFIG)) {
      if (isBreakAvailable(type, now)) {
        const remainingMinutes = calculateRemainingBreakTime(type, now);
        if (remainingMinutes > 0) {
          availableBreaks.push({
            type,
            label: config.label,
            duration: config.duration,
            remainingMinutes: Math.floor(remainingMinutes),
            remainingSeconds: Math.floor(remainingMinutes * 60)
          });
        }
      }
    }

    let currentBreak = null;
    if (attendance?.breakType && attendance?.onlineStatus !== 'Online') {
      const startTime = new Date(attendance.breakStartTime);
      const config = BREAK_CONFIG[attendance.breakType];
      const totalAllowedMinutes = config ? calculateRemainingBreakTime(attendance.breakType, startTime) : 15;
      const totalAllowedSeconds = totalAllowedMinutes * 60;
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);
      
      currentBreak = {
        type: attendance.breakType,
        label: attendance.onlineStatus,
        remainingMinutes: Math.floor(remainingSeconds / 60),
        remainingSeconds: remainingSeconds,
        startTime: attendance.breakStartTime
      };
    }

    res.status(200).json({
      success: true,
      data: {
        availableBreaks,
        currentBreak,
        isOnBreak: !!(attendance?.breakType && attendance?.onlineStatus !== 'Online'),
        onlineStatus: attendance?.onlineStatus || 'Offline'
      }
    });
  } catch (error) {
    console.error('Get break status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get break status',
      error: error.message
    });
  }
};

// ─── UPDATE STATUS ────────────────────────────────────────────────────────
export const updateStatus = async (req, res) => {
  try {
    const { status, breakType } = req.body;
    let employeeId = req.body.employeeId;
    
    // Resolve the actual Employee document ID
    let resolvedEmployeeId = null;
    if (employeeId) {
      // 1. Try finding Employee by _id
      let employee = await Employee.findById(employeeId);
      if (employee) {
        resolvedEmployeeId = employee._id;
      } else {
        // 2. Try finding Employee by userId (if passed employeeId is a user ID)
        employee = await Employee.findOne({ userId: employeeId });
        if (employee) {
          resolvedEmployeeId = employee._id;
        } else {
          // 3. Try finding Employee by employeeId string (e.g. "emp-001")
          employee = await Employee.findOne({ employeeId: employeeId });
          if (employee) {
            resolvedEmployeeId = employee._id;
          }
        }
      }
    }

    if (!resolvedEmployeeId && req.user) {
      resolvedEmployeeId = await getEmployeeIdForRequest(req);
    }

    if (!resolvedEmployeeId) {
      return res.status(400).json({
        success: false,
        message: 'Could not resolve employee profile'
      });
    }

    employeeId = resolvedEmployeeId;
    const today = new Date().toISOString().split('T')[0];

    let attendance = await Attendance.findOne({
      employee: employeeId,
      date: today
    });

    if (!attendance) {
      attendance = new Attendance({
        employee: employeeId,
        date: today,
        status: 'Not Marked',
        onlineStatus: 'Offline'
      });
    }

    if (status === 'Online') {
      attendance.onlineStatus = 'Online';
      attendance.breakType = null;
      attendance.breakStartTime = null;
      attendance.breakRemainingSeconds = 0;
      
      if (!attendance.checkInTime) {
        attendance.checkInTime = getCurrentTimeString();
        attendance.status = 'Present';
      }
    } else if (breakType && BREAK_CONFIG[breakType]) {
      const breakLabel = BREAK_CONFIG[breakType].label;
      attendance.onlineStatus = breakLabel;
      attendance.breakType = breakType;
      attendance.breakStartTime = new Date();
      
      const remainingMinutes = calculateRemainingBreakTime(breakType, new Date());
      attendance.breakRemainingSeconds = Math.floor(remainingMinutes * 60);
    } else {
      attendance.onlineStatus = 'Offline';
      attendance.breakType = null;
      attendance.breakStartTime = null;
      attendance.breakRemainingSeconds = 0;
    }

    await attendance.save();
    await attendance.populate('employee', 'firstName lastName employeeId');

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// ─── ADMIN SUMMARY ────────────────────────────────────────────────────────
export const getAdminSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const employees = await Employee.find({})
      .select('_id firstName lastName employeeId department designation role');

    const attendanceRecords = await Attendance.find({
      date: targetDate
    });

    const result = employees.map(emp => {
      const record = attendanceRecords.find(
        att => att.employee.toString() === emp._id.toString()
      );

      return {
        _id: record?._id || `att_${emp._id}`,
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        name: `${emp.firstName} ${emp.lastName}`,
        role: emp.role,
        designation: emp.designation,
        department: emp.department || '—',
        date: targetDate,
        status: record?.status || 'Absent',
        checkInTime: record?.checkInTime || null,
        checkOutTime: record?.checkOutTime || null,
        onlineStatus: record?.onlineStatus || 'Offline',
        breakType: record?.breakType || null,
        isOnLeave: record?.isOnLeave || false,
        leaveType: record?.leaveType || null,
        breakRemainingSeconds: record?.breakRemainingSeconds || 0
      };
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Admin summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin summary',
      error: error.message
    });
  }
};

/**
 * @desc Get weekly attendance report for an employee
 * @route GET /api/attendance/report/weekly/:employeeId
 */
export const getWeeklyReport = async (req, res) => {
  try {
    // Ensure only Admin can access this report
    if (req.user?.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { employeeId } = req.params;
    
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all completed sessions from the last 7 days
    const records = await Attendance.find({
      employee: employee._id,
      loginTime: { $gte: sevenDaysAgo },
      logoutTime: { $ne: null }
    });

    if (records.length === 0) {
      return res.status(200).json({ message: "No attendance found for this week." });
    }

    let totalDurationMs = 0;
    records.forEach(record => {
      if (record.loginTime && record.logoutTime) {
        totalDurationMs += (new Date(record.logoutTime).getTime() - new Date(record.loginTime).getTime());
      }
    });

    const totalHours = (totalDurationMs / (1000 * 60 * 60)).toFixed(2);

    res.status(200).json({ totalHours, recordsCount: records.length, records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};