import express from "express";
import {
  getAttendance,
  markAttendance,
  checkIn,
  checkOut,
  getEmployeeAttendanceHistory,
  getDailyReport,
} from "../controllers/attendanceController.js";

const router = express.Router();

// Fetch daily records and mark manual attendance
router.get("/", getAttendance);
router.post("/", markAttendance);

// Self attendance (check-in / check-out)
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);

// Daily reporting/stats
router.get("/report/daily", getDailyReport);

// Individual employee attendance history
router.get("/employee/:employeeId", getEmployeeAttendanceHistory);

export default router;
