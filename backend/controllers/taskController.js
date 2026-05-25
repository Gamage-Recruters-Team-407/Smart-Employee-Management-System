import Task from "../models/Task.js";
import Employee from "../models/Employee.js";
import { sendTaskAssignedEmail } from "../services/emailService.js";

const getEmployeeDisplayName = (employee) => {
  if (!employee) return "Employee";
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee";
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-US") : "N/A";

// @desc    Create and assign a new task (Manager)
// @route   POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority } = req.body;

    if (!title || !assignedTo) {
      return res.status(400).json({
        message: "title and assignedTo are required",
      });
    }

    const employee = await Employee.findById(assignedTo).select(
      "email firstName lastName"
    );
    if (!employee) {
      return res.status(404).json({ message: "Assigned employee not found" });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      dueDate,
      status: "To Do",
    });

    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName email"
    );

    if (employee.email) {
      try {
        await sendTaskAssignedEmail({
          to: employee.email,
          employeeName: getEmployeeDisplayName(employee),
          taskTitle: title,
          dueDate: formatDate(dueDate),
          priority: priority || "medium",
          assignedBy: req.user?.name,
        });
      } catch (emailError) {
        console.error(
          "[email] Task assigned email failed:",
          emailError.message
        );
      }
    }

    return res.status(201).json(populated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("assignedTo", "firstName lastName email department")
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get tasks assigned to an employee
// @route   GET /api/tasks/employee/:employeeId
export const getTasksByEmployee = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.employeeId })
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
