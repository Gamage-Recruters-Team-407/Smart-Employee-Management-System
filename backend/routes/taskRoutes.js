import express from "express";
import {
  getTasks,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  updateTaskProgress,
  addTaskComment,
  deleteTask,
  getTaskCapabilities,
  getActiveTaskCount,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  authorizeTaskManager,
  authorizeTaskParticipant,
  authorizeTaskProgressAssignee,
  authorizeTaskStatusAssignee,
} from "../middleware/taskMiddleware.js";

const router = express.Router();

// Employee: own tasks | HR Manager (dept HR + designation Manager): full management
router.get("/capabilities", protect, getTaskCapabilities);
router.get("/active-count", protect, getActiveTaskCount);
router.get("/my", protect, getMyTasks);

router.get("/", protect, authorizeTaskManager, getTasks);
router.post("/", protect, authorizeTaskManager, createTask);

router.patch("/:id/status", protect, authorizeTaskStatusAssignee, updateTaskStatus);
router.patch("/:id/progress", protect, authorizeTaskProgressAssignee, updateTaskProgress);
router.post("/:id/comments", protect, authorizeTaskParticipant, addTaskComment);

router.get("/:id", protect, authorizeTaskManager, getTaskById);
router.put("/:id", protect, authorizeTaskManager, updateTask);
router.delete("/:id", protect, authorizeTaskManager, deleteTask);

export default router;