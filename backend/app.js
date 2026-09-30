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
import compression from "compression";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { corsOptions } from "./config/corsConfig.js";
import { registerRoutes } from "./routes/registerRoutes.js";
import { initWebSocket } from "./services/websocketService.js";

// ── Express app ─────────────────────────────────────────────────────────────
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Health / root ───────────────────────────────────────────────────────────
app.get(["/favicon.ico", "/favicon.png"], (_req, res) => res.status(204).end());
app.get("/", (_req, res) => res.send("SEMS Backend Running"));
app.get("/api", (_req, res) =>
  res.json({ message: "Smart Employee Management API" })
);

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

// ── Register all API & OAuth routes ─────────────────────────────────────────
registerRoutes(app);

// ── HTTP server + Socket.IO  ─────────────────────────────────────────────────
const server = http.createServer(app);
initWebSocket(server);

// ── Connect to MongoDB once on cold start ───────────────────────────────────
connectDB().catch((err) => console.error("MongoDB connection error:", err));

// Export the HTTP server so Vercel can handle WebSocket upgrades
export default server;
