import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import employeeRoutes from "./routes/employeeRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import {
  getGoogleAuthStatus,
  redirectToGoogle,
  handleGoogleCallback,
} from "./controllers/googleAuthController.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
const uploadsPath = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? path.join("/tmp", "uploads") : path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsPath));

app.get("/api/auth/google/status", getGoogleAuthStatus);
app.get("/api/auth/google/callback", handleGoogleCallback);
app.get("/api/auth/google", redirectToGoogle);

app.use("/api/employees", employeeRoutes);
app.use("/api/employees/:id/documents", documentRoutes);

app.get("/", (_req, res) => {
  res.send("Backend Running");
});

export default app;
