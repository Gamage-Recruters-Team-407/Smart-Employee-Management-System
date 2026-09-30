import authRoutes from "./authRoutes.js";
import {
  getGoogleAuthStatus,
  redirectToGoogle,
  handleGoogleCallback,
} from "../controllers/googleAuthController.js";
import employeeRoutes from "./employeeRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import taskRoutes from "./taskRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import reportRoutes from "./reportRoutes.js";
import payrollRoutes from "./payrollRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import performanceRoutes from "./performanceRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import dailyReportRoutes from "./dailyReportRoutes.js";
import issueRoutes from "./issueRoutes.js";

/**
 * Registers all application routes onto the given Express app instance.
 * Ensures server.js and app.js (Vercel) maintain complete route parity.
 */
export const registerRoutes = (app) => {
  // Google OAuth explicit routes
  app.get("/api/auth/google/status", getGoogleAuthStatus);
  app.get("/api/auth/google/callback", handleGoogleCallback);
  app.get("/api/auth/google", redirectToGoogle);

  // API endpoints
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
};
