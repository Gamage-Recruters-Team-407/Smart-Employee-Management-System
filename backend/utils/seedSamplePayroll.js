import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

export const seedSamplePayroll = async () => {
  const payrollCount = await Payroll.countDocuments();
  if (payrollCount > 0) return;

  let employee = await Employee.findOne({ employeeId: "EMP001" });

  if (!employee) {
    employee = await Employee.create({
      employeeId: "EMP001",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@sems.com",
      phone: "+1 555-0100",
      department: "Engineering",
      designation: "Software Developer",
      salary: 5000,
      joiningDate: new Date("2024-01-15"),
      status: "Active",
    });
  }

  await Payroll.create({
    employee: employee._id,
    basicSalary: 5000,
    allowances: 800,
    deductions: 200,
    tax: 450,
    loans: 100,
    netSalary: 5050,
    month: "May 2026",
  });

  console.log("Sample payroll seeded for payslip download (EMP001 / May 2026)");
};
