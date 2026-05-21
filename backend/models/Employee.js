import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: String,
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
    },
    phone: String,
    department: String,
    designation: String,
    salary: Number,
    joiningDate: Date,
    address: String,
    documents: [String],
    status: {
      type: String,
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Employee", employeeSchema);