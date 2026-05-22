import express from "express";
import {
  getAttendance,
  markAttendance,
  checkIn,
  checkOut,
  getEmployeeAttendanceHistory,
  getDailyReport,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch daily records and mark manual attendance
router.get("/", getAttendance);
router.post("/", markAttendance);

// Self attendance (check-in / check-out) protected by auth middleware
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);

// Daily reporting/stats
router.get("/report/daily", getDailyReport);

// Individual employee attendance history protected by auth middleware
router.get("/employee/:employeeId", protect, getEmployeeAttendanceHistory);

export default router;
