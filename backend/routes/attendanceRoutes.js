import express from "express";
import {
  recordLogin,
  recordLogout,
  getTodayAttendance,
  getInactiveEmployees,
  getAttendance,
  getAttendanceByEmployeeId,
  markAttendance,
  checkIn,
  checkOut,
  getMyAttendanceHistory,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", recordLogin);
router.post("/logout", recordLogout);
router.get("/today/:employeeId", getTodayAttendance);
router.get("/inactive-employees", getInactiveEmployees);

router.get("/my-history", protect, getMyAttendanceHistory);
router.get("/", getAttendance);
router.get("/employee/:employeeId", getAttendanceByEmployeeId);
router.post("/", markAttendance);

router.post("/check-in", protect, checkIn);
router.post("/check-out", protect, checkOut);

export default router;
