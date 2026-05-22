import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    basicSalary: Number,
    allowances: Number,
    deductions: Number,
    tax: Number,
    loans: Number,
    netSalary: Number,
    month: String,
    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
    paymentDate: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payroll", payrollSchema);