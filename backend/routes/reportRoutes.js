import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  downloadPayslipPdf,
  downloadDemoPayslipPdf,
  downloadAttendancePdf,
  downloadLeavePdf,
  downloadPerformancePdf,
  listPayrollsForPdf,
} from "../controllers/reportController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/payrolls",
  authorize("Admin", "HR", "Manager", "Employee"),
  listPayrollsForPdf
);

router.get(
  "/payslip/demo",
  authorize("Admin", "HR", "Manager", "Employee"),
  downloadDemoPayslipPdf
);

router.get(
  "/payslip/:payrollId",
  authorize("Admin", "HR", "Manager", "Employee"),
  downloadPayslipPdf
);

router.get(
  "/attendance",
  authorize("Admin", "HR", "Manager"),
  downloadAttendancePdf
);

router.get(
  "/leave",
  authorize("Admin", "HR", "Manager"),
  downloadLeavePdf
);

router.get(
  "/performance",
  authorize("Admin", "HR", "Manager"),
  downloadPerformancePdf
);

export default router;
