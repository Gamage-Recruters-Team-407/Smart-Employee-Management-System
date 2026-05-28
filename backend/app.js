import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import employeeRoutes from "./routes/employeeRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/employees", employeeRoutes);
app.use("/api/employees/:id/documents", documentRoutes);

app.get("/", (_req, res) => {
  res.send("Backend Running");
});

export default app;
