import DailyReport from "../models/DailyReport.js";
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

// GET /api/daily-reports/all?date=YYYY-MM-DD  (Admin / HR only)
// Returns all employee reports for a given date
export const getAllReports = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const reports = await DailyReport.find({ date })
      .populate("employeeId", "firstName lastName employeeId department")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};