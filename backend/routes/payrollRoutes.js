import express from "express";
import {
  getPayrolls,
  createPayroll,
  generatePayroll,
  updatePayroll,
  deletePayroll,
  getPayslip,
} from "../controllers/payrollController.js";

const router = express.Router();

router.route("/").get(getPayrolls).post(createPayroll);
router.route("/generate").post(generatePayroll);
router.route("/:id").put(updatePayroll).delete(deletePayroll);
router.route("/:id/payslip").get(getPayslip);

export default router;
