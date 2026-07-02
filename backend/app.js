/**
 * app.js — Vercel serverless entry point
 *
 * This file mirrors the routes and middleware from server.js so that every
 * API endpoint works identically on Vercel.  It also creates an HTTP server
 * with Socket.IO attached so Vercel Fluid Compute can serve WebSocket
 * upgrade requests.
 */
import express from "express";
import cors from "cors";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { initWebSocket } from "./services/websocketService.js";

// ── Route imports (keep in sync with server.js) ─────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import {
  getGoogleAuthStatus,
  redirectToGoogle,
  handleGoogleCallback,
} from "./controllers/googleAuthController.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import dailyReportRoutes from "./routes/dailyReportRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";

// ── Express app ─────────────────────────────────────────────────────────────
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── CORS (same policy as server.js) ─────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      const isExplicitlyAllowed =
        allowedOrigins.includes(origin) ||
        origin === process.env.FRONTEND_URL ||
        (origin && origin.endsWith(".vercel.app"));

      let isLocalDevOrigin = false;
      if (origin) {
        try {
          const parsed = new URL(origin);
          isLocalDevOrigin =
            (parsed.hostname === "localhost" ||
              parsed.hostname === "127.0.0.1") &&
            ["3000", "5173", "5174"].includes(parsed.port);
        } catch {
          isLocalDevOrigin = false;
        }
      }

      if (!origin || isExplicitlyAllowed || isLocalDevOrigin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health / root ───────────────────────────────────────────────────────────
app.get("/", (_req, res) => res.send("SEMS Backend Running"));
app.get("/api", (_req, res) =>
  res.json({ message: "Smart Employee Management API" })
);

// ── Google OAuth ────────────────────────────────────────────────────────────
app.get("/api/auth/google/status", getGoogleAuthStatus);
app.get("/api/auth/google/callback", handleGoogleCallback);
app.get("/api/auth/google", redirectToGoogle);

// ── Database connection middleware for Serverless ───────────────────────────
app.use(async (req, res, next) => {
  if (req.method !== "OPTIONS" && req.path.startsWith("/api")) {
    try {
      await connectDB();
    } catch (err) {
      console.error("Database connection failed in serverless request:", err);
      return res.status(500).json({
        message: "Database connection failed",
        error: err.message,
      });
    }
  }
  next();
});

// ── API routes (keep in sync with server.js) ────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications/reports", reportRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/daily-reports", dailyReportRoutes);
app.use("/api/issues", issueRoutes);

// ── HTTP server + Socket.IO  ─────────────────────────────────────────────────
const server = http.createServer(app);
initWebSocket(server);

// ── Connect to MongoDB once on cold start ───────────────────────────────────
connectDB().catch((err) => console.error("MongoDB connection error:", err));

// Export the HTTP server so Vercel can handle WebSocket upgrades
export default server;
