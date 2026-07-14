import Payroll from "../models/Payroll.js";
import Attendance from '../models/Attendance.js';
import Leave from "../models/Leave.js";
import Performance from "../models/Performance.js";
import { createNotificationForUser } from "./notificationController.js";
import Employee from "../models/Employee.js";
import {
  generatePayslipPDF,
  generateAttendancePDF,
  generateLeavePDF,
  generatePerformancePDF,
} from "../services/pdfService.js";
import { sendPayslipAvailableEmail } from "../services/emailService.js";

const getEmployeeDisplayName = (employee) => {
  if (!employee) return "Employee";
  return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee";
};

const parseMonthYear = (month) => {
  if (!month) return { month: "", year: "" };
  if (/^\d{4}-\d{2}$/.test(month)) {
    const [year] = month.split("-");
    const monthLabel = new Date(`${month}-01`).toLocaleString("en-US", {
      month: "long",
    });
    return { month: monthLabel, year };
  }
  const parts = String(month).split(" ");
  return { month: parts[0] || month, year: parts[1] || "" };
};

const sendPdfResponse = (res, buffer, filename) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(buffer);
};

const notifyPdfGenerated = async (userId, { title, message, type }) => {
  try {
    await createNotificationForUser({
      userId,
      title,
      message,
      type,
    });
  } catch (error) {
    console.error("Failed to create PDF notification:", error.message);
  }
};

// @desc    Download payslip PDF and notify user
// @route   GET /api/notifications/reports/payslip/:payrollId
export const downloadPayslipPdf = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.payrollId).populate(
      "employee"
    );

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll record not found",
      });
    }

    const pdfBuffer = await generatePayslipPDF({
      employee: payroll.employee || {},
      payroll: {
        month: payroll.month,
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        deductions: payroll.deductions,
        tax: payroll.tax,
        loans: payroll.loans,
        netSalary: payroll.netSalary,
      },
    });

    const filename = `payslip-${payroll.month || "report"}-${payroll._id}.pdf`;

    try {
      const employee = payroll.employee;
      if (employee?.email) {
        const { month, year } = parseMonthYear(payroll.month);
        const baseUrl =
          process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
        const downloadLink = `${baseUrl}/api/notifications/reports/payslip/${payroll._id}`;

        await sendPayslipAvailableEmail({
          to: employee.email,
          employeeName: getEmployeeDisplayName(employee),
          month,
          year,
          downloadLink,
        });
      }
    } catch (emailError) {
      console.error(
        "[email] Payslip available email failed:",
        emailError.message
      );
    }

    await notifyPdfGenerated(req.user._id, {
      title: "Payslip PDF Generated",
      message: `Your payslip for ${payroll.month || "the selected period"} is ready for download.`,
      type: "payroll",
    });

    return sendPdfResponse(res, pdfBuffer, filename);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate payslip PDF",
      error: error.message,
    });
  }
};

// @desc    Download attendance report PDF and notify user
// @route   GET /api/notifications/reports/attendance
export const downloadAttendancePdf = async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("employee")
      .sort({ createdAt: -1 })
      .lean();

    const pdfBuffer = await generateAttendancePDF({
      subtitle: req.query.month
        ? `Filter: ${req.query.month}`
        : "All attendance records",
      records,
    });

    await notifyPdfGenerated(req.user._id, {
      title: "Attendance Report Ready",
      message: `Attendance PDF report generated with ${records.length} record(s).`,
      type: "attendance",
    });

    return sendPdfResponse(res, pdfBuffer, "attendance-report.pdf");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate attendance PDF",
      error: error.message,
    });
  }
};

// @desc    Download leave report PDF and notify user
// @route   GET /api/notifications/reports/leave
export const downloadLeavePdf = async (req, res) => {
  try {
    const records = await Leave.find()
      .populate("employee")
      .sort({ createdAt: -1 })
      .lean();

    const pdfBuffer = await generateLeavePDF({
      subtitle: req.query.status
        ? `Status: ${req.query.status}`
        : "All leave records",
      records,
    });

    await notifyPdfGenerated(req.user._id, {
      title: "Leave Report Ready",
      message: `Leave PDF report generated with ${records.length} record(s).`,
      type: "leave",
    });

    return sendPdfResponse(res, pdfBuffer, "leave-report.pdf");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate leave PDF",
      error: error.message,
    });
  }
};

// @desc    Download performance report PDF and notify user
// @route   GET /api/notifications/reports/performance
export const downloadPerformancePdf = async (req, res) => {
  try {
    const records = await Performance.find()
      .populate("employee")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch employee profiles matching the user ids in the records
    const userIds = records.map((r) => r.employee?._id).filter(Boolean);
    const employees = await Employee.find({ userId: { $in: userIds } }).lean();

    // Map by userId for quick access
    const employeeMap = {};
    employees.forEach((emp) => {
      if (emp.userId) {
        employeeMap[emp.userId.toString()] = emp;
      }
    });

    // Substitute the employee object with the Employee profile if found
    const recordsWithEmployees = records.map((record) => {
      if (record.employee && record.employee._id) {
        const empProfile = employeeMap[record.employee._id.toString()];
        if (empProfile) {
          return {
            ...record,
            employee: empProfile,
          };
        }
      }
      return record;
    });


    const pdfBuffer = await generatePerformancePDF({
      subtitle: "All performance records",
      records: recordsWithEmployees,
    });

    await notifyPdfGenerated(req.user._id, {
      title: "Performance Report Ready",
      message: `Performance PDF report generated with ${records.length} record(s).`,
      type: "performance",
    });

    return sendPdfResponse(res, pdfBuffer, "performance-report.pdf");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate performance PDF",
      error: error.message,
    });
  }
};

// @desc    Download demo payslip when no payroll exists in DB
// @route   GET /api/notifications/reports/payslip/demo
export const downloadDemoPayslipPdf = async (req, res) => {
  try {
    const pdfBuffer = await generatePayslipPDF({
      employee: {
        employeeId: "EMP001",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@sems.com",
        department: "Engineering",
        designation: "Software Developer",
      },
      payroll: {
        month: "May 2026",
        basicSalary: 5000,
        allowances: 800,
        deductions: 200,
        tax: 450,
        loans: 100,
        netSalary: 5050,
      },
    });

    await notifyPdfGenerated(req.user._id, {
      title: "Sample Payslip PDF Generated",
      message: "Your sample payslip for May 2026 is ready for download.",
      type: "payroll",
    });

    return sendPdfResponse(res, pdfBuffer, "payslip-demo-may-2026.pdf");
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate demo payslip PDF",
      error: error.message,
    });
  }
};

// @desc    List payroll records for payslip PDF selection
// @route   GET /api/notifications/reports/payrolls
export const listPayrollsForPdf = async (req, res) => {
  try {
    const payrolls = await Payroll.find()
      .populate("employee", "employeeId firstName lastName")
      .sort({ createdAt: -1 })
      .select("month netSalary employee createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      count: payrolls.length,
      data: payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payroll list for PDF",
      error: error.message,
    });
  }
};
