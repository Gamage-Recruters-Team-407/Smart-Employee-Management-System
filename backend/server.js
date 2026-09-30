import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import path from "path";
import http from "http";
import { connectDB } from "./config/db.js";
import { corsOptions } from "./config/corsConfig.js";
import { registerRoutes } from "./routes/registerRoutes.js";
import { initWebSocket } from "./services/websocketService.js";

dotenv.config();

const app = express();

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get(["/favicon.ico", "/favicon.png"], (_req, res) => res.status(204).end());
app.get("/", (_req, res) => res.send("SEMS Backend Running"));
app.get("/api", (_req, res) => res.json({ message: "Smart Employee Management API" }));

// Register all API & OAuth routes
registerRoutes(app);

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