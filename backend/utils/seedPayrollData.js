import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../.env") });

const sriLankanNames = [
  { firstName: "Nimal", lastName: "Perera" },
  { firstName: "Kasun", lastName: "Silva" },
  { firstName: "Chamara", lastName: "Fernando" },
  { firstName: "Tharindu", lastName: "Wijesinghe" },
  { firstName: "Dilshan", lastName: "Jayawardena" },
  { firstName: "Sanduni", lastName: "Perera" },
  { firstName: "Ishara", lastName: "Fernando" },
  { firstName: "Malith", lastName: "Gunasekara" },
  { firstName: "Praveen", lastName: "Rajapaksa" },
  { firstName: "Dinusha", lastName: "Karunaratne" }
];

async function seedPayrollData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const existingPayrolls = await Payroll.find({});
    
    if (existingPayrolls.length > 0) {
      console.log(`Found ${existingPayrolls.length} existing payroll records.`);
      
      const employeeIds = [...new Set(existingPayrolls.filter(p => p.employee).map(p => p.employee.toString()))];
      
      console.log(`Updating ${employeeIds.length} employees with Sri Lankan names...`);
      for (let i = 0; i < employeeIds.length; i++) {
        const name = sriLankanNames[i % sriLankanNames.length];
        await Employee.findByIdAndUpdate(employeeIds[i], {
          firstName: name.firstName,
          lastName: name.lastName
        });
      }
      console.log("Employees updated successfully.");
    } else {
      console.log("No existing payroll data found. Seeding new data for 4 months...");
      
      // Get some employees or create them
      let employees = await Employee.find({}).limit(10);
      if (employees.length === 0) {
        console.log("No employees found. Creating 10 mock employees...");
        const newEmployees = sriLankanNames.map((name, idx) => ({
          employeeId: `emp-${String(idx + 1).padStart(3, '0')}`,
          firstName: name.firstName,
          lastName: name.lastName,
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@example.com`,
          department: "Engineering",
          designation: "Software Engineer",
          salary: Math.floor(Math.random() * (180000 - 60000) + 60000)
        }));
        employees = await Employee.insertMany(newEmployees);
      } else {
        // Update existing employees with Sri Lankan names
        for (let i = 0; i < employees.length; i++) {
          const name = sriLankanNames[i % sriLankanNames.length];
          employees[i].firstName = name.firstName;
          employees[i].lastName = name.lastName;
          await employees[i].save();
        }
      }

      // Generate last 4 months
      const monthsToGenerate = [];
      const currentDate = new Date();
      for (let i = 0; i < 4; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'long' });
        const year = d.getFullYear();
        monthsToGenerate.push({ month: monthName, year });
      }

      const payrollsToInsert = [];

      for (const emp of employees) {
        const baseSalary = emp.salary || Math.floor(Math.random() * (180000 - 60000) + 60000);
        
        for (const m of monthsToGenerate) {
          const allowances = Math.floor(Math.random() * 20000) + 5000;
          const deductions = Math.floor(baseSalary * 0.08); // 8% EPF
          const tax = Math.floor(baseSalary * 0.02); // 2% Tax
          const loans = Math.random() > 0.7 ? Math.floor(Math.random() * 5000) : 0;
          const netSalary = baseSalary + allowances - deductions - tax - loans;

          payrollsToInsert.push({
            employee: emp._id,
            basicSalary: baseSalary,
            allowances,
            deductions,
            tax,
            loans,
            netSalary,
            month: m.month,
            year: m.year
          });
        }
      }

      await Payroll.insertMany(payrollsToInsert);
      console.log(`Successfully seeded ${payrollsToInsert.length} payroll records for ${employees.length} employees across 4 months.`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding payroll data:", error);
    mongoose.connection.close();
  }
}

seedPayrollData();
