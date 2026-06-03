import Task from "../models/Task.js";
import {
  resolveEmployeeForAuthUser,
  getEmployeeIdForRequest,
} from "../utils/employeeUserLink.js";
import { canManageTasks } from "../utils/taskPermissions.js";

const attachTaskContext = async (req) => {
  const employee = await resolveEmployeeForAuthUser(req.user, {
    createIfMissing: true,
  });
  req.employee = employee;
  req.employeeId = employee?._id || null;
  req.canManageTasks = canManageTasks(req.user, employee);
  return employee;
};

/** Create / assign / list all tasks / delete — HR Manager (DB) or Admin/HR/Manager role */
export const authorizeTaskManager = async (req, res, next) => {
  try {
    await attachTaskContext(req);
    if (!req.canManageTasks) {
      return res.status(403).json({
        message:
          "Task management requires Admin/HR/Manager role, or employee profile with department HR and designation Manager.",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || "Authorization failed" });
  }
};

const taskBelongsToEmployee = (task, employeeId, email) => {
  if (!task || !employeeId) return false;
  if (task.assignedTo?.toString() === employeeId.toString()) return true;
  if (email && task.assignedToEmail === email) return true;
  return false;
};

const assertAssigneeOr403 = async (req, res) => {
  const employeeId = await getEmployeeIdForRequest(req);
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return null;
  }

  const email = req.employee?.email?.toLowerCase().trim();
  if (!taskBelongsToEmployee(task, employeeId, email)) {
    res.status(403).json({
      message: "You can only update tasks assigned to you.",
    });
    return null;
  }

  req.isAssignee = true;
  return task;
};

/** Progress % — assigned employee only (not HR/Manager) */
export const authorizeTaskProgressAssignee = async (req, res, next) => {
  try {
    await attachTaskContext(req);
    if (req.canManageTasks) {
      return res.status(403).json({
        message: "Only the assigned employee can update task progress.",
      });
    }
    const task = await assertAssigneeOr403(req, res);
    if (!task) return;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || "Authorization failed" });
  }
};

/** Status — assigned employee only */
export const authorizeTaskStatusAssignee = async (req, res, next) => {
  try {
    await attachTaskContext(req);
    if (req.canManageTasks) {
      return res.status(403).json({
        message: "Only the assigned employee can update task status. Use My Tasks.",
      });
    }
    const task = await assertAssigneeOr403(req, res);
    if (!task) return;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || "Authorization failed" });
  }
};

/** Comments — managers or assigned employee */
export const authorizeTaskParticipant = async (req, res, next) => {
  try {
    await attachTaskContext(req);
    if (req.canManageTasks) {
      return next();
    }
    const task = await assertAssigneeOr403(req, res);
    if (!task) return;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || "Authorization failed" });
  }
};
