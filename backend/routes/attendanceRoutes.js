import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  recordLogin,
  recordLogout,
  markInactive,
  getTodayAttendance,
  getInactiveEmployees,
  getAttendance,
  getAttendanceByEmployeeId,
  markAttendance,
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getWeeklyReport
} from "../controllers/attendanceController.js";

const router = express.Router();

// ─── Authentication & Session Routes ─────────────────────────────────────────
router.post("/login", recordLogin);
router.post("/logout", recordLogout);
router.post("/mark-inactive", protect, markInactive);

// ─── Attendance Query Routes ──────────────────────────────────────────────────
router.get("/today/:employeeId", protect, getTodayAttendance);
router.get("/inactive-employees", protect, getInactiveEmployees);
router.get("/my-history", protect, getMyAttendanceHistory);
router.get("/employee/:employeeId", protect, getAttendanceByEmployeeId);
router.get("/report/weekly/:employeeId", protect, getWeeklyReport);
router.get("/", protect, getAttendance); // සාමාන්‍යයෙන් මුළු attendance list එකම ගන්න එකත් protect කරන එක හොඳයි

// ─── Check-In / Check-Out & Manual Marking ────────────────────────────────────
router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);
router.post("/", protect, markAttendance); // Admin manual marking route

export default router;