import express from "express";
import { getDashboardStats, getRecentActivity } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/activity", protect, getRecentActivity);

export default router;