import Payroll from "../models/Payroll.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Performance from "../models/Performance.js";
import { createNotificationForUser } from "./notificationController.js";
import {
  generatePayslipPDF,
  generateAttendancePDF,
  generateLeavePDF,
  generatePerformancePDF,
} from "../services/pdfService.js";

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

    const pdfBuffer = await generatePerformancePDF({
      subtitle: "All performance records",
      records,
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
