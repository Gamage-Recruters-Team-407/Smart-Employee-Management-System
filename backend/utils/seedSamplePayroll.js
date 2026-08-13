import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";
import generateEmployeeId from "./generateEmployeeId.js";

export const seedSamplePayroll = async () => {
  try {
    const payrollCount = await Payroll.countDocuments();
    if (payrollCount > 0) return;

    let employee = await Employee.findOne({ email: "jane.doe@sems.com" });

    if (!employee) {
      const newId = await generateEmployeeId();
      employee = await Employee.create({
        employeeId: newId,
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

    const existingPayroll = await Payroll.findOne({
      employee: employee._id,
      month: "May",
      year: 2026,
    });

    if (!existingPayroll) {
      await Payroll.create({
        employee: employee._id,
        basicSalary: 5000,
        allowances: 800,
        deductions: 200,
        tax: 450,
        loans: 100,
        netSalary: 5050,
        month: "May",
        year: 2026,
      });
      console.log(`Sample payroll seeded for payslip download (${employee.employeeId} / May 2026)`);
    }
  } catch (err) {
    console.warn("Seed sample payroll skipped:", err.message);
  }
};
