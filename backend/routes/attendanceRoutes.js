import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  markInactive,
  getTodayAttendance,
  getInactiveEmployees,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/mark-inactive", protect, markInactive);
router.get("/today/:employeeId",protect, getTodayAttendance);
router.get("/inactive-employees", protect, getInactiveEmployees);

export default router;
