import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Performance from "../models/Performance.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

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

    res.status(200).json({
      success: true,
      data: { totalEmployees, presentToday, onLeave, avgPerformance }
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