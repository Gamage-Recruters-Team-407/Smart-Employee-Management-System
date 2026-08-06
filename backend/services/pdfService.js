import PDFDocument from "pdfkit";

const DEFAULT_COMPANY_NAME = "Smart Employee Management System";
const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 495;

const buildPdfBuffer = (renderContent) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      renderContent(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEmployeeLabel = (employee) => {
  if (!employee) return "—";
  if (typeof employee === "string") return employee;

  const name = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || employee.name || "";

  const id = employee.employeeId ? ` (${employee.employeeId})` : "";
  return name ? `${name}${id}` : employee.employeeId || "—";
};

const ensureSpace = (doc, requiredHeight = 40) => {
  const bottomLimit = doc.page.height - PAGE_MARGIN;
  if (doc.y + requiredHeight > bottomLimit) {
    doc.addPage();
  }
};

const drawReportHeader = (doc, { title, companyName, subtitle }) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(companyName || DEFAULT_COMPANY_NAME, { align: "center" });

  doc.moveDown(0.4);
  doc.fontSize(14).text(title, { align: "center" });

  if (subtitle) {
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor("#444444").text(subtitle, {
      align: "center",
    });
    doc.fillColor("#000000");
  }

  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(9)
    .text(`Generated on: ${formatDateTime(new Date())}`, { align: "right" });

  doc.moveDown(0.8);
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y)
    .strokeColor("#cccccc")
    .stroke();
  doc.strokeColor("#000000");
  doc.moveDown(0.8);
};

const drawTable = (doc, columns, rows) => {
  const headerHeight = 22;
  const rowHeight = 20;
  const startX = PAGE_MARGIN;

  const drawHeader = () => {
    ensureSpace(doc, headerHeight + 10);
    let x = startX;
    const y = doc.y;

    doc.rect(startX, y, CONTENT_WIDTH, headerHeight).fill("#f0f0f0");
    doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9);

    columns.forEach((column) => {
      doc.text(column.label, x + 4, y + 6, {
        width: column.width - 8,
        align: column.align || "left",
        ellipsis: true,
      });
      x += column.width;
    });

    doc.y = y + headerHeight;
    doc.font("Helvetica").fontSize(8);
  };

  drawHeader();

  rows.forEach((row, index) => {
    // Calculate the dynamic height for this row based on the cell content
    let maxCellHeight = 0;
    columns.forEach((column) => {
      const rawValue = row[column.key];
      const value =
        rawValue === undefined || rawValue === null ? "—" : String(rawValue);

      const cellHeight = doc.heightOfString(value, {
        width: column.width - 8,
      });
      if (cellHeight > maxCellHeight) {
        maxCellHeight = cellHeight;
      }
    });

    // Add padding and enforce a minimum row height of 20
    const dynamicRowHeight = Math.max(rowHeight, Math.ceil(maxCellHeight) + 12);

    ensureSpace(doc, dynamicRowHeight + 8);
    let x = startX;
    const y = doc.y;

    if (index % 2 === 1) {
      doc.rect(startX, y, CONTENT_WIDTH, dynamicRowHeight).fill("#fafafa");
      doc.fillColor("#000000");
    }

    columns.forEach((column) => {
      const rawValue = row[column.key];
      const value =
        rawValue === undefined || rawValue === null ? "—" : String(rawValue);

      doc.text(value, x + 4, y + 6, {
        width: column.width - 8,
        align: column.align || "left",
        ellipsis: true,
      });
      x += column.width;
    });

    doc
      .moveTo(startX, y + dynamicRowHeight)
      .lineTo(startX + CONTENT_WIDTH, y + dynamicRowHeight)
      .strokeColor("#e6e6e6")
      .stroke();
    doc.strokeColor("#000000");
    doc.y = y + dynamicRowHeight;
  });
};

const drawKeyValueLine = (doc, label, value) => {
  const labelWidth = 140;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(label, PAGE_MARGIN, doc.y, { continued: true, width: labelWidth })
    .font("Helvetica")
    .text(` ${value ?? "—"}`);
};

const drawSalaryRow = (doc, label, amount, options = {}) => {
  const { bold = false } = options;
  const y = doc.y;

  doc
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(10)
    .text(label, PAGE_MARGIN, y, { width: 300 });

  doc.text(formatCurrency(amount), PAGE_MARGIN, y, {
    width: CONTENT_WIDTH,
    align: "right",
  });

  doc.moveDown(0.4);
};

export const generatePayslipPDF = async ({
  companyName = DEFAULT_COMPANY_NAME,
  employee = {},
  payroll = {},
}) => {
  return buildPdfBuffer((doc) => {
    drawReportHeader(doc, {
      companyName,
      title: "Salary Payslip",
      subtitle: payroll.month ? `Payroll Month: ${payroll.month}` : undefined,
    });

    doc.font("Helvetica-Bold").fontSize(12).text("Employee Details");
    doc.moveDown(0.4);
    doc.font("Helvetica").fontSize(10);

    drawKeyValueLine(doc, "Employee ID:", employee.employeeId || "—");
    drawKeyValueLine(
      doc,
      "Name:",
      [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "—"
    );
    drawKeyValueLine(doc, "Email:", employee.email || "—");
    drawKeyValueLine(doc, "Department:", employee.department || "—");
    drawKeyValueLine(doc, "Designation:", employee.designation || "—");

    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").fontSize(12).text("Salary Breakdown");
    doc.moveDown(0.5);
    doc
      .rect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, 180)
      .strokeColor("#dddddd")
      .stroke();
    doc.strokeColor("#000000");

    const boxTop = doc.y + 12;
    doc.y = boxTop;

    drawSalaryRow(doc, "Basic Salary", payroll.basicSalary);
    drawSalaryRow(doc, "Allowances", payroll.allowances);
    drawSalaryRow(doc, "Deductions", payroll.deductions);
    drawSalaryRow(doc, "Tax", payroll.tax);
    drawSalaryRow(doc, "Loans", payroll.loans);

    doc
      .moveTo(PAGE_MARGIN + 10, doc.y + 4)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH - 10, doc.y + 4)
      .strokeColor("#bbbbbb")
      .stroke();
    doc.strokeColor("#000000");
    doc.moveDown(0.8);

    drawSalaryRow(doc, "Net Salary", payroll.netSalary, { bold: true });

    doc.moveDown(1.2);
    doc
      .font("Helvetica-Oblique")
      .fontSize(8)
      .fillColor("#666666")
      .text(
        "This is a system-generated payslip. For queries, contact your HR department.",
        { align: "center" }
      );
    doc.fillColor("#000000");
  });
};

export const generateAttendancePDF = async ({
  companyName = DEFAULT_COMPANY_NAME,
  title = "Attendance Report",
  subtitle,
  records = [],
}) => {
  const tableRows = records.map((record) => ({
    employee: getEmployeeLabel(record.employee),
    date: formatDate(record.createdAt || record.checkInTime),
    login: record.checkInTime || "—",
    logout: record.checkOutTime || "—",
    status: record.status || "—",
    location: record.location || "—",
  }));

  return buildPdfBuffer((doc) => {
    drawReportHeader(doc, { companyName, title, subtitle });
    doc.font("Helvetica").fontSize(10).text(`Total Records: ${records.length}`);
    doc.moveDown(0.6);

    if (tableRows.length === 0) {
      doc.text("No attendance records found for this report.");
      return;
    }

    drawTable(
      doc,
      [
        { key: "employee", label: "Employee", width: 120 },
        { key: "date", label: "Date", width: 70 },
        { key: "login", label: "Login", width: 95 },
        { key: "logout", label: "Logout", width: 95 },
        { key: "status", label: "Status", width: 60 },
        { key: "location", label: "Location", width: 55 },
      ],
      tableRows
    );
  });
};

export const generateLeavePDF = async ({
  companyName = DEFAULT_COMPANY_NAME,
  title = "Leave Report",
  subtitle,
  records = [],
}) => {
  const tableRows = records.map((record) => ({
    employee: getEmployeeLabel(record.employee),
    leaveType: (() => {
      const type = record.leaveType || "—";
      if (record.leaveCategory === "Half Day") {
        return `${type} (Half - ${record.halfDaySession || "Morning"})`;
      }
      if (record.leaveCategory === "Short Leave") {
        return `${type} (Short: ${record.startTime || ""} - ${record.endTime || ""})`;
      }
      return type;
    })(),
    startDate: formatDate(record.startDate),
    endDate: formatDate(record.endDate),
    status: record.status || "—",
    reason:
      record.reason && record.reason.length > 40
        ? `${record.reason.slice(0, 37)}...`
        : record.reason || "—",
  }));

  return buildPdfBuffer((doc) => {
    drawReportHeader(doc, { companyName, title, subtitle });
    doc.font("Helvetica").fontSize(10).text(`Total Records: ${records.length}`);
    doc.moveDown(0.6);

    if (tableRows.length === 0) {
      doc.text("No leave records found for this report.");
      return;
    }

    drawTable(
      doc,
      [
        { key: "employee", label: "Employee", width: 110 },
        { key: "leaveType", label: "Type", width: 65 },
        { key: "startDate", label: "Start", width: 70 },
        { key: "endDate", label: "End", width: 70 },
        { key: "status", label: "Status", width: 65 },
        { key: "reason", label: "Reason", width: 115 },
      ],
      tableRows
    );
  });
};

export const generatePerformancePDF = async ({
  companyName = DEFAULT_COMPANY_NAME,
  title = "Performance Report",
  subtitle,
  records = [],
}) => {
  const tableRows = records.map((record) => {
    const lastFeedbackObj = record.managerFeedback?.[record.managerFeedback.length - 1];
    const feedbackText = lastFeedbackObj?.feedback || "—";

    return {
      employee: getEmployeeLabel(record.employee),
      attendanceScore: record.attendanceScore ?? "—",
      taskCompletionRate:
        record.taskCompletionRate !== undefined
          ? `${record.taskCompletionRate}%`
          : "—",
      qualityScore: record.qualityScore ?? "—",
      overallScore: record.overallScore ?? "—",
      feedback:
        feedbackText && feedbackText !== "—" && feedbackText.length > 30
          ? `${feedbackText.slice(0, 27)}...`
          : feedbackText,
    };
  });

  return buildPdfBuffer((doc) => {
    drawReportHeader(doc, { companyName, title, subtitle });
    doc.font("Helvetica").fontSize(10).text(`Total Records: ${records.length}`);
    doc.moveDown(0.6);

    if (tableRows.length === 0) {
      doc.text("No performance records found for this report.");
      return;
    }

    drawTable(
      doc,
      [
        { key: "employee", label: "Employee", width: 105 },
        { key: "attendanceScore", label: "Attendance", width: 60 },
        { key: "taskCompletionRate", label: "Tasks", width: 55 },
        { key: "qualityScore", label: "Quality", width: 55 },
        { key: "overallScore", label: "Overall", width: 55 },
        { key: "feedback", label: "Feedback", width: 115 },
      ],
      tableRows
    );
  });
};
