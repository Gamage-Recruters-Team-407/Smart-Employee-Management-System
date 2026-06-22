import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db.js";
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
import { seedDefaultUser } from "./utils/seedDefaultUser.js";
import { seedSamplePayroll } from "./utils/seedSamplePayroll.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import http from "http";
import { initWebSocket } from "./services/websocketService.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000"
];
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
      const isExplicitlyAllowed =
        allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL;

      let isLocalDevOrigin = false;
      if (origin) {
        try {
          const parsed = new URL(origin);
          isLocalDevOrigin =
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
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
    }
    : true,
  credentials: true,
  exposedHeaders: ["Content-Disposition"]
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => res.send("SEMS Backend Running"));
app.get("/api", (_req, res) => res.json({ message: "Smart Employee Management API" }));

// Google OAuth (explicit routes so GET /api/auth/google always works)
app.get("/api/auth/google/status", getGoogleAuthStatus);
app.get("/api/auth/google/callback", handleGoogleCallback);
app.get("/api/auth/google", redirectToGoogle);

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

const PORT = process.env.PORT || 5000;
// Listen on all interfaces in dev so http://localhost:5000 and http://127.0.0.1:5000 both work
const HOST = process.env.HOST || "0.0.0.0";
let serverInstance = null;
let isStarting = false;

const startServer = async () => {
  if (serverInstance || isStarting) {
    return;
  }

  isStarting = true;

  try {
    await connectDB();
    await seedDefaultUser();
    await seedSamplePayroll();

    const server = http.createServer(app);
    initWebSocket(server);

    serverInstance = server.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });

    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        if (serverInstance?.listening) {
          console.warn("Ignoring duplicate EADDRINUSE event after server startup.");
          return;
        }
        console.error(`Port ${PORT} is already in use on host ${HOST}. Stop the other process or change PORT in .env`);
        process.exit(1);
      }
      console.error("HTTP server error:", err);
      process.exit(1);
    });
  } catch (error) {
    isStarting = false;
    serverInstance = null;
    console.error("Failed to start the server:", error);
    process.exit(1);
  } finally {
    isStarting = false;
  }
};

startServer();