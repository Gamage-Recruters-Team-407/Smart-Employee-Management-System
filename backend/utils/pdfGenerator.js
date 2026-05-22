import PDFDocument from "pdfkit";

// Helper to convert number to words (Indian numbering system format)
export function numberToWords(num) {
  if (num === 0) return "Zero Rupees only";
  
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertLessThanThousand = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit !== 0 ? "-" + a[digit] : "") + " ";
  };

  try {
    let n = Math.floor(num);
    let str = "";
    
    // Crore (10,00,00,00)
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) {
      str += convertLessThanThousand(crore) + "crore ";
    }

    // Lakh (1,00,000)
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) {
      str += convertLessThanThousand(lakh) + "lakh ";
    }

    // Thousand (1,000)
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) {
      str += convertLessThanThousand(thousand) + "thousand ";
    }

    // Hundred (100)
    const hundred = Math.floor(n / 100);
    n %= 100;
    if (hundred > 0) {
      str += convertLessThanThousand(hundred) + "hundred ";
    }

    // Tens and Ones
    if (n > 0) {
      if (str !== "") str += "and ";
      str += convertLessThanThousand(n);
    }

    return str.trim() + " Rupees only";
  } catch (error) {
    return num + " Rupees only";
  }
}

export const generatePayslipPDF = (payroll, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Stream PDF directly to client
  doc.pipe(res);

  const emp = payroll.employee || {
    employeeId: "N/A",
    firstName: "Unknown",
    lastName: "Employee",
    department: "N/A",
    designation: "N/A",
    email: "N/A",
    phone: "N/A",
  };
  
  const monthName = new Date(payroll.month + "-02").toLocaleString("default", { month: "long", year: "numeric" });

  // Theme Colors
  const primaryColor = "#4F46E5"; // Indigo
  const secondaryColor = "#1F2937"; // Dark gray
  const lightBg = "#F3F4F6"; // Light gray
  const accentColor = "#059669"; // Emerald for Net Salary

  // Title / Logo Area
  doc.rect(50, 40, 495, 60).fill(primaryColor);
  doc.fillColor("#FFFFFF").fontSize(18).font("Helvetica-Bold").text("SMART INFOTECH", 70, 52);
  doc.fontSize(9).font("Helvetica").text("Smart Employee & Payroll Management System", 70, 78);
  doc.fontSize(14).font("Helvetica-Bold").text("PAYSLIP", 420, 62, { width: 110, align: "right" });

  // Metadata
  doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text(`Month: ${monthName}`, 50, 120);
  doc.font("Helvetica").text(`Generated Date: ${new Date(payroll.createdAt).toLocaleDateString()}`, 50, 135);
  doc.font("Helvetica-Bold").fillColor(payroll.status === "Paid" ? "#059669" : "#DC2626").text(`Status: ${payroll.status}`, 50, 150);

  // Divider Line
  doc.moveTo(50, 165).lineTo(545, 165).stroke("#D1D5DB");

  // Employee Information Block
  doc.fillColor(secondaryColor).fontSize(11).font("Helvetica-Bold").text("EMPLOYEE DETAILS", 50, 180);
  
  // Grid of Employee Data
  doc.fontSize(9).font("Helvetica-Bold").text("Employee ID:", 50, 205);
  doc.font("Helvetica").text(emp.employeeId || "N/A", 130, 205);

  doc.font("Helvetica-Bold").text("Name:", 50, 220);
  doc.font("Helvetica").text(`${emp.firstName} ${emp.lastName}`, 130, 220);

  doc.font("Helvetica-Bold").text("Department:", 50, 235);
  doc.font("Helvetica").text(emp.department || "N/A", 130, 235);

  doc.font("Helvetica-Bold").text("Designation:", 50, 250);
  doc.font("Helvetica").text(emp.designation || "N/A", 130, 250);

  doc.font("Helvetica-Bold").text("Email:", 300, 205);
  doc.font("Helvetica").text(emp.email || "N/A", 380, 205);

  doc.font("Helvetica-Bold").text("Phone:", 300, 220);
  doc.font("Helvetica").text(emp.phone || "N/A", 380, 220);

  doc.font("Helvetica-Bold").text("Joining Date:", 300, 235);
  doc.font("Helvetica").text(emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "N/A", 380, 235);

  // Table Header
  doc.rect(50, 280, 240, 20).fill("#E5E7EB");
  doc.fillColor(secondaryColor).font("Helvetica-Bold").text("EARNINGS", 60, 286);
  doc.text("Amount (INR)", 180, 286, { width: 100, align: "right" });

  doc.rect(305, 280, 240, 20).fill("#E5E7EB");
  doc.fillColor(secondaryColor).font("Helvetica-Bold").text("DEDUCTIONS", 315, 286);
  doc.text("Amount (INR)", 435, 286, { width: 100, align: "right" });

  // Table Body - Row 1
  // Earnings: Basic Salary
  doc.font("Helvetica").text("Basic Salary", 60, 310);
  doc.text(`Rs. ${payroll.basicSalary.toLocaleString("en-IN")}.00`, 180, 310, { width: 100, align: "right" });
  
  // Deductions: Provident Fund
  const pt = 200;
  const pf = Math.max(0, Math.round(payroll.deductions - pt));
  doc.text("Provident Fund (PF)", 315, 310);
  doc.text(`Rs. ${pf.toLocaleString("en-IN")}.00`, 435, 310, { width: 100, align: "right" });

  // Table Body - Row 2
  // Earnings: Allowances
  doc.text("Allowances", 60, 330);
  doc.text(`Rs. ${payroll.allowances.toLocaleString("en-IN")}.00`, 180, 330, { width: 100, align: "right" });
  
  // Deductions: Professional Tax
  doc.text("Professional Tax (PT)", 315, 330);
  doc.text("Rs. 200.00", 435, 330, { width: 100, align: "right" });

  // Table Body - Row 3
  // Deductions: Income Tax (TDS)
  doc.text("Income Tax (TDS)", 315, 350);
  doc.text(`Rs. ${payroll.tax.toLocaleString("en-IN")}.00`, 435, 350, { width: 100, align: "right" });

  // Table Body - Row 4
  // Deductions: Loans
  doc.text("Loan Deductions", 315, 370);
  doc.text(`Rs. ${payroll.loans.toLocaleString("en-IN")}.00`, 435, 370, { width: 100, align: "right" });

  // Draw lines to form table structure
  doc.rect(50, 280, 240, 115).stroke("#D1D5DB");
  doc.rect(305, 280, 240, 115).stroke("#D1D5DB");

  // Totals Row
  const totalEarnings = payroll.basicSalary + payroll.allowances;
  const totalDeductions = pf + pt + payroll.tax + payroll.loans;

  doc.rect(50, 395, 240, 20).fill("#F9FAFB");
  doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Total Earnings", 60, 401);
  doc.text(`Rs. ${totalEarnings.toLocaleString("en-IN")}.00`, 180, 401, { width: 100, align: "right" });

  doc.rect(305, 395, 240, 20).fill("#F9FAFB");
  doc.fillColor(secondaryColor).font("Helvetica-Bold").text("Total Deductions", 315, 401);
  doc.text(`Rs. ${totalDeductions.toLocaleString("en-IN")}.00`, 435, 401, { width: 100, align: "right" });

  doc.rect(50, 395, 240, 20).stroke("#D1D5DB");
  doc.rect(305, 395, 240, 20).stroke("#D1D5DB");

  // Net Salary Banner
  doc.rect(50, 435, 495, 45).fill(lightBg);
  doc.fillColor(primaryColor).fontSize(12).font("Helvetica-Bold").text("NET SALARY:", 65, 453);
  doc.fillColor(accentColor).fontSize(13).font("Helvetica-Bold").text(`Rs. ${payroll.netSalary.toLocaleString("en-IN")}.00`, 155, 453);
  
  const words = numberToWords(payroll.netSalary);
  const capitalizedWords = words ? (words.charAt(0).toUpperCase() + words.slice(1)) : "";
  doc.fillColor(secondaryColor).fontSize(7.5).font("Helvetica-Oblique").text(`(${capitalizedWords})`, 270, 454, { width: 260, align: "right" });

  // Signature lines
  doc.fillColor(secondaryColor).font("Helvetica").fontSize(9);
  doc.text("Employer Signature", 80, 560);
  doc.moveTo(50, 550).lineTo(180, 550).stroke("#D1D5DB");

  doc.text("Employee Signature", 415, 560);
  doc.moveTo(380, 550).lineTo(510, 550).stroke("#D1D5DB");

  // Footer
  doc.fontSize(7.5).fillColor("#9CA3AF").text("This is a computer-generated document and does not require a physical signature.", 50, 620, { width: 495, align: "center" });

  doc.end();
};
