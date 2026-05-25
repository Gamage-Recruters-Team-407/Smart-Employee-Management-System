import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  uploadProfilePhoto,
  bulkDeleteEmployees,
} from "../controllers/employeeController.js";
import mockAuth from "../middleware/authMiddleware.js";
import upload, { imageUpload } from "../config/multer.js";

const router = express.Router();

// Apply mock auth middleware to all employee routes
router.use(mockAuth);

// POST   /api/employees        → Create a new employee
router.post("/", createEmployee);

// GET    /api/employees        → List all employees
//   Query params:
//     ?search=value       → case-insensitive search across firstName, lastName, email
//     ?department=value   → filter by exact department (case-insensitive)
//     ?designation=value  → filter by exact designation (case-insensitive)
//     ?status=value       → filter by status (Active, Inactive, On Leave, Terminated)
router.get("/", getEmployees);

// DELETE /api/employees/bulk  → Permanently delete multiple employees
// NOTE: Must be declared BEFORE /:id so Express does not treat "bulk" as an ID param
router.delete("/bulk", bulkDeleteEmployees);

// GET    /api/employees/:id    → Get a single employee by MongoDB _id
router.get("/:id", getEmployeeById);

// PUT    /api/employees/:id    → Update an employee (employeeId field is immutable)
router.put("/:id", updateEmployee);

// DELETE /api/employees/:id   → Permanently delete an employee
router.delete("/:id", deleteEmployee);

// POST   /api/employees/:id/photo → Upload / replace profile photo
router.post("/:id/photo", imageUpload.single("photo"), uploadProfilePhoto);

export default router;
