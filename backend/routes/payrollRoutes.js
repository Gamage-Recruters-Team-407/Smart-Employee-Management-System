// backend/routes/payrollRoutes.js

import express from "express";
import {
  getPayrolls,
  getPayrollById,
  createPayroll,
  updatePayroll,
  deletePayroll,
  generateBulkPayroll,
  getPayrollSummary,
  getPayrollEmployees,
} from "../controllers/payrollController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All payroll routes protected
router.use(protect);

// Employee dropdown list
router.get(
  "/employees",
  getPayrollEmployees
);

// Payroll summary
router.get(
  "/summary/:month/:year",
  getPayrollSummary
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
  getPayrolls
);

router.post(
  "/",
  authorizeRoles("Admin", "HR"),
  createPayroll
);

router.get(
  "/:id",
  getPayrollById
);

router.put(
  "/:id",
  authorizeRoles("Admin", "HR"),
  updatePayroll
);

router.delete(
  "/:id",
  authorizeRoles("Admin", "HR"),
  deletePayroll
);

export default router;