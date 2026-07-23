import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getEmailStatus,
  sendTestEmail,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/unread-count", getUnreadCount);
router.get("/email-status", getEmailStatus);
router.post(
  "/test-email",
  authorize("Admin", "HR", "Manager"),
  sendTestEmail
);
router.patch("/read-all", markAllAsRead);

router.get("/", getNotifications);
router.post("/", authorize("Admin", "HR", "Manager"), createNotification);

router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
