import express from "express";
import { getPayslipPDF } from "../controllers/payrollController.js";

const router = express.Router();

router.get("/payslip", getPayslipPDF);

export default router;
