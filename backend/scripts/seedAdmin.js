import dotenv from "dotenv";
import mongoose from "mongoose";
import { pathToFileURL } from "url";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

dotenv.config({ path: "./backend/.env" });

const DEFAULT_ADMIN = {
  name: "Admin User",
  email: "admin@sems.com",
  password: "admin123",
  role: "Admin",
};

/**
 * Standalone script to connect to MongoDB and ensure the default
 * admin user exists.
 *
 * To run: `node backend/scripts/seedAdmin.js`
 */
const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is required. Make sure you have a .env file in the /backend directory."
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB...");

  // --- Seeding Logic ---
  const hashedAdminPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  const existingAdmin = await User.findOne({ email: DEFAULT_ADMIN.email }).select("+password");

  if (existingAdmin) {
    const isPasswordMatch = existingAdmin.password ? await bcrypt.compare(DEFAULT_ADMIN.password, existingAdmin.password) : false;
    if (!isPasswordMatch) {
      existingAdmin.password = hashedAdminPassword;
      existingAdmin.role = DEFAULT_ADMIN.role;
      await existingAdmin.save();
      console.log("Default admin password has been reset to 'admin123'.");
    } else {
      console.log("Default admin user already exists.");
    }
  } else {
    await User.create({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: hashedAdminPassword,
      role: DEFAULT_ADMIN.role,
    });
    console.log(`Default admin created: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`);
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
};

// This allows the script to be run directly from the command line
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(async (error) => {
    console.error("❌ Admin seeding failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  });
}