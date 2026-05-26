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
      required: [true, "First name is required."],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required."],
      unique: true,
      lowercase: true,
      trim: true,
      // Fix #13: added format validator so runValidators: true on updates works
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address."],
    },
    phone: {
      type: String,
      trim: true,
      // Fix #14: cap phone length at 20 characters
      maxlength: [20, "Phone number must not exceed 20 characters."],
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
      // Fix #13: salary cannot be negative
      min: [0, "Salary cannot be negative."],
    },
    joiningDate: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      // Fix #14: enforce 200-char limit at DB level
      maxlength: [200, "Address must not exceed 200 characters."],
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    profilePhoto: {
      type: String,   // relative path: uploads/<filename>
      default: null,
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