import express from "express";
import {
  getAllPayrolls,
  getPayrollById,
  createPayroll,
  generateBulkPayroll,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
  getEmployeesForPayroll,
} from "../controller/payrollController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All payroll routes are protected
router.use(protect);

// Employee list for dropdown
router.get("/employees", getEmployeesForPayroll);

// Summary for a month
router.get("/summary/:month", getPayrollSummary);

// Bulk payroll generation
router.post("/bulk", generateBulkPayroll);

// CRUD
router.get("/", getAllPayrolls);
router.post("/", createPayroll);
router.get("/:id", getPayrollById);
router.put("/:id", updatePayroll);
router.delete("/:id", deletePayroll);

export default router;
