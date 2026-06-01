// import Task from "../models/Task.js";
// import Employee from "../models/Employee.js";
// <<<<<<< HEAD
// import { sendTaskAssignedEmail } from "../services/emailService.js";

// const getEmployeeDisplayName = (employee) => {
//   if (!employee) return "Employee";
//   return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee";
// };

// const formatDate = (date) =>
//   date ? new Date(date).toLocaleDateString("en-US") : "N/A";

// // @desc    Create and assign a new task (Manager)
// // @route   POST /api/tasks
// export const createTask = async (req, res) => {
//   try {
//     const { title, description, assignedTo, dueDate, priority } = req.body;

//     if (!title || !assignedTo) {
//       return res.status(400).json({
//         message: "title and assignedTo are required",
//       });
//     }

//     const employee = await Employee.findById(assignedTo).select(
//       "email firstName lastName"
//     );
//     if (!employee) {
//       return res.status(404).json({ message: "Assigned employee not found" });
// =======
// import mongoose from "mongoose";

// const getAssigneeSnapshot = async (assignedToId) => {
//   const employee = await Employee.findById(assignedToId);
//   if (!employee) return null;
//   return {
//     assignedTo: employee._id,
//     assignedToEmail: employee.email?.toLowerCase(),
//   };
// };

// const STATUSES = ["To Do", "In Progress", "Review", "Completed"];

// const validateTaskInput = (
//   body,
//   { requireAssignee = true, allowPastDueDate = false } = {}
// ) => {
//   const errors = {};
//   const title = body.title?.trim();

//   if (!title) {
//     errors.title = "Title is required";
//   } else if (title.length < 3) {
//     errors.title = "Title must be at least 3 characters";
//   } else if (title.length > 100) {
//     errors.title = "Title must not exceed 100 characters";
//   }

//   const description = body.description?.trim();
//   if (description && description.length > 500) {
//     errors.description = "Description must not exceed 500 characters";
//   }

//   if (requireAssignee && !body.assignedTo) {
//     errors.assignedTo = "Please select an employee to assign";
//   } else if (body.assignedTo && !mongoose.Types.ObjectId.isValid(body.assignedTo)) {
//     errors.assignedTo = "Invalid employee selected";
//   }

//   if (!body.dueDate) {
//     errors.dueDate = "Due date is required";
//   } else {
//     const due = new Date(body.dueDate);
//     if (Number.isNaN(due.getTime())) {
//       errors.dueDate = "Invalid due date";
//     } else {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       due.setHours(0, 0, 0, 0);
//       if (!allowPastDueDate && due < today) {
//         errors.dueDate = "Due date cannot be in the past";
//       }
//     }
//   }

//   if (body.status && !STATUSES.includes(body.status)) {
//     errors.status = "Invalid status";
//   }

//   return { errors, title, description };
// };

// export const getTasks = async (req, res) => {
//   try {
//     const filter = {};
//     if (req.query.status && STATUSES.includes(req.query.status)) {
//       filter.status = req.query.status;
//     }
//     const tasks = await Task.find(filter)
//       .populate("assignedTo", "firstName lastName employeeId email department")
//       .sort({ updatedAt: -1 });
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// /** Employee-scoped: only tasks for req.user.id (mock header or future JWT) */
// export const getMyTasks = async (req, res) => {
//   try {
//     const filter = { assignedTo: req.user.id };
//     if (req.query.status && STATUSES.includes(req.query.status)) {
//       filter.status = req.query.status;
//     }
//     const tasks = await Task.find(filter)
//       .populate("assignedTo", "firstName lastName employeeId email department")
//       .sort({ dueDate: 1, updatedAt: -1 });
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getTaskById = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id).populate(
//       "assignedTo",
//       "firstName lastName employeeId department"
//     );
//     if (!task) return res.status(404).json({ message: "Task not found" });
//     res.json(task);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const createTask = async (req, res) => {
//   try {
//     const { assignedTo, dueDate, status } = req.body;
//     const { errors, title, description } = validateTaskInput(req.body);

//     if (Object.keys(errors).length > 0) {
//       return res.status(400).json({ message: "Validation failed", errors });
//     }

//     const assignee = await getAssigneeSnapshot(assignedTo);
//     if (!assignee) {
//       return res.status(400).json({ message: "Assigned employee not found" });
// >>>>>>> 1fb63b3360fb66ed30b436aa24ad432255b11aea
//     }

//     const task = await Task.create({
//       title,
// <<<<<<< HEAD
//       description,
//       assignedTo,
//       dueDate,
//       status: "To Do",
//     });

//     const populated = await Task.findById(task._id).populate(
//       "assignedTo",
//       "firstName lastName email"
//     );

//     if (employee.email) {
//       try {
//         await sendTaskAssignedEmail({
//           to: employee.email,
//           employeeName: getEmployeeDisplayName(employee),
//           taskTitle: title,
//           dueDate: formatDate(dueDate),
//           priority: priority || "medium",
//           assignedBy: req.user?.name,
//         });
//       } catch (emailError) {
//         console.error(
//           "[email] Task assigned email failed:",
//           emailError.message
//         );
//       }
//     }

//     return res.status(201).json(populated);
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get all tasks
// // @route   GET /api/tasks
// export const getTasks = async (req, res) => {
//   try {
//     const tasks = await Task.find()
//       .populate("assignedTo", "firstName lastName email department")
//       .sort({ createdAt: -1 });

//     return res.status(200).json(tasks);
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// // @desc    Get tasks assigned to an employee
// // @route   GET /api/tasks/employee/:employeeId
// export const getTasksByEmployee = async (req, res) => {
//   try {
//     const tasks = await Task.find({ assignedTo: req.params.employeeId })
//       .populate("assignedTo", "firstName lastName email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json(tasks);
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
// =======
//       description: description || undefined,
//       ...assignee,
//       dueDate,
//       status: STATUSES.includes(status) ? status : "To Do",
//       progress: status === "Completed" ? 100 : 0,
//     });
//     const populated = await Task.findById(task._id).populate(
//       "assignedTo",
//       "firstName lastName employeeId department"
//     );
//     res.status(201).json(populated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateTask = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const { errors, title, description } = validateTaskInput(req.body, {
//       allowPastDueDate: true,
//     });

//     if (Object.keys(errors).length > 0) {
//       return res.status(400).json({ message: "Validation failed", errors });
//     }

//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     task.title = title;
//     task.description = description || undefined;
//     if (req.body.assignedTo) {
//       const assignee = await getAssigneeSnapshot(req.body.assignedTo);
//       if (!assignee) {
//         return res.status(400).json({ message: "Assigned employee not found" });
//       }
//       task.assignedTo = assignee.assignedTo;
//       task.assignedToEmail = assignee.assignedToEmail;
//     }
//     task.dueDate = req.body.dueDate;
//     if (status && STATUSES.includes(status)) {
//       task.status = status;
//     }

//     await task.save();
//     const populated = await Task.findById(task._id).populate(
//       "assignedTo",
//       "firstName lastName employeeId department"
//     );
//     res.json(populated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateTaskStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     if (!STATUSES.includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     task.status = status;

//     await task.save();
//     const populated = await Task.findById(task._id).populate(
//       "assignedTo",
//       "firstName lastName employeeId department"
//     );
//     res.json(populated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateTaskProgress = async (req, res) => {
//   try {
//     const { progress } = req.body;
//     const value = Number(progress);
//     if (Number.isNaN(value) || value < 0 || value > 100) {
//       return res.status(400).json({ message: "Progress must be between 0 and 100" });
//     }
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     task.progress = value;
//     if (value === 100) task.status = "Completed";
//     else if (value > 0 && task.status === "To Do") task.status = "In Progress";

//     await task.save();
//     const populated = await Task.findById(task._id).populate(
//       "assignedTo",
//       "firstName lastName employeeId department"
//     );
//     res.json(populated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const addTaskComment = async (req, res) => {
//   try {
//     const { text, author } = req.body;
//     if (!text?.trim()) {
//       return res.status(400).json({ message: "Comment text is required" });
//     }
//     const task = await Task.findById(req.params.id);
//     if (!task) return res.status(404).json({ message: "Task not found" });

//     task.comments.push({ text: text.trim(), author: author || "Admin" });
//     await task.save();
//     const populated = await Task.findById(task._id).populate(
//       "assignedTo",
//       "firstName lastName employeeId department"
//     );
//     res.json(populated);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const deleteTask = async (req, res) => {
//   try {
//     const task = await Task.findByIdAndDelete(req.params.id);
//     if (!task) return res.status(404).json({ message: "Task not found" });
//     res.json({ message: "Task deleted" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
// >>>>>>> 1fb63b3360fb66ed30b436aa24ad432255b11aea
//   }
// };

import mongoose from "mongoose";

import Task from "../models/Task.js";
import Employee from "../models/Employee.js";
import { sendTaskAssignedEmail } from "../services/emailService.js";
import {
  getEmployeeIdForRequest,
  resolveEmployeeForAuthUser,
} from "../utils/employeeUserLink.js";
import {
  TASK_STATUSES,
  buildTaskCapabilities,
} from "../utils/taskPermissions.js";

const STATUSES = TASK_STATUSES;

/** GET /api/tasks/capabilities */
export const getTaskCapabilities = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, {
      createIfMissing: true,
    });
    res.json(buildTaskCapabilities(req.user, employee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeDisplayName = (employee) => {
  if (!employee) return "Employee";

  return (
    `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
    employee.name ||
    "Employee"
  );
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-US") : "N/A";

const getAssigneeSnapshot = async (assignedToId) => {
  const employee = await Employee.findById(assignedToId);

  if (!employee) return null;

  return {
    assignedTo: employee._id,
    assignedToEmail: employee.email?.toLowerCase(),
    employee,
  };
};

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
  } else if (
    body.assignedTo &&
    !mongoose.Types.ObjectId.isValid(body.assignedTo)
  ) {
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

  return {
    errors,
    title,
    description,
  };
};

// Get all tasks
export const getTasks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "firstName lastName employeeId email department")
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get tasks assigned to logged-in employee (matched by Employee email / id)
export const getMyTasks = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, {
      createIfMissing: true,
    });

    if (!employee) {
      return res.status(404).json({
        message:
          "No employee profile for this account. Sign out and sign in again, or ask HR to add your email to the employee list.",
      });
    }

    const employeeId = employee._id;
    const email = employee?.email?.toLowerCase().trim();

    const filter = {
      $or: [{ assignedTo: employeeId }],
    };
    if (email) {
      filter.$or.push({ assignedToEmail: email });
    }

    if (req.query.status && STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "firstName lastName employeeId email department")
      .sort({ dueDate: 1, updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "firstName lastName employeeId email department"
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Create task
export const createTask = async (req, res) => {
  try {
    const { assignedTo, dueDate, status, priority } = req.body;

    const { errors, title, description } = validateTaskInput(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const assignee = await getAssigneeSnapshot(assignedTo);

    if (!assignee) {
      return res.status(400).json({
        message: "Assigned employee not found",
      });
    }

    const task = await Task.create({
      title,
      description: description || undefined,
      assignedTo: assignee.assignedTo,
      assignedToEmail: assignee.assignedToEmail,
      dueDate,
      status: STATUSES.includes(status) ? status : "To Do",
      progress: status === "Completed" ? 100 : 0,
    });

    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId email department"
    );

    // Send assigned task email
    if (assignee.employee?.email) {
      try {
        await sendTaskAssignedEmail({
          to: assignee.employee.email,
          employeeName: getEmployeeDisplayName(assignee.employee),
          taskTitle: title,
          dueDate: formatDate(dueDate),
          priority: priority || "medium",
          assignedBy: req.user?.name || "Admin",
        });
      } catch (emailError) {
        console.error("[email] Task assigned email failed:", emailError.message);
      }
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update full task
export const updateTask = async (req, res) => {
  try {
    const { status } = req.body;

    const { errors, title, description } = validateTaskInput(req.body, {
      allowPastDueDate: true,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.title = title;
    task.description = description || undefined;

    if (req.body.assignedTo) {
      const assignee = await getAssigneeSnapshot(req.body.assignedTo);

      if (!assignee) {
        return res.status(400).json({
          message: "Assigned employee not found",
        });
      }

      task.assignedTo = assignee.assignedTo;
      task.assignedToEmail = assignee.assignedToEmail;
    }

    task.dueDate = req.body.dueDate;

    if (status && STATUSES.includes(status)) {
      task.status = status;
    }

    await task.save();

    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId email department"
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.status = status;

    if (status === "Completed") {
      task.progress = 100;
    }

    await task.save();

    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId email department"
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Update task progress
export const updateTaskProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    const value = Number(progress);

    if (Number.isNaN(value) || value < 0 || value > 100) {
      return res.status(400).json({
        message: "Progress must be between 0 and 100",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.progress = value;

    if (value === 100) {
      task.status = "Completed";
    } else if (value > 0 && task.status === "To Do") {
      task.status = "In Progress";
    }

    await task.save();

    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId email department"
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Add comment
export const addTaskComment = async (req, res) => {
  try {
    const { text, author } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.comments.push({
      text: text.trim(),
      author: author || req.user?.name || req.user?.role || "HR/Manager",
    });

    await task.save();

    const populated = await Task.findById(task._id).populate(
      "assignedTo",
      "firstName lastName employeeId email department"
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get tasks by employee ID
export const getTasksByEmployee = async (req, res) => {
  try {
    const tasks = await Task.find({
      assignedTo: req.params.employeeId,
    })
      .populate("assignedTo", "firstName lastName employeeId email department")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};