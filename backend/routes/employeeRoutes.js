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

export default router;
