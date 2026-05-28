<<<<<<< HEAD
import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    leaveType: {
      type: String,
      enum: ["Annual", "Medical", "Casual"],
    },
    startDate: Date,
    endDate: Date,
    reason: String,
    medicalDocument: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Leave", leaveSchema);
=======
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["Annual", "Sick", "Casual", "Maternity", "Paternity", "Unpaid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
    medicalDocument: {
      type: String, // file path store කරනවා
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
