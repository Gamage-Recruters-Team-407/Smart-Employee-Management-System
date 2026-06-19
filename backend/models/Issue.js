import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    // Who reported it
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterEmail: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },
    reporterRole: {
      type: String,
      enum: ["Admin", "HR", "Manager", "Employee"],
      required: true,
    },

    // Issue details
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // File attachment (single file for now - path or null)
    attachment: {
      type: String,
      default: null,
    },
    attachmentOriginalName: {
      type: String,
      default: null,
    },

    // Status workflow: Pending → In Review → Resolved → Closed
    status: {
      type: String,
      enum: ["Pending", "In Review", "Resolved", "Closed"],
      default: "Pending",
    },

    // HR/Admin review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },

    // Priority (optional, set by HR/Admin)
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    // Category (optional, for organization)
    category: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Issue", issueSchema);