import mongoose from "mongoose";
import DailyReport from "../models/DailyReport.js";
import Employee from "../models/Employee.js";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";

// GET /api/daily-reports/my?date=YYYY-MM-DD
// Returns the logged-in employee's report for a given date (today if omitted)
export const getMyReport = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, {
      createIfMissing: false,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const date = req.query.date || new Date().toISOString().split("T")[0];

    const report = await DailyReport.findOne({
      employeeId: employee._id,
      date,
    });

    if (!report) {
      return res.status(404).json({ message: "No report found for this date." });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/daily-reports/my-history
// Returns the logged-in employee's report history & aggregate stats
export const getMyReportsHistory = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, {
      createIfMissing: false,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const { page, limit = 6, startDate, endDate, search } = req.query;

    const query = { employeeId: employee._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { teamPosition: regex },
        { challengesIssues: regex },
        { dependenciesAssistance: regex },
        { plannedTasksTomorrow: regex },
        { additionalNotes: regex },
        { "tasks.description": regex },
      ];
    }

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 6, 100));
    const skip = (parsedPage - 1) * parsedLimit;

    const totalCount = await DailyReport.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalCount / parsedLimit));

    const reports = await DailyReport.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    // Compute aggregate stats across all matching records for the current filter
    const allMatching = await DailyReport.find(query).select("totalHours tasks.status").lean();

    let totalHoursMinutes = 0;
    let completedTasksCount = 0;
    let inProgressTasksCount = 0;
    let pendingTasksCount = 0;

    allMatching.forEach((r) => {
      if (r.totalHours) {
        const matchH = r.totalHours.match(/(\d+)\s*h/i);
        const matchM = r.totalHours.match(/(\d+)\s*m/i);
        let mins = 0;
        if (matchH) mins += parseInt(matchH[1], 10) * 60;
        if (matchM) mins += parseInt(matchM[1], 10);
        totalHoursMinutes += mins;
      }

      if (Array.isArray(r.tasks)) {
        r.tasks.forEach((t) => {
          if (t.status === "Completed") completedTasksCount++;
          else if (t.status === "In Progress") inProgressTasksCount++;
          else pendingTasksCount++;
        });
      }
    });

    const hoursLogged = Math.floor(totalHoursMinutes / 60);
    const minsLogged = totalHoursMinutes % 60;
    const formattedTotalHours =
      minsLogged > 0 ? `${hoursLogged}h ${minsLogged}m` : `${hoursLogged}h`;

    res.json({
      reports,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalCount,
        totalPages,
      },
      stats: {
        totalReports: totalCount,
        totalHoursLogged: formattedTotalHours,
        completedTasksCount,
        inProgressTasksCount,
        pendingTasksCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/daily-reports
// Creates or updates (upserts) the employee's report for a given date
export const upsertMyReport = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, {
      createIfMissing: false,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const {
      date,
      startTime,
      endTime,
      totalHours,
      teamPosition,
      workedOnTasks,
      tasks,
      challengesIssues,
      dependenciesAssistance,
      plannedTasksTomorrow,
      additionalNotes,
    } = req.body;

    // Basic validation
    if (!date || !startTime || !endTime || !teamPosition) {
      return res.status(400).json({
        message: "date, startTime, endTime, and teamPosition are required.",
      });
    }

    const fullName =
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
      employee.name ||
      req.user?.name ||
      "Employee";

    const reportData = {
      employeeId: employee._id,
      userId: req.user._id,
      fullName,
      date,
      startTime,
      endTime,
      totalHours: totalHours || "",
      teamPosition,
      workedOnTasks: workedOnTasks !== false,
      tasks: Array.isArray(tasks) ? tasks : [],
      challengesIssues: challengesIssues || "",
      dependenciesAssistance: dependenciesAssistance || "",
      plannedTasksTomorrow: plannedTasksTomorrow || "",
      additionalNotes: additionalNotes || "",
    };

    const report = await DailyReport.findOneAndUpdate(
      { employeeId: employee._id, date },
      { $set: reportData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(report);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// GET /api/daily-reports/all?date=YYYY-MM-DD (or ?startDate=...&endDate=... or ?all=true)  (Admin / HR only)
// Returns employee reports for a given date, range, or all
export const getAllReports = async (req, res) => {
  try {
    const { date, startDate, endDate, employeeId, all } = req.query;

    const query = {};

    if (employeeId) {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.employeeId = employeeId;
      } else {
        const emp = await Employee.findOne({ employeeId }).select("_id");
        if (emp) query.employeeId = emp._id;
      }
    }

    if (all === "true" || all === true) {
      // No date filter - returns all reports
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    } else if (date) {
      query.date = date;
    } else {
      query.date = new Date().toISOString().split("T")[0];
    }

    const reports = await DailyReport.find(query)
      .populate("employeeId", "firstName lastName employeeId department email designation role status")
      .sort({ date: -1, createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};