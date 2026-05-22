import express from "express";
import {
  recordLogin,
  recordLogout,
  markInactive,
  getTodayAttendance,
  getInactiveEmployees,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/login", recordLogin);
router.post("/logout", recordLogout);
router.post("/mark-inactive", markInactive);
router.get("/today/:employeeId", getTodayAttendance);
router.get("/inactive-employees", getInactiveEmployees);

export default router;