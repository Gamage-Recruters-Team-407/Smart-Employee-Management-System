import express from "express";

import {
  getAllPayrolls,
  getPayrollById,
  generateBulkPayroll,
  updatePayroll,
  deletePayroll,
  getPayrollSummary,
  getEmployeesForPayroll,
} from "../controller/payrollController.js";

import{getPayslipPDF,getRoleByUserId,createPayroll } from "../controllers/payrollController.js";


import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

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
  authorizeRoles("Admin", "HR"),
  generateBulkPayroll
);

// CRUD routes
router.get(
  "/",
  getAllPayrolls
);

router.post(
  "/",
  authorizeRoles("Admin", "HR"),
  createPayroll
);

router.get(
  "/role/user/:userId",
  getRoleByUserId
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

router.get(
  "/role/user/:userId",
  authorizeRoles("Admin", "HR", "Manager"),
  getRoleByUserId
);

export default router;