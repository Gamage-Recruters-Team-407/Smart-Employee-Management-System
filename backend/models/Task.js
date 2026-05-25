import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Review", "Completed"],
      default: "To Do",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dueDate: Date,
    comments: [commentSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
