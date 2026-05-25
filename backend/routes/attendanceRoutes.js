import express from "express";
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
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", recordLogin);
router.post("/logout", recordLogout);
router.post("/mark-inactive", markInactive);
router.get("/today/:employeeId", getTodayAttendance);
router.get("/inactive-employees", getInactiveEmployees);

router.get("/", getAttendance);
router.get("/employee/:employeeId", getAttendanceByEmployeeId);
router.post("/", markAttendance);

router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);

export default router;
