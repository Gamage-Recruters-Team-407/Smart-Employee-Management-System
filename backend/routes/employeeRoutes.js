<<<<<<< HEAD
import { Router } from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  uploadProfilePhoto,
  bulkDeleteEmployees,
  getEmployeeStats,
  getEmployeeStatsDetailed,
  importEmployees,
  getEmployeeHistory,
} from "../controllers/employeeController.js";
import { imageUpload } from "../config/multer.js";
import mockAuth from "../middleware/authMiddleware.js";

const router = Router();

// Apply mock auth to all routes
router.use(mockAuth);

// ── Static / aggregate routes (MUST come before /:id) ─────────────────────────
router.get("/stats", getEmployeeStats);
router.get("/stats/detailed", getEmployeeStatsDetailed);
router.post("/import", importEmployees);
router.delete("/bulk", bulkDeleteEmployees);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router.post("/", createEmployee);
router.get("/", getEmployees);

// ── Single-employee routes ────────────────────────────────────────────────────
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.post("/:id/photo", imageUpload.single("photo"), uploadProfilePhoto);
router.get("/:id/history", getEmployeeHistory);
=======
import express from "express";
import {
  getEmployees,
  createEmployee,
  getEmployeeById,
  getEmployeeTasks,
} from "../controllers/employeeController.js";

const router = express.Router();

router.get("/", getEmployees);
router.post("/", createEmployee);
router.get("/:id/tasks", getEmployeeTasks);
router.get("/:id", getEmployeeById);
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0

export default router;
