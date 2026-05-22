import Notification from "../models/Notification.js";
import User from "../models/User.js";

const NOTIFICATION_TYPES = [
  "attendance",
  "leave",
  "payroll",
  "task",
  "performance",
  "system",
];

const validateCreatePayload = (body) => {
  const errors = [];

  if (!body.title || !String(body.title).trim()) {
    errors.push("title is required");
  }
  if (!body.message || !String(body.message).trim()) {
    errors.push("message is required");
  }
  if (!body.type || !NOTIFICATION_TYPES.includes(body.type)) {
    errors.push(
      `type is required and must be one of: ${NOTIFICATION_TYPES.join(", ")}`
    );
  }
  if (!body.userId) {
    errors.push("userId is required");
  }

  return errors;
};

// Reusable by other modules (leave, payroll, etc.)
export const createNotificationForUser = async ({
  userId,
  title,
  message,
  type,
}) => {
  return Notification.create({
    userId,
    title,
    message,
    type,
  });
};

// @desc    Get logged-in user's notifications (newest first)
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// @desc    Get unread notification count for logged-in user
// @route   GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};

// @desc    Mark one notification as read
// @route   PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this notification",
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

// @desc    Mark all logged-in user's notifications as read
// @route   PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

// @desc    Delete one notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this notification",
      });
    }

    await notification.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

// @desc    Create notification (Admin/HR/Manager)
// @route   POST /api/notifications
export const createNotification = async (req, res) => {
  try {
    const errors = validateCreatePayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const targetUser = await User.findById(req.body.userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    const notification = await createNotificationForUser({
      userId: req.body.userId,
      title: String(req.body.title).trim(),
      message: String(req.body.message).trim(),
      type: req.body.type,
    });

    return res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};
