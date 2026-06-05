import { Router } from "express";
import {
  createEmployee,
  getEmployees,
  getMyProfile,
  getEmployeeById,
  getEmployeeTasks,
  updateEmployee,
  deleteEmployee,
  uploadProfilePhoto,
  bulkDeleteEmployees,
  getEmployeeStats,
  getEmployeeStatsDetailed,
  importEmployees,
  getEmployeeHistory,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { imageUpload } from "../config/multer.js";

const router = Router();

// 🔐 සියලුම Employee Routes සඳහා Authentication (Token Verification) අනිවාර්ය කරයි
router.use(protect);

// ─── 1. Static & Aggregate Routes (MUST come before /:id) ───────────────────
// 🚨 විශේෂ සටහන: dynamic routes (/:id) වලට කලින් ස්ථාවර routes අනිවාර්යයෙන්ම දැමිය යුතුය.
router.get("/me", getMyProfile);
router.get("/stats", getEmployeeStats);
router.get("/stats/detailed", getEmployeeStatsDetailed);
router.post("/import", importEmployees);
router.delete("/bulk", bulkDeleteEmployees);

// ─── 2. General CRUD Routes ──────────────────────────────────────────────────
router.post("/", createEmployee);
router.get("/", getEmployees);

// ─── 3. Single-Employee Dynamic Routes ────────────────────────────────────────
router.get("/:id/tasks", getEmployeeTasks);
router.get("/:id/history", getEmployeeHistory);
router.post("/:id/photo", imageUpload.single("photo"), uploadProfilePhoto);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;