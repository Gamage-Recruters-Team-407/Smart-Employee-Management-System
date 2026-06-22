import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { updateStatus } from "../controllers/attendanceController.js";

dotenv.config();
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const test = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  // 1. Create a dummy test user and employee
  const testEmail = "verifier.break.early@demo.sems.local";
  
  await Employee.deleteMany({ email: testEmail });
  await User.deleteMany({ email: testEmail });
  await Attendance.deleteMany({}); // Delete today's attendance to avoid clutter in tests

  const user = await User.create({
    name: "Verification Tester",
    email: testEmail,
    password: "password123",
    role: "Employee"
  });

  const employee = await Employee.create({
    userId: user._id,
    employeeId: "emp-test-999",
    firstName: "Verification",
    lastName: "Tester",
    email: testEmail,
    joiningDate: new Date(),
    status: "Active"
  });

  console.log("Created test user ID:", user._id);
  console.log("Created test employee ID:", employee._id);

  const today = new Date().toISOString().split('T')[0];

  // 2. Simulate checking in (creates Attendance record with Employee _id)
  const initialAttendance = await Attendance.create({
    employee: employee._id,
    date: today,
    checkInTime: "09:00",
    status: "Present",
    onlineStatus: "Online"
  });
  console.log("Initial Attendance record created with Employee ID:", initialAttendance.employee);

  // Helper to run controller logic as a function
  const runUpdateStatus = async (body, userObj) => {
    let responseStatus = 200;
    let jsonResult = {};
    const req = {
      body,
      user: userObj
    };
    const res = {
      status(code) {
        responseStatus = code;
        return this;
      },
      json(data) {
        jsonResult = data;
        return this;
      }
    };
    await updateStatus(req, res);
    return { status: responseStatus, data: jsonResult };
  };

  // 3. Test starting a break via updateStatus by passing User ID as employeeId
  console.log("\n--- Testing start break with User ID ---");
  const startResult = await runUpdateStatus({
    employeeId: user._id.toString(),
    status: "Offline",
    breakType: "breakfast"
  }, user);

  console.log("Response status:", startResult.status);
  console.log("Response message:", startResult.data.message);

  // Retrieve all attendance records for today
  let allRecords = await Attendance.find({ date: today });
  console.log(`Total attendance records found: ${allRecords.length}`);
  
  if (allRecords.length !== 1) {
    console.error("❌ ERROR: Duplicate attendance records created!");
  } else {
    console.log("✅ SUCCESS: Only one attendance record exists.");
  }

  const updatedRecord = allRecords[0];
  console.log("Updated record employee ID:", updatedRecord?.employee);
  console.log("Updated record onlineStatus:", updatedRecord?.onlineStatus);
  console.log("Updated record breakType:", updatedRecord?.breakType);

  if (updatedRecord && updatedRecord.breakType === "breakfast" && updatedRecord.employee.toString() === employee._id.toString()) {
    console.log("✅ SUCCESS: Break started successfully on the correct Employee ID record!");
  } else {
    console.error("❌ ERROR: Failed to start break on the correct Employee ID record!");
  }

  // 4. Test ending the break early via updateStatus by passing User ID as employeeId
  console.log("\n--- Testing end break early with User ID ---");
  const endResult = await runUpdateStatus({
    employeeId: user._id.toString(),
    status: "Online",
    breakType: null
  }, user);

  console.log("Response status:", endResult.status);
  console.log("Response message:", endResult.data.message);

  allRecords = await Attendance.find({ date: today });
  console.log(`Total attendance records found after end break: ${allRecords.length}`);

  const finalRecord = allRecords[0];
  console.log("Final record employee ID:", finalRecord?.employee);
  console.log("Final record onlineStatus:", finalRecord?.onlineStatus);
  console.log("Final record breakType:", finalRecord?.breakType);

  if (finalRecord && finalRecord.onlineStatus === "Online" && finalRecord.breakType === null) {
    console.log("✅ SUCCESS: Break ended early and status set back to Online successfully!");
  } else {
    console.error("❌ ERROR: Failed to end break early!");
  }

  // Cleanup
  await Employee.deleteMany({ email: testEmail });
  await User.deleteMany({ email: testEmail });
  await Attendance.deleteMany({ employee: employee._id });
  
  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB. Verification script completed.");
};

test().catch(async (error) => {
  console.error("Test execution failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
