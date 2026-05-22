import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Performance from "../models/Performance.js";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();

let mongodInstance = null;
const MONGO = process.env.MONGO_URI || "";

const sampleUsers = [
  { name: "Alice", email: "alice@example.com", password: "password", role: "Employee" },
  { name: "Bob", email: "bob@example.com", password: "password", role: "Employee" },
  { name: "Carol", email: "carol@example.com", password: "password", role: "Employee" },
  { name: "Dave", email: "dave@example.com", password: "password", role: "Manager" },
  { name: "Eve", email: "eve@example.com", password: "password", role: "HR" },
];

const samplePerformances = async (users) => {
  const [alice, bob, carol] = users.filter(u => u.role === "Employee");
  // create simple entries
  return [
    { employee: users[0]._id, attendancePercent: 95, tasksCompleted: 18, tasksAssigned: 20, qualityScore: 88 },
    { employee: users[1]._id, attendancePercent: 80, tasksCompleted: 15, tasksAssigned: 20, qualityScore: 75 },
    { employee: users[2]._id, attendancePercent: 100, tasksCompleted: 20, tasksAssigned: 20, qualityScore: 92 },
  ];
};

const run = async () => {
  try {
    if (MONGO) {
      try {
        await mongoose.connect(MONGO);
        console.log("Connected for seeding (primary)");
      } catch (err) {
        console.warn("Primary Mongo connection failed, falling back to in-memory:", err.message);
        // ensure mongoose has no lingering connection
        try {
          await mongoose.disconnect();
        } catch (e) {}
        mongodInstance = await MongoMemoryServer.create();
        const uri = mongodInstance.getUri();
        await mongoose.connect(uri);
        console.log("Connected to in-memory MongoDB for seeding");
      }
    } else {
      console.log("No MONGO_URI set — starting in-memory MongoDB for seeding");
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log("Connected to in-memory MongoDB for seeding");
    }

    // create users if not exists
    const createdUsers = [];
    for (const u of sampleUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) existing = await User.create(u);
      createdUsers.push(existing);
    }

    // create performances
    const perfDocs = await samplePerformances(createdUsers);
    for (const p of perfDocs) {
      const exists = await Performance.findOne({ employee: p.employee });
      if (!exists) await Performance.create(p);
    }

    console.log("Seeding completed.");
    if (mongodInstance) await mongodInstance.stop();
    process.exit(0);
  } catch (error) {
    console.error(error);
    if (mongodInstance) await mongodInstance.stop();
    process.exit(1);
  }
};

run();
