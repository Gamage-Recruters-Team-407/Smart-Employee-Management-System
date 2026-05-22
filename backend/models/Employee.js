import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },   // original file name
    path: { type: String, required: true },   // relative path: uploads/<filename>
    mimetype: { type: String },               // e.g. application/pdf
    size: { type: Number },                   // bytes
  },
  { _id: true, timestamps: true }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    salary: {
      type: Number,
      default: 0,
    },
    joiningDate: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave", "Terminated"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Employee", employeeSchema);