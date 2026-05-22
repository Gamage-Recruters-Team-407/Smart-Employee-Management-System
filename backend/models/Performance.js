import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
<<<<<<< refs/remotes/origin/Fawdhan
      ref: "Employee",
    },
    attendanceScore: Number,
    taskCompletionRate: Number,
    qualityScore: Number,
    managerFeedback: String,
    overallScore: Number,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Performance", performanceSchema);
=======
      ref: "User",
      required: true,
    },
    attendancePercent: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    tasksAssigned: {
      type: Number,
      default: 0,
    },
    qualityScore: {
      // 0 - 100
      type: Number,
      default: 0,
    },
    managerFeedback: [
      {
        manager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        feedback: String,
        rating: Number,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    overallScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

performanceSchema.methods.calculateOverall = function () {
  const attendance = Number(this.attendancePercent) || 0;
  const taskRate = this.tasksAssigned > 0 ? (this.tasksCompleted / this.tasksAssigned) * 100 : 0;
  const quality = Number(this.qualityScore) || 0;
  const overall = (attendance + taskRate + quality) / 3;
  this.overallScore = Math.round(overall * 100) / 100; // two decimals
  return this.overallScore;
};

performanceSchema.pre("save", function () {
  this.calculateOverall();
});

export default mongoose.model("Performance", performanceSchema);
>>>>>>> local
