import Performance from "../models/Performance.js";
import User from "../models/User.js";
import { sendPerformanceReviewEmail } from "../services/emailService.js";

const getEmployeeDisplayName = (employee) => {
  if (!employee) return "Employee";
  if (employee.firstName || employee.lastName) {
    return `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
  }
  return employee.name || "Employee";
};

// Create performance record
export const createPerformance = async (req, res) => {
  try {
    const { employee, attendancePercent, tasksCompleted, tasksAssigned, qualityScore, managerFeedback } = req.body;
    const perf = new Performance({ employee, attendancePercent, tasksCompleted, tasksAssigned, qualityScore, managerFeedback });
    await perf.save();
    const populated = await Performance.findById(perf._id).populate(
      "employee",
      "firstName lastName email name"
    );

    try {
      const employee = populated?.employee;
      if (employee?.email) {
        const reviewPeriod = new Date().toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });

        await sendPerformanceReviewEmail({
          to: employee.email,
          employeeName: getEmployeeDisplayName(employee),
          reviewPeriod,
          rating: perf.overallScore ?? perf.qualityScore,
          reviewerName: req.user?.name,
          summary: perf.managerFeedback,
        });
      }
    } catch (emailError) {
      console.error(
        "[email] Performance review email failed:",
        emailError.message
      );
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get performance by employeeId
export const getPerformanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const records = await Performance.find({ employee: employeeId }).populate("employee", "name email");
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all performances (admin/manager view)
export const getAllPerformances = async (req, res) => {
  try {
    const records = await Performance.find().populate("employee", "name email");
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update performance
export const updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const perf = await Performance.findById(id);
    if (!perf) return res.status(404).json({ message: "Performance record not found" });
    const fields = ["attendancePercent", "tasksCompleted", "tasksAssigned", "qualityScore", "managerFeedback"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) perf[f] = req.body[f];
    });
    perf.calculateOverall();
    await perf.save();
    const populated = await Performance.findById(perf._id).populate("employee", "name email");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete performance
export const deletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const perf = await Performance.findByIdAndDelete(id);
    if (!perf) return res.status(404).json({ message: "Performance record not found" });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
