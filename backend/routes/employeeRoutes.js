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

export default router;
