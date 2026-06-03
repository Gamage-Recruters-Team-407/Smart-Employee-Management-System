import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles, managerRoles } from "../middleware/roleMiddleware.js";
import {
  addManagerFeedback,
  createPerformance,
  deletePerformance,
  getAllPerformanceRecords,
  getPerformanceAccessSummary,
  getPerformanceByEmployeeId,
  updatePerformance
} from "../controllers/performanceController.js";

const router = express.Router();

router.use(protect);

router.get("/", getAllPerformanceRecords);
router.get("/access/me", getPerformanceAccessSummary);
router.get("/:employeeId", getPerformanceByEmployeeId);

router.post("/", authorizeRoles(...managerRoles), createPerformance);
router.put("/:id", authorizeRoles(...managerRoles), updatePerformance);
router.put("/:id/feedback", authorizeRoles(...managerRoles), addManagerFeedback);
router.delete("/:id", authorizeRoles(...managerRoles), deletePerformance);

export default router;
