import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: true,
    },
    loginTime: Date,
    logoutTime: Date,
    checkInTime: String,  // format: HH:MM
    checkOutTime: String, // format: HH:MM
    status: {
      type: String,
      enum: ["Present", "Late", "Absent", "Half-Day", "Inactive"],
      default: "Present",
    },
    location: String,
    activityStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance logs for the same employee on the same date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);