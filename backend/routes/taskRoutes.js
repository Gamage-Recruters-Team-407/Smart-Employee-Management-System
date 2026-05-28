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
} from "../controllers/taskController.js";
import { resolveUser } from "../middleware/resolveUser.js";

const router = express.Router();

router.get("/", getTasks);
router.get("/my", resolveUser, getMyTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id/status", updateTaskStatus);
router.patch("/:id/progress", updateTaskProgress);
router.post("/:id/comments", addTaskComment);
router.delete("/:id", deleteTask);

export default router;
