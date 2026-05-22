import mongoose from "mongoose";

const clampScore = (value) => {
  const numeric = Number(value) || 0;
  return Math.max(0, Math.min(100, numeric));
};

const feedbackSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    feedback: {
      type: String,
      trim: true,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    attendanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      min: 0,
      default: 0
    },
    tasksAssigned: {
      type: Number,
      min: 0,
      default: 0
    },
    taskCompletionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    managerFeedback: {
      type: [feedbackSchema],
      default: []
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

performanceSchema.methods.calculateOverallScore = function () {
  const attendance = clampScore(this.attendanceScore);
  const taskRate = this.tasksAssigned > 0
    ? clampScore((this.tasksCompleted / this.tasksAssigned) * 100)
    : 0;
  const quality = clampScore(this.qualityScore);

  this.attendanceScore = attendance;
  this.taskCompletionRate = Math.round(taskRate * 100) / 100;
  this.overallScore = Math.round(((attendance + taskRate + quality) / 3) * 100) / 100;

  return this.overallScore;
};

performanceSchema.pre("save", function () {
  this.calculateOverallScore();
});

export default mongoose.model("Performance", performanceSchema);
