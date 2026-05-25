import Task from "../models/Task.js";
import mongoose from "mongoose";

const STATUSES = ["To Do", "In Progress", "Review", "Completed"];

const validateTaskInput = (
  body,
  { requireAssignee = true, allowPastDueDate = false } = {}
) => {
  const errors = {};
  const title = body.title?.trim();

  if (!title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title must not exceed 100 characters";
  }

  const description = body.description?.trim();
  if (description && description.length > 500) {
    errors.description = "Description must not exceed 500 characters";
  }

  if (requireAssignee && !body.assignedTo) {
    errors.assignedTo = "Please select an employee to assign";
  } else if (body.assignedTo && !mongoose.Types.ObjectId.isValid(body.assignedTo)) {
    errors.assignedTo = "Invalid employee selected";
  }

  if (!body.dueDate) {
    errors.dueDate = "Due date is required";
  } else {
    const due = new Date(body.dueDate);
    if (Number.isNaN(due.getTime())) {
      errors.dueDate = "Invalid due date";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      if (!allowPastDueDate && due < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }
  }

  if (body.status && !STATUSES.includes(body.status)) {
    errors.status = "Invalid status";
  }

  return { errors, title, description };
};

export const getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const tasks = await Task.find(filter)
      .populate("assignedTo", "firstName lastName employeeId department")
      .sort({ updatedAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "firstName lastName employeeId department"
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { assignedTo, dueDate, status } = req.body;
    const { errors, title, description } = validateTaskInput(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const task = await Task.create({
      title,
      description: description || undefined,
      assignedTo,
      dueDate,
      status: STATUSES.includes(status) ? status : "To Do",
      progress: status === "Completed" ? 100 : 0,
    });
    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId department"
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { status } = req.body;
    const { errors, title, description } = validateTaskInput(req.body, {
      allowPastDueDate: true,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.title = title;
    task.description = description || undefined;
    task.assignedTo = req.body.assignedTo || null;
    task.dueDate = req.body.dueDate;
    if (status && STATUSES.includes(status)) {
      task.status = status;
    }

    await task.save();
    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId department"
    );
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = status;

    await task.save();
    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId department"
    );
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const value = Number(progress);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      return res.status(400).json({ message: "Progress must be between 0 and 100" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.progress = value;
    if (value === 100) task.status = "Completed";
    else if (value > 0 && task.status === "To Do") task.status = "In Progress";

    await task.save();
    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId department"
    );
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addTaskComment = async (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.comments.push({ text: text.trim(), author: author || "Admin" });
    await task.save();
    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId department"
    );
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
