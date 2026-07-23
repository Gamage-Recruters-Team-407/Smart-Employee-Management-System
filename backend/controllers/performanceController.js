import mongoose from "mongoose";
import Performance from "../models/Performance.js";
import User from "../models/User.js";
import { managerRoles } from "../middleware/roleMiddleware.js";

const isManagerRole = (role) => managerRoles.includes(role);
const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const employeePopulate = { path: "employee", select: "name email role" };
const managerFeedbackPopulate = { path: "managerFeedback.manager", select: "name email role" };

export const getAllPerformanceRecords = async (req, res) => {
  try {
    const { role, id } = req.user;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (role === "Employee") {
      let ownRecords = await Performance.find({ employee: id })
        .populate(employeePopulate)
        .populate(managerFeedbackPopulate)
        .sort({ year: -1, month: -1 });

      return res.json(ownRecords);
    }

    const records = await Performance.find()
      .populate(employeePopulate)
      .populate(managerFeedbackPopulate)
      .sort({ year: -1, month: -1, overallScore: -1 });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch performance records.", error: error.message });
  }
};

export const getPerformanceByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!validateObjectId(employeeId)) {
      return res.status(400).json({ message: "Invalid employee id." });
    }

    if (req.user.role === "Employee" && req.user.id !== employeeId) {
      return res.status(403).json({ message: "Employees can only view their own performance score." });
    }

    const records = await Performance.find({ employee: employeeId })
      .populate(employeePopulate)
      .populate(managerFeedbackPopulate)
      .sort({ year: -1, month: -1 });

    if (!records || records.length === 0) {
      return res.status(404).json({ message: "Performance records not found." });
    }

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch performance record.", error: error.message });
  }
};

export const createPerformance = async (req, res) => {
  try {
    const { employee } = req.body;

    if (!validateObjectId(employee)) {
      return res.status(400).json({ message: "Valid employee id is required." });
    }

    const user = await User.findById(employee);
    if (!user) {
      return res.status(404).json({ message: "Employee user not found." });
    }

    let currentMonth = req.body.month;
    let currentYear = req.body.year;

    if (!currentMonth || !currentYear) {
      currentMonth = new Date().getMonth() + 1;
      currentYear = new Date().getFullYear();
    }

    const existing = await Performance.findOne({ employee, month: currentMonth, year: currentYear });
    if (existing) {
      return res.status(409).json({ message: `Performance record already exists for this employee for ${currentMonth}/${currentYear}.` });
    }

    const newPerformance = await Performance.create({
      employee,
      month: currentMonth,
      year: currentYear,
      attendanceScore: req.body.attendanceScore,
      tasksCompleted: req.body.tasksCompleted,
      tasksAssigned: req.body.tasksAssigned,
      qualityScore: req.body.qualityScore,
      notes: req.body.notes || ""
    });

    if (req.body.feedback) {
      newPerformance.managerFeedback.push({
        manager: req.user.id,
        feedback: req.body.feedback,
        rating: req.body.feedbackRating || 3
      });
      await newPerformance.save();
    }

    const saved = await Performance.findById(newPerformance._id)
      .populate(employeePopulate)
      .populate(managerFeedbackPopulate);

    return res.status(201).json(saved);
  } catch (error) {
    return res.status(400).json({ message: "Failed to create performance record.", error: error.message });
  }
};

export const updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid performance record id." });
    }

    const performance = await Performance.findById(id);
    if (!performance) {
      return res.status(404).json({ message: "Performance record not found." });
    }

    const fields = ["attendanceScore", "tasksCompleted", "tasksAssigned", "qualityScore", "notes"];
    for (const key of fields) {
      if (req.body[key] !== undefined) {
        performance[key] = req.body[key];
      }
    }

    if (req.body.feedback) {
      performance.managerFeedback.push({
        manager: req.user.id,
        feedback: req.body.feedback,
        rating: req.body.feedbackRating || 3
      });
    }

    await performance.save();

    const updated = await Performance.findById(id)
      .populate(employeePopulate)
      .populate(managerFeedbackPopulate);

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: "Failed to update performance record.", error: error.message });
  }
};

export const addManagerFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid performance record id." });
    }

    const { feedback, rating } = req.body;
    if (!feedback) {
      return res.status(400).json({ message: "Feedback text is required." });
    }

    const performance = await Performance.findById(id);
    if (!performance) {
      return res.status(404).json({ message: "Performance record not found." });
    }

    performance.managerFeedback.push({
      manager: req.user.id,
      feedback,
      rating: rating || 3
    });

    await performance.save();

    const updated = await Performance.findById(id)
      .populate(employeePopulate)
      .populate(managerFeedbackPopulate);

    return res.json(updated);
  } catch (error) {
    return res.status(400).json({ message: "Failed to add manager feedback.", error: error.message });
  }
};

export const deletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid performance record id." });
    }

    const deleted = await Performance.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Performance record not found." });
    }

    return res.json({ message: "Performance record deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete performance record.", error: error.message });
  }
};

export const getPerformanceAccessSummary = (req, res) => {
  const canManage = isManagerRole(req.user.role);
  return res.json({
    role: req.user.role,
    canViewOwn: true,
    canManage
  });
};

// Compatibility aliases used by older routes/clients.
export const getPerformanceByEmployee = getPerformanceByEmployeeId;
export const getAllPerformances = getAllPerformanceRecords;
