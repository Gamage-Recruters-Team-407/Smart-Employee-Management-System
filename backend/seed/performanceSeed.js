import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import Performance from "../models/Performance.js";

dotenv.config();

const sampleUsers = [
  { name: "Alice Johnson", email: "alice.employee@example.com", password: "password", role: "Employee" },
  { name: "Bob Smith", email: "bob.employee@example.com", password: "password", role: "Employee" },
  { name: "Carol Williams", email: "carol.employee@example.com", password: "password", role: "Employee" },
  { name: "Daniel Brown", email: "daniel.employee@example.com", password: "password", role: "Employee" },
  { name: "Emma Davis", email: "emma.employee@example.com", password: "password", role: "Employee" },
  { name: "Michael Manager", email: "manager@example.com", password: "password", role: "Manager" },
  { name: "Hannah HR", email: "hr@example.com", password: "password", role: "HR" }
];

const buildPerformanceDocs = (employees, managerId) => {
  const template = [
    { attendanceScore: 96, tasksCompleted: 22, tasksAssigned: 24, qualityScore: 91, notes: "Consistent top performer." },
    { attendanceScore: 88, tasksCompleted: 17, tasksAssigned: 20, qualityScore: 84, notes: "Strong progress in delivery speed." },
    { attendanceScore: 78, tasksCompleted: 14, tasksAssigned: 20, qualityScore: 76, notes: "Needs support on deadline management." },
    { attendanceScore: 92, tasksCompleted: 18, tasksAssigned: 19, qualityScore: 89, notes: "Reliable and detail-focused." },
    { attendanceScore: 85, tasksCompleted: 16, tasksAssigned: 21, qualityScore: 81, notes: "Good quality, target higher closure rate." }
  ];

  return employees.map((employee, index) => ({
    employee: employee._id,
    ...template[index],
    managerFeedback: [
      {
        manager: managerId,
        feedback: `Quarterly review submitted for ${employee.name}.`,
        rating: 4
      }
    ]
  }));
};

const connectMongo = async () => {
  const mongoUri = process.env.MONGO_URI || "";
  let mongodInstance = null;

  try {
    if (!mongoUri) {
      throw new Error("Missing MONGO_URI");
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to primary MongoDB for seed.");
  } catch (error) {
    console.warn("Primary Mongo connection failed. Using in-memory MongoDB:", error.message);
    mongodInstance = await MongoMemoryServer.create();
    await mongoose.connect(mongodInstance.getUri());
    console.log("Connected to in-memory MongoDB for seed.");
  }

  return mongodInstance;
};

const seed = async () => {
  let mongod = null;
  try {
    mongod = await connectMongo();

    const users = [];
    for (const user of sampleUsers) {
      let existing = await User.findOne({ email: user.email });
      if (!existing) {
        existing = await User.create(user);
      }
      users.push(existing);
    }

    const employees = users.filter((user) => user.role === "Employee").slice(0, 5);
    const manager = users.find((user) => user.role === "Manager");

    const performanceDocs = buildPerformanceDocs(employees, manager._id);
    for (const doc of performanceDocs) {
      const existing = await Performance.findOne({ employee: doc.employee });
      if (!existing) {
        await Performance.create(doc);
      }
    }

    console.log("Performance seed complete with 5 employee records.");
    process.exit(0);
  } catch (error) {
    console.error("Performance seed failed:", error);
    process.exit(1);
  } finally {
    if (mongod) {
      await mongod.stop();
    }
  }
};

seed();
