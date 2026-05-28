// <<<<<<< HEAD
// // import express from "express";
// // <<<<<<< HEAD
// // import { getEmployees, createEmployee, getMyProfile } from "../controllers/employeeController.js";
// // import { protect } from "../middleware/authMiddleware.js";

// // const router = express.Router();

// // router.get("/me", protect, getMyProfile);
// // router.get("/", getEmployees);
// // router.post("/", createEmployee);
// // =======
// =======
// // <<<<<<< HEAD
// // import { Router } from "express";
// // import {
// //   createEmployee,
// //   getEmployees,
// //   getEmployeeById,
// //   updateEmployee,
// //   deleteEmployee,
// //   uploadProfilePhoto,
// //   bulkDeleteEmployees,
// //   getEmployeeStats,
// //   getEmployeeStatsDetailed,
// //   importEmployees,
// //   getEmployeeHistory,
// // } from "../controllers/employeeController.js";
// // import { imageUpload } from "../config/multer.js";
// // import mockAuth from "../middleware/authMiddleware.js";

// // const router = Router();

// // // Apply mock auth to all routes
// // router.use(mockAuth);

// // // ── Static / aggregate routes (MUST come before /:id) ─────────────────────────
// // router.get("/stats", getEmployeeStats);
// // router.get("/stats/detailed", getEmployeeStatsDetailed);
// // router.post("/import", importEmployees);
// // router.delete("/bulk", bulkDeleteEmployees);

// // // ── CRUD ──────────────────────────────────────────────────────────────────────
// // router.post("/", createEmployee);
// // router.get("/", getEmployees);

// // // ── Single-employee routes ────────────────────────────────────────────────────
// // router.get("/:id", getEmployeeById);
// // router.put("/:id", updateEmployee);
// // router.delete("/:id", deleteEmployee);
// // router.post("/:id/photo", imageUpload.single("photo"), uploadProfilePhoto);
// // router.get("/:id/history", getEmployeeHistory);
// // =======
// // import express from "express";
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
// // import {
// //   getEmployees,
// //   createEmployee,
// //   getEmployeeById,
// //   getEmployeeTasks,
// // } from "../controllers/employeeController.js";

// // const router = express.Router();

// // router.get("/", getEmployees);
// // router.post("/", createEmployee);
// // router.get("/:id/tasks", getEmployeeTasks);
// // router.get("/:id", getEmployeeById);
// <<<<<<< HEAD
// // >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8

// // export default router;
// import express from "express";
// =======
// // >>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0

// // export default router;


// import { Router } from "express";

// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
// import {
//   createEmployee,
// <<<<<<< HEAD
//   getMyProfile,
// =======
//   getEmployees,
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//   getEmployeeById,
//   getEmployeeTasks,
//   updateEmployee,
//   deleteEmployee,
//   uploadProfilePhoto,
//   bulkDeleteEmployees,
//   getEmployeeStats,
//   getEmployeeStatsDetailed,
//   importEmployees,
//   getEmployeeHistory,
// } from "../controllers/employeeController.js";
// import { protect } from "../middleware/authMiddleware.js";

// import { imageUpload } from "../config/multer.js";
// import { protect } from "../middleware/authMiddleware.js";

// <<<<<<< HEAD
// // 🚨 විශේෂ සටහන: dynamic routes (/:id) වලට කලින් ස්ථාවර routes (/me) අනිවාර්යයෙන්ම දැමිය යුතුය.
// router.get("/me", protect, getMyProfile);

// router.get("/", getEmployees);
// router.post("/", createEmployee);

// router.get("/:id/tasks", getEmployeeTasks);
// router.get("/:id", getEmployeeById);

// =======
// const router = Router();

// // Protect all employee routes
// router.use(protect);

// // Static routes must come before /:id
// router.get("/stats", getEmployeeStats);
// router.get("/stats/detailed", getEmployeeStatsDetailed);
// router.post("/import", importEmployees);
// router.delete("/bulk", bulkDeleteEmployees);

// // CRUD routes
// router.post("/", createEmployee);
// router.get("/", getEmployees);

// // Single employee routes
// router.get("/:id/tasks", getEmployeeTasks);
// router.get("/:id/history", getEmployeeHistory);
// router.post("/:id/photo", imageUpload.single("photo"), uploadProfilePhoto);
// router.get("/:id", getEmployeeById);
// router.put("/:id", updateEmployee);
// router.delete("/:id", deleteEmployee);

// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
// export default router;


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