import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { generatePayslipPDF } from "../services/pdfService.js";
import {
  sendPayrollGeneratedEmail,
  sendPayslipAvailableEmail,
} from "../services/emailService.js";

const getEmployeeDisplayName = (employee) => {
  if (!employee) return "Employee";
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee";
};

const parseMonthYear = (month) => {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNum] = month.split("-");
    const monthLabel = new Date(`${month}-01`).toLocaleString("en-US", {
      month: "long",
    });
    return { month: monthLabel, year };
  }
  return { month: month || "", year: "" };
};

const sendPayrollGeneratedEmailSafe = async (payroll, employee) => {
  if (!employee?.email) return;

  try {
    const { month, year } = parseMonthYear(payroll.month);
    await sendPayrollGeneratedEmail({
      to: employee.email,
      employeeName: getEmployeeDisplayName(employee),
      month,
      year,
      netSalary: payroll.netSalary,
    });
  } catch (error) {
    console.error("[email] Payroll generated email failed:", error.message);
  }
};

const sendPayslipAvailableEmailSafe = async (payroll, employee, req) => {
  if (!employee?.email) return;

  try {
    const { month, year } = parseMonthYear(payroll.month);
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const downloadLink = `${baseUrl}/api/payroll/${payroll._id}/payslip`;

    await sendPayslipAvailableEmail({
      to: employee.email,
      employeeName: getEmployeeDisplayName(employee),
      month,
      year,
      downloadLink,
    });
  } catch (error) {
    console.error("[email] Payslip available email failed:", error.message);
  }
};

// Helper for automated payroll calculations
const calculatePayrollComponents = (basicSalary, loans = 0, customAllowances = null, customDeductions = null) => {
  const allowances = customAllowances !== null ? Number(customAllowances) : Math.round(basicSalary * 0.20);
  
  // PF = 12% of basic
  const pf = Math.round(basicSalary * 0.12);
  const pt = 200; // Professional Tax
  const defaultDeductions = pf + pt;
  const deductions = customDeductions !== null ? Number(customDeductions) : defaultDeductions;
  
  // Calculate Monthly Tax (TDS) based on basic + allowances
  const monthlyGross = basicSalary + allowances;
  const annualGross = monthlyGross * 12;
  
  let annualTax = 0;
  if (annualGross <= 300000) {
    annualTax = 0;
  } else if (annualGross <= 600000) {
    annualTax = (annualGross - 300000) * 0.05;
  } else if (annualGross <= 900000) {
    annualTax = 15000 + (annualGross - 600000) * 0.10;
  } else if (annualGross <= 1200000) {
    annualTax = 45000 + (annualGross - 900000) * 0.15;
  } else if (annualGross <= 1500000) {
    annualTax = 90000 + (annualGross - 1200000) * 0.20;
  } else {
    annualTax = 150000 + (annualGross - 1500000) * 0.30;
  }
  
  const tax = Math.round(annualTax / 12);
  const loanDeduction = Number(loans) || 0;
  
  const netSalary = Math.max(0, basicSalary + allowances - deductions - tax - loanDeduction);
  
  return {
    basicSalary,
    allowances,
    deductions,
    tax,
    loans: loanDeduction,
    netSalary
  };
};

// @desc    Get payroll records
// @route   GET /api/payroll
// @access  Public
export const getPayrolls = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = {};
    if (month) {
      filter.month = month; // Format: YYYY-MM
    }

  // Only Admin and HR can see all records, everyone else sees only their own
  if (req.user.role !== "Admin" && req.user.role !== "HR") {
    const emp = await Employee.findOne({ email: req.user.email });
    if (emp) {
      filter.employee = emp._id;
    }
  }

    const payrolls = await Payroll.find(filter)
      .populate("employee")
      .sort({ createdAt: -1 });

    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auto-generate payroll records for a specific month
// @route   POST /api/payroll/generate
// @access  Public
export const generatePayroll = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ message: "Month (YYYY-MM) is required." });
    }

    // Get all active employees
    const employees = await Employee.find({ status: "Active" });
    if (employees.length === 0) {
      return res.status(400).json({ message: "No active employees found to generate payroll." });
    }

    let createdCount = 0;
    let skippedCount = 0;
    const generatedPayrolls = [];

    for (const emp of employees) {
      // Check if payroll already exists for this employee for this month
      const existingPayroll = await Payroll.findOne({ employee: emp._id, month });
      
      if (existingPayroll) {
        skippedCount++;
        continue;
      }

      // Perform calculations
      const basicSalary = emp.salary || 0;
      const comps = calculatePayrollComponents(basicSalary, 0);

      const payroll = new Payroll({
        employee: emp._id,
        basicSalary: comps.basicSalary,
        allowances: comps.allowances,
        deductions: comps.deductions,
        tax: comps.tax,
        loans: comps.loans,
        netSalary: comps.netSalary,
        month,
        status: "Pending",
      });

      const savedPayroll = await payroll.save();
      createdCount++;
      generatedPayrolls.push(savedPayroll);

      await sendPayrollGeneratedEmailSafe(savedPayroll, emp);
    }

    res.status(201).json({
      message: `Payroll generation completed. Created: ${createdCount}, Skipped: ${skippedCount}`,
      createdCount,
      skippedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a single payroll record manually
// @route   POST /api/payroll
// @access  Public
export const createPayroll = async (req, res) => {
  try {
    const { employeeId, month, loans, allowances, deductions } = req.body;

    const emp = await Employee.findById(employeeId);
    if (!emp) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const existingPayroll = await Payroll.findOne({ employee: employeeId, month });
    if (existingPayroll) {
      return res.status(400).json({ message: "Payroll already exists for this employee in the specified month." });
    }

    const basicSalary = emp.salary || 0;
    const comps = calculatePayrollComponents(basicSalary, loans || 0, allowances || null, deductions || null);

    const payroll = new Payroll({
      employee: employeeId,
      basicSalary: comps.basicSalary,
      allowances: comps.allowances,
      deductions: comps.deductions,
      tax: comps.tax,
      loans: comps.loans,
      netSalary: comps.netSalary,
      month,
      status: "Pending",
    });

    const savedPayroll = await payroll.save();
    await sendPayrollGeneratedEmailSafe(savedPayroll, emp);
    res.status(201).json(savedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a payroll record
// @route   PUT /api/payroll/:id
// @access  Public
export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { basicSalary, allowances, deductions, tax, loans, status, paymentDate } = req.body;

    const payroll = await Payroll.findById(id);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    // Update fields if provided, otherwise keep existing
    if (basicSalary !== undefined) payroll.basicSalary = Number(basicSalary);
    if (allowances !== undefined) payroll.allowances = Number(allowances);
    if (deductions !== undefined) payroll.deductions = Number(deductions);
    if (tax !== undefined) payroll.tax = Number(tax);
    if (loans !== undefined) payroll.loans = Number(loans);
    if (status !== undefined) payroll.status = status;
    if (paymentDate !== undefined) payroll.paymentDate = paymentDate;

    if (status === "Paid" && !payroll.paymentDate) {
      payroll.paymentDate = new Date();
    }

    // Recalculate net salary based on updated components
    payroll.netSalary = Math.max(
      0,
      payroll.basicSalary + payroll.allowances - payroll.deductions - payroll.tax - payroll.loans
    );

    const updatedPayroll = await payroll.save();
    res.status(200).json(updatedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a payroll record
// @route   DELETE /api/payroll/:id
// @access  Public
export const deletePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findByIdAndDelete(id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    res.status(200).json({ message: "Payroll record deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Generate and stream PDF payslip for a payroll ID
// @route   GET /api/payroll/:id/payslip
// @access  Public
export const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id).populate("employee");
    
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found." });
    }

    await sendPayslipAvailableEmailSafe(payroll, payroll.employee, req);

    const monthName = new Date(payroll.month + "-02")
      .toLocaleString("default", { month: "short", year: "numeric" })
      .replace(" ", "_");

    const empName = payroll.employee
      ? `${payroll.employee.firstName}_${payroll.employee.lastName}`
      : "Employee";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip_${empName}_${monthName}.pdf`
    );

    generatePayslipPDF(payroll, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Generate and stream PDF payslip using employeeId, month and year
// @route   GET /api/payroll/payslip
// @access  Public
export const getPayslipPDF = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month) {
      return res.status(400).json({ message: "employeeId and month are required." });
    }

    const monthStr = year ? `${month} ${year}` : month;
    const payroll = await Payroll.findOne({ employee: employeeId, month: monthStr }).populate("employee");

    if (!payroll) {
      return res.status(404).json({ message: "Payroll data not found for the selected month." });
    }

    const pdfBuffer = await generatePayslipPDF({
      employee: payroll.employee,
      payroll: payroll,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${monthStr.replace(" ", "-")}-${employeeId}.pdf`
    );

    // Trigger Notification for admin
    const adminUser = await User.findOne({ role: "Admin" });
    if (adminUser) {
      await Notification.create({
        userId: adminUser._id,
        title: "Payslip Generated",
        message: `Payslip for ${monthStr} is ready for download`,
        type: "payroll",
      });
    }

    // Optional email
    if (typeof sendPayslipAvailableEmailSafe === "function") {
      await sendPayslipAvailableEmailSafe(payroll, payroll.employee, req);
    }

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating payslip PDF:", error);
    return res.status(500).json({ message: "Failed to generate PDF." });
  }
};
