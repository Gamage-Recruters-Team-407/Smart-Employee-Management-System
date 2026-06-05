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

import{getPayslipPDF} from "../controllers/payrollController.js";


import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All payroll routes protected
router.use(protect);

// Employee dropdown list
router.get(
  "/employees",
  getEmployeesForPayroll
);

// Payroll summary
router.get(
  "/summary/:month",
  getPayrollSummary
);

// Payslip PDF
router.get(
  "/payslip",
  getPayslipPDF
);

// Bulk payroll generation
router.post(
  "/bulk",
  generateBulkPayroll
);

// CRUD routes
router.get(
  "/",
  getAllPayrolls
);

router.post(
  "/",
  createPayroll
);

router.get(
  "/:id",
  getPayrollById
);

router.put(
  "/:id",
  updatePayroll
);

router.delete(
  "/:id",
  deletePayroll
);

export default router;