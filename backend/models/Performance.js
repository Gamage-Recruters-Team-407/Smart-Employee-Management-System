import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
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