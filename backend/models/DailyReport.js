import mongoose from "mongoose";

const reportTaskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  { _id: true }
);

const dailyReportSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String, // stored as "YYYY-MM-DD" for easy unique indexing per day
      required: true,
    },
    startTime: {
      type: String, // "HH:MM" 24hr
      required: true,
    },
    endTime: {
      type: String, // "HH:MM" 24hr
      required: true,
    },
    totalHours: {
      type: String, // e.g. "7h 30m" — computed on frontend, stored for display
      default: "",
    },
    teamPosition: {
      type: String,
      enum: [
        "Frontend Developer",
        "Backend Developer",
        "Team Lead",
        "Assistant Team Lead",
        "BA",
        "Quality Assurance",
        "IT",
        "Fullstack",
        "PM",
      ],
      required: true,
    },
    workedOnTasks: {
      type: Boolean,
      default: true,
    },
    tasks: {
      type: [reportTaskSchema],
      default: [],
    },
    challengesIssues: {
      type: String,
      default: "",
      trim: true,
    },
    dependenciesAssistance: {
      type: String,
      default: "",
      trim: true,
    },
    plannedTasksTomorrow: {
      type: String,
      default: "",
      trim: true,
    },
    additionalNotes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One report per employee per day
dailyReportSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyReport", dailyReportSchema);