import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getMyReport,
  getMyReportsHistory,
  upsertMyReport,
  getAllReports,
} from "../controllers/dailyReportController.js";

const router = express.Router();

// All routes require a valid JWT
router.use(protect);

// Employee: get own report for a date, get report history, submit/update own report
router.get("/my", getMyReport);
router.get("/my-history", getMyReportsHistory);
router.post("/", upsertMyReport);

// Admin / HR only: view all reports for a date
router.get("/all", authorizeRoles("Admin", "HR"), getAllReports);

export default router;