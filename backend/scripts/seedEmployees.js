import dotenv from "dotenv";
import dns from "dns";
import mongoose from "mongoose";
import { pathToFileURL } from "url";
import Employee from "../models/Employee.js";
import demoEmployees from "../data/demoEmployees.js";
import generateEmployeeId from "../utils/generateEmployeeId.js";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const DEMO_EMAIL_PATTERN = /@demo\.sems\.local$/;

export const seedEmployees = async () => {
  await Employee.deleteMany({ email: DEMO_EMAIL_PATTERN });

  const createdEmployees = [];
  for (const employeeData of demoEmployees) {
    const employee = await Employee.create({
      ...employeeData,
      employeeId: await generateEmployeeId(),
      email: employeeData.email.toLowerCase(),
    });
    createdEmployees.push(employee);
  }

  return createdEmployees;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const employees = await seedEmployees();
  console.log(`Seeded ${employees.length} demo employees:`);
  employees.forEach((employee) => {
    console.log(`- ${employee.employeeId} ${employee.firstName} ${employee.lastName} <${employee.email}>`);
  });
  await mongoose.disconnect();
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(async (error) => {
    console.error(error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
}
