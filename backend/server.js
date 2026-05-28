// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// <<<<<<< HEAD
// import mongoose from "mongoose";
// import authRoutes from "./routes/authRoutes.js";
// import employeeRoutes from "./routes/employeeRoutes.js";
// import attendanceRoutes from "./routes/attendanceRoutes.js";

// =======
// import { connectDB } from "./config/db.js";
// import taskRoutes from "./routes/taskRoutes.js";
// import employeeRoutes from "./routes/employeeRoutes.js";
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
// dotenv.config();

// const app = express();

// <<<<<<< HEAD
// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "http://localhost:3000"
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// }));
// app.use(express.json());

// // ── Database ──────────────────────────────────────────────────────────────────
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err.message);
//     process.exit(1);
//   });

// // ── Routes ────────────────────────────────────────────────────────────────────
// app.get("/", (req, res) => res.send("SEMS Backend Running"));
// app.use("/api/auth", authRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/attendance", attendanceRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// =======
// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Backend Running");
// });

// app.get("/api", (req, res) => {
//   res.json({ message: "Smart Employee Management API" });
// });

// app.use("/api/tasks", taskRoutes);
// app.use("/api/employees", employeeRoutes);

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();

//   const server = app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });

//   server.on("error", (err) => {
//     if (err.code === "EADDRINUSE") {
//       console.error(
//         `Port ${PORT} is already in use. Stop the other process or change PORT in .env`
//       );
//       process.exit(1);
//     }
//     throw err;
//   });
// };

// startServer();
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";

// Routes Import කිරීම්
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();

// CORS සකස් කිරීම (Allowed Origins සමඟ)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ── Base Routes ───────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("SEMS Backend Running"));
app.get("/api", (req, res) => res.json({ message: "Smart Employee Management API" }));

// ── API Middleware Routes ─────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

// ── Server එක ආරම්භ කිරීම ──────────────────────────────────────────────────────
const startServer = async () => {
  // Database එකට සම්බන්ධ වීම
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Port එකක් දැනටමත් භාවිතයේ තිබේ නම් (EADDRINUSE) වෙන දෝෂ පාලනය කිරීම
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other process or change PORT in .env`
      );
      process.exit(1);
    }
    throw err;
  });
};

startServer();