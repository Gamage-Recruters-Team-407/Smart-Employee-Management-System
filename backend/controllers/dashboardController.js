import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Performance from "../models/Performance.js";
import SimpleCache from "../utils/cache.js";

const statsCache = new SimpleCache(15000); // 15 seconds TTL

const TIMEZONE = process.env.APP_TIMEZONE || process.env.BREAK_TIMEZONE || "Asia/Colombo";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const cachedData = statsCache.get("dashboard_stats");
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    // Count all active employees (present, late, online)
    const totalEmployees = await Employee.countDocuments({ status: "Active" });

    // Count present today (checkInTime exists - includes late check-ins)
    const presentToday = await Attendance.countDocuments({
      date: today,
      checkInTime: { $exists: true, $ne: null }
    });

    const onLeave = await Leave.countDocuments({
      status: "Approved",
      startDate: { $lte: new Date(today) },
      endDate: { $gte: new Date(today) }
    });

    let avgPerformance = 0;
    const perfResult = await Performance.aggregate([
      { $group: { _id: null, avg: { $avg: "$overallScore" } } }
    ]);
    if (perfResult.length > 0) {
      avgPerformance = Math.round(perfResult[0].avg * 10) / 10;
    }

    const statsData = { totalEmployees, presentToday, onLeave, avgPerformance };
    statsCache.set("dashboard_stats", statsData);

    res.status(200).json({
      success: true,
      data: statsData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const recentAttendance = await Attendance.find({ checkInTime: { $exists: true } })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("employee", "firstName lastName");

    const recentLeaves = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("employee", "firstName lastName");

    const activities = [
      ...recentAttendance.map((a) => ({
        type: "attendance",
        name: `${a.employee?.firstName} ${a.employee?.lastName}`,
        message: `checked in at ${a.checkInTime}`,
        date: a.createdAt,
      })),
      ...recentLeaves.map((l) => ({
        type: "leave",
        name: `${l.employee?.firstName} ${l.employee?.lastName}`,
        message: `applied for ${l.leaveType} Leave`,
        date: l.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};