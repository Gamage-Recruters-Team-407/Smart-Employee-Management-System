import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

dotenv.config();

const app = express();

// Resolve __dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve uploaded files as static assets at /uploads/<filename>
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB (Atlas with automatic local fallback)
connectDB();

// Routes
app.use("/api/employees", employeeRoutes);

// Document sub-routes: /api/employees/:id/documents
app.use("/api/employees/:id/documents", documentRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});