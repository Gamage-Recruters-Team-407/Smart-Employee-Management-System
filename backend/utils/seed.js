import mongoose from "mongoose";
import dotenv from "dotenv";
import Employee from "../models/Employee.js";
import { generateEmployeeId } from "./generateEmployeeId.js";

dotenv.config({ path: "../.env" }); // Try parent folder
// Fallback if not loaded
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://localhost:27017/employee-management";
}

const seedEmployees = [
  {
    firstName: "Arjun",
    lastName: "Sharma",
    email: "arjun.sharma@example.com",
    phone: "9876543210",
    department: "Engineering",
    designation: "Senior Software Engineer",
    salary: 95000,
    joiningDate: new Date("2024-03-15"),
    address: "123 Green Glen Layout, Bangalore",
    status: "Active",
  },
  {
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@example.com",
    phone: "8765432109",
    department: "Human Resources",
    designation: "HR Manager",
    salary: 65000,
    joiningDate: new Date("2023-06-01"),
    address: "456 Skyline Apartments, Mumbai",
    status: "Active",
  },
  {
    firstName: "Rohan",
    lastName: "Verma",
    email: "rohan.verma@example.com",
    phone: "7654321098",
    department: "Sales",
    designation: "Sales Executive",
    salary: 42000,
    joiningDate: new Date("2025-01-10"),
    address: "789 Metro View, Delhi",
    status: "Active",
  },
  {
    firstName: "Ananya",
    lastName: "Iyer",
    email: "ananya.iyer@example.com",
    phone: "6543210987",
    department: "Design",
    designation: "UI/UX Designer",
    salary: 75000,
    joiningDate: new Date("2024-08-22"),
    address: "12 Palm Grove, Chennai",
    status: "Active",
  },
  {
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram.singh@example.com",
    phone: "5432109876",
    department: "Engineering",
    designation: "Tech Lead",
    salary: 145000,
    joiningDate: new Date("2022-11-05"),
    address: "89 HSR Layout, Bangalore",
    status: "Active",
  },
  {
    firstName: "Neha",
    lastName: "Reddy",
    email: "neha.reddy@example.com",
    phone: "4321098765",
    department: "Marketing",
    designation: "Marketing Specialist",
    salary: 52000,
    joiningDate: new Date("2024-10-18"),
    address: "34 Gachibowli, Hyderabad",
    status: "Inactive", // Test active filter
  }
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI.includes("27017") && !process.env.MONGO_URI.includes("employee-management")
      ? `${process.env.MONGO_URI.endsWith("/") ? process.env.MONGO_URI : process.env.MONGO_URI + "/"}employee-management`
      : process.env.MONGO_URI;

    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for seeding...");

    // Optional: Clear existing employees if desired, or skip duplicates
    const existingCount = await Employee.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} employees. Seeding additional unique employees...`);
    }

    for (const empData of seedEmployees) {
      const exists = await Employee.findOne({ email: empData.email });
      if (exists) {
        console.log(`Employee with email ${empData.email} already exists. Skipping.`);
        continue;
      }

      // Generate manual id
      const employeeId = await generateEmployeeId();
      
      const newEmp = new Employee({
        ...empData,
        employeeId
      });

      await newEmp.save();
      console.log(`Created employee: ${newEmp.firstName} ${newEmp.lastName} (${newEmp.employeeId})`);
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedDatabase();
