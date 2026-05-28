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
    // Cycle template so any number of employees can be seeded.
    employee: employee._id,
    ...template[index % template.length],
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
  const primaryUri = (process.env.MONGO_URI || "").trim();
  const localFallbackUri = (process.env.MONGO_FALLBACK_URI || "").trim();
  const allowInMemoryFallback = process.env.SEED_ALLOW_IN_MEMORY === "true";
  const tryPrimaryInDev = process.env.MONGO_TRY_PRIMARY_IN_DEV === "true";
  const isProduction = process.env.NODE_ENV === "production";
  let mongodInstance = null;
  const attempts = [];

  if (isProduction) {
    if (primaryUri) {
      attempts.push({ uri: primaryUri, label: "primary" });
    }
  } else {
    if (localFallbackUri && localFallbackUri !== primaryUri) {
      attempts.push({ uri: localFallbackUri, label: "local fallback" });
    }
    if (primaryUri && tryPrimaryInDev) {
      attempts.push({ uri: primaryUri, label: "primary" });
    }
    if (primaryUri && !tryPrimaryInDev) {
      console.warn("Skipping primary MongoDB URI in seed for development. Set MONGO_TRY_PRIMARY_IN_DEV=true to use it.");
    }
  }

  let lastError = null;
  for (const attempt of attempts) {
    try {
      await mongoose.connect(attempt.uri, { serverSelectionTimeoutMS: 12000 });
      console.log(`Connected to ${attempt.label} MongoDB for seed.`);
      return mongodInstance;
    } catch (error) {
      lastError = error;
      console.warn(`${attempt.label} Mongo connection failed: ${error.message}`);
    }
  }

  if (allowInMemoryFallback) {
    mongodInstance = await MongoMemoryServer.create();
    await mongoose.connect(mongodInstance.getUri());
    console.log("Connected to in-memory MongoDB for seed (SEED_ALLOW_IN_MEMORY=true).");
    return mongodInstance;
  }

  const seedTargetMessage = attempts.length > 0
    ? "Failed to connect to target MongoDB for seeding."
    : "No MongoDB URI configured for seeding.";

  throw new Error(
    `${seedTargetMessage} Set MONGO_URI (or MONGO_FALLBACK_URI), or run with SEED_ALLOW_IN_MEMORY=true for temporary seed data. Last error: ${lastError?.message || "N/A"}`
  );
};

const seed = async () => {
  let mongod = null;
  let exitCode = 0;
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

    // Seed for all employees in the DB, not only the hardcoded sample set.
    const employees = await User.find({ role: "Employee" }).select("_id name email role");
    const manager = users.find((user) => user.role === "Manager");
    if (!manager) {
      throw new Error("Manager user is required to seed manager feedback.");
    }

    const performanceDocs = buildPerformanceDocs(employees, manager._id);
    let createdCount = 0;
    for (const doc of performanceDocs) {
      const existing = await Performance.findOne({ employee: doc.employee });
      if (!existing) {
        await Performance.create(doc);
        createdCount += 1;
      }
    }

    console.log(`Performance seed complete. Added ${createdCount} new performance records.`);
  } catch (error) {
    exitCode = 1;
    console.error("Performance seed failed:", error);
  } finally {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    process.exit(exitCode);
  }
};

seed();
