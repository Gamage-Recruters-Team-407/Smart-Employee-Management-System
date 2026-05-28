import mongoose from "mongoose";

<<<<<<< HEAD
const taskSchema = new mongoose.Schema(
  {
    title: String,
=======
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
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
    description: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
<<<<<<< HEAD
=======
      required: true,
    },
    /** Denormalized for filtering; set from Employee.email on assign */
    assignedToEmail: {
      type: String,
      lowercase: true,
      trim: true,
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Review", "Completed"],
      default: "To Do",
    },
<<<<<<< HEAD
    dueDate: Date,
    comments: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);
=======
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
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
