import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
} from "../controllers/employeeController.js";
import mockAuth from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply mock auth middleware to all employee routes
router.use(mockAuth);

// POST   /api/employees       → Create a new employee
router.post("/", createEmployee);

// GET    /api/employees       → List all employees (newest first)
router.get("/", getEmployees);

// GET    /api/employees/:id   → Get a single employee by MongoDB _id
router.get("/:id", getEmployeeById);

export default router;
