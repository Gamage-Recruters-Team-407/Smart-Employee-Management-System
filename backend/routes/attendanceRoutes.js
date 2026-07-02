import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as attendanceController from '../controllers/attendanceController.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ─── ALL ROUTES PROTECTED ──────────────────────────────────────────────────
router.use(protect);

// ─── Attendance Query Routes ──────────────────────────────────────────────────
router.get('/today', attendanceController.getTodayAttendance);
router.get('/my-history', attendanceController.getMyHistory);
router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.post('/mark', attendanceController.markAttendance);
router.get('/report/weekly/:employeeId', attendanceController.getWeeklyReport);

// ─── BREAK MANAGEMENT ROUTES ──────────────────────────────────────────────
router.post('/break/start', attendanceController.startBreak);
router.post('/break/end', attendanceController.endBreak);
router.get('/break/status', attendanceController.getBreakStatus);
router.get('/break/remaining', attendanceController.getBreakRemaining);
router.post('/update-status', attendanceController.updateStatus);

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────
router.get('/admin/summary', authorize('Admin', 'HR'), attendanceController.getAdminSummary);

export default router;