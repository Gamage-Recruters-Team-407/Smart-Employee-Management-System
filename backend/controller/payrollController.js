import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";

// ─── Tax calculation helper ───────────────────────────────────────────────────
// Progressive tax brackets (annual). Salary is monthly, so we annualize first.
const calculateTax = (basicSalary, allowances) => {
  const annualIncome = (basicSalary + allowances) * 12;
  let annualTax = 0;

  if (annualIncome <= 300000) {
    annualTax = 0;
  } else if (annualIncome <= 600000) {
    annualTax = (annualIncome - 300000) * 0.05;
  } else if (annualIncome <= 900000) {
    annualTax = 15000 + (annualIncome - 600000) * 0.1;
  } else if (annualIncome <= 1200000) {
    annualTax = 45000 + (annualIncome - 900000) * 0.15;
  } else if (annualIncome <= 1500000) {
    annualTax = 90000 + (annualIncome - 1200000) * 0.2;
  } else {
    annualTax = 150000 + (annualIncome - 1500000) * 0.3;
  }

  return Math.round((annualTax / 12) * 100) / 100;
};

// ─── GET /api/payroll ─────────────────────────────────────────────────────────
export const getAllPayrolls = async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) filter.month = req.query.month;

    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        filter.employee = employee._id;
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    } else {
      if (req.query.employeeId) filter.employee = req.query.employeeId;
    }

    const payrolls = await Payroll.find(filter)
      .populate("employee", "firstName lastName employeeId department designation salary")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: payrolls.length, data: payrolls });
  } catch (err) {
    console.error("getAllPayrolls error:", err);
    res.status(500).json({ success: false, message: "Server error fetching payroll records." });
  }
};



// ─── GET /api/payroll/:id ─────────────────────────────────────────────────────
export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "firstName lastName employeeId department designation salary email phone"
    );

    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found." });
    }

    res.status(200).json({ success: true, data: payroll });
  } catch (err) {
    console.error("getPayrollById error:", err);
    res.status(500).json({ success: false, message: "Server error fetching payroll record." });
  }
};

// ─── POST /api/payroll ────────────────────────────────────────────────────────
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, allowances = 0, deductions = 0, loans = 0, notes = "" } = req.body;

    if (!employeeId || !month) {
      return res.status(400).json({ success: false, message: "Employee and month are required." });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "Month must be in YYYY-MM format." });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const existing = await Payroll.findOne({ employee: employeeId, month });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Payroll for ${employee.firstName} ${employee.lastName} in ${month} already exists.`,
      });
    }

    const basicSalary = employee.salary || 0;
    const tax = calculateTax(basicSalary, Number(allowances));

    const payroll = await Payroll.create({
      employee: employeeId,
      month,
      basicSalary,
      allowances: Number(allowances),
      deductions: Number(deductions),
      tax,
      loans: Number(loans),
      notes,
    });

    const populated = await payroll.populate(
      "employee",
      "firstName lastName employeeId department designation salary"
    );

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error("createPayroll error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Payroll record already exists for this employee and month." });
    }
    res.status(500).json({ success: false, message: "Server error creating payroll record." });
  }
};

// ─── POST /api/payroll/bulk ───────────────────────────────────────────────────
export const generateBulkPayroll = async (req, res) => {
  try {
    const { month, allowanceRate = 0.1, deductionRate = 0 } = req.body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "Valid month (YYYY-MM) is required." });
    }

    const employees = await Employee.find({ status: "Active" });
    if (!employees.length) {
      return res.status(404).json({ success: false, message: "No active employees found." });
    }

    const results = { created: [], skipped: [], errors: [] };

    for (const employee of employees) {
      try {
        const existing = await Payroll.findOne({ employee: employee._id, month });
        if (existing) {
          results.skipped.push(`${employee.firstName} ${employee.lastName}`);
          continue;
        }

        const basicSalary = employee.salary || 0;
        const allowances = Math.round(basicSalary * Number(allowanceRate) * 100) / 100;
        const deductions = Math.round(basicSalary * Number(deductionRate) * 100) / 100;
        const tax = calculateTax(basicSalary, allowances);

        await Payroll.create({ employee: employee._id, month, basicSalary, allowances, deductions, tax, loans: 0 });
        results.created.push(`${employee.firstName} ${employee.lastName}`);
      } catch (empErr) {
        results.errors.push(`${employee.firstName} ${employee.lastName}: ${empErr.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk payroll generated. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
      results,
    });
  } catch (err) {
    console.error("generateBulkPayroll error:", err);
    res.status(500).json({ success: false, message: "Server error generating bulk payroll." });
  }
};

// ─── PUT /api/payroll/:id ─────────────────────────────────────────────────────
export const updatePayroll = async (req, res) => {
  try {
    const { allowances, deductions, loans, status, notes } = req.body;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found." });
    }

    if (allowances !== undefined) payroll.allowances = Number(allowances);
    if (deductions !== undefined) payroll.deductions = Number(deductions);
    if (loans !== undefined) payroll.loans = Number(loans);
    if (status !== undefined) payroll.status = status;
    if (notes !== undefined) payroll.notes = notes;

    payroll.tax = calculateTax(payroll.basicSalary, payroll.allowances);

    await payroll.save();

    const populated = await payroll.populate(
      "employee",
      "firstName lastName employeeId department designation salary"
    );

    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("updatePayroll error:", err);
    res.status(500).json({ success: false, message: "Server error updating payroll record." });
  }
};

// ─── DELETE /api/payroll/:id ──────────────────────────────────────────────────
export const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      return res.status(404).json({ success: false, message: "Payroll record not found." });
    }

    res.status(200).json({ success: true, message: "Payroll record deleted successfully." });
  } catch (err) {
    console.error("deletePayroll error:", err);
    res.status(500).json({ success: false, message: "Server error deleting payroll record." });
  }
};

// ─── GET /api/payroll/summary/:month ─────────────────────────────────────────
export const getPayrollSummary = async (req, res) => {
  try {
    const { month } = req.params;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, message: "Invalid month format. Use YYYY-MM." });
    }

    const summaryFilter = { month };
    if (req.user.role !== "Admin" && req.user.role !== "HR") {
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) summaryFilter.employee = employee._id;
    }

    const payrolls = await Payroll.find(summaryFilter);

    const summary = {
      month,
      totalEmployees: payrolls.length,
      totalBasicSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalTax: 0,
      totalLoans: 0,
      totalNetSalary: 0,
    };

    payrolls.forEach((p) => {
      summary.totalBasicSalary += p.basicSalary;
      summary.totalAllowances += p.allowances;
      summary.totalDeductions += p.deductions;
      summary.totalTax += p.tax;
      summary.totalLoans += p.loans;
      summary.totalNetSalary += p.netSalary;
    });

    Object.keys(summary).forEach((k) => {
      if (typeof summary[k] === "number") {
        summary[k] = Math.round(summary[k] * 100) / 100;
      }
    });

    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    console.error("getPayrollSummary error:", err);
    res.status(500).json({ success: false, message: "Server error fetching payroll summary." });
  }
};

// ─── GET /api/payroll/employees ──────────────────────────────────────────────
export const getEmployeesForPayroll = async (req, res) => {
  try {
    const employees = await Employee.find({ status: "Active" }).select(
      "firstName lastName employeeId department designation salary"
    );
    res.status(200).json({ success: true, data: employees });
  } catch (err) {
    console.error("getEmployeesForPayroll error:", err);
    res.status(500).json({ success: false, message: "Server error fetching employees." });
  }
};
