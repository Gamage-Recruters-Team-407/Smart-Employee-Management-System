import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Employee is required"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      // Format: "YYYY-MM" e.g. "2025-01"
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    allowances: {
      type: Number,
      default: 0,
      min: [0, "Allowances cannot be negative"],
    },
    deductions: {
      type: Number,
      default: 0,
      min: [0, "Deductions cannot be negative"],
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, "Tax cannot be negative"],
    },
    loans: {
      type: Number,
      default: 0,
      min: [0, "Loan deductions cannot be negative"],
    },
    netSalary: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Pending", "Processed", "Paid"],
      default: "Processed",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate netSalary before saving
payrollSchema.pre("save", function (next) {
  this.netSalary =
    (this.basicSalary + this.allowances) -
    (this.deductions + this.tax + this.loans);
  // Ensure net salary doesn't go negative
  if (this.netSalary < 0) this.netSalary = 0;
  next();
});

// Ensure one payroll record per employee per month
payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
