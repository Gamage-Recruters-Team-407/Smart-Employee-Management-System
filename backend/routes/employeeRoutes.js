import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  uploadProfilePhoto,
} from "../controllers/employeeController.js";
import mockAuth from "../middleware/authMiddleware.js";
import upload, { imageUpload } from "../config/multer.js";

const router = express.Router();

// Apply mock auth middleware to all employee routes
router.use(mockAuth);

// POST   /api/employees        → Create a new employee
router.post("/", createEmployee);

// GET    /api/employees        → List all employees (with optional search & filters)
//   Query params:
//     ?search=value            → case-insensitive search across firstName, lastName, email
//     ?department=value        → filter by exact department (case-insensitive)
//     ?designation=value       → filter by exact designation (case-insensitive)
//   Params can be combined, e.g. ?search=john&department=IT
router.get("/", getEmployees);

// GET    /api/employees/:id    → Get a single employee by MongoDB _id
router.get("/:id", getEmployeeById);

// PUT    /api/employees/:id    → Update an employee (employeeId field is immutable)
router.put("/:id", updateEmployee);

// DELETE /api/employees/:id   → Permanently delete an employee
router.delete("/:id", deleteEmployee);

// POST   /api/employees/:id/photo → Upload / replace profile photo
router.post("/:id/photo", imageUpload.single("photo"), uploadProfilePhoto);

export default router;
