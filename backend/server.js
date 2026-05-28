import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

import { seedDefaultUser } from "./utils/seedDefaultUser.js";
import { seedSamplePayroll } from "./utils/seedSamplePayroll.js";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json());

// Static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check routes
app.get("/", (req, res) => {
  res.send("SEMS Backend Running");
});

app.get("/api", (req, res) => {
  res.json({
    message: "Smart Employee Management API",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications/reports", reportRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/leaves", leaveRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");

    // Seed default data
    await seedDefaultUser();
    await seedSamplePayroll();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});