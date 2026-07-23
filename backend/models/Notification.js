import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["attendance", "leave", "payroll", "task", "performance", "system"],
      required: [true, "Notification type is required"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

// Automatically emit real-time updates whenever a notification changes
import { notifyUserBadges } from "../services/websocketService.js";

notificationSchema.post("save", function (doc) {
  if (doc?.userId) notifyUserBadges(doc.userId);
});

notificationSchema.post("findOneAndDelete", function (doc) {
  if (doc?.userId) notifyUserBadges(doc.userId);
});

export default mongoose.model("Notification", notificationSchema);
