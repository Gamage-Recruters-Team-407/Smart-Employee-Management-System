// <<<<<<< HEAD
// // import express from "express";
// // import dotenv from "dotenv";
// // import cors from "cors";
// // <<<<<<< HEAD
// // import mongoose from "mongoose";
// // import authRoutes from "./routes/authRoutes.js";
// // import employeeRoutes from "./routes/employeeRoutes.js";
// // import attendanceRoutes from "./routes/attendanceRoutes.js";

// // =======
// // import { connectDB } from "./config/db.js";
// // import taskRoutes from "./routes/taskRoutes.js";
// // import employeeRoutes from "./routes/employeeRoutes.js";
// // >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
// // dotenv.config();

// // const app = express();

// // <<<<<<< HEAD
// // const allowedOrigins = [
// //   "http://localhost:5173",
// //   "http://localhost:5174",
// //   "http://localhost:3000"
// // ];

// // app.use(cors({
// //   origin: (origin, callback) => {
// //     if (!origin || allowedOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error("Not allowed by CORS"));
// //     }
// //   },
// //   credentials: true,
// // }));
// // app.use(express.json());

// // // ── Database ──────────────────────────────────────────────────────────────────
// // mongoose
// //   .connect(process.env.MONGO_URI)
// //   .then(() => console.log("MongoDB Connected"))
// //   .catch((err) => {
// //     console.error("MongoDB connection failed:", err.message);
// //     process.exit(1);
// //   });

// // // ── Routes ────────────────────────────────────────────────────────────────────
// // app.get("/", (req, res) => res.send("SEMS Backend Running"));
// // app.use("/api/auth", authRoutes);
// // app.use("/api/employees", employeeRoutes);
// // app.use("/api/attendance", attendanceRoutes);

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// // =======
// // app.use(cors());
// // app.use(express.json());

// // app.get("/", (req, res) => {
// //   res.send("Backend Running");
// // });

// // app.get("/api", (req, res) => {
// //   res.json({ message: "Smart Employee Management API" });
// // });

// // app.use("/api/tasks", taskRoutes);
// // app.use("/api/employees", employeeRoutes);

// // const PORT = process.env.PORT || 5000;

// // const startServer = async () => {
// //   await connectDB();

// //   const server = app.listen(PORT, () => {
// //     console.log(`Server running on port ${PORT}`);
// //   });

// //   server.on("error", (err) => {
// //     if (err.code === "EADDRINUSE") {
// //       console.error(
// //         `Port ${PORT} is already in use. Stop the other process or change PORT in .env`
// //       );
// //       process.exit(1);
// //     }
// //     throw err;
// //   });
// // };

// // startServer();
// // >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import { connectDB } from "./config/db.js";

// // Routes Import කිරීම්
// import authRoutes from "./routes/authRoutes.js";
// import employeeRoutes from "./routes/employeeRoutes.js";
// import attendanceRoutes from "./routes/attendanceRoutes.js";
// import taskRoutes from "./routes/taskRoutes.js";
// =======
// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import mongoose from "mongoose";
// import path from "path";

// import authRoutes from "./routes/authRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";
// import payrollRoutes from "./routes/payrollRoutes.js";
// import leaveRoutes from "./routes/leaveRoutes.js";

// import { seedDefaultUser } from "./utils/seedDefaultUser.js";
// import { seedSamplePayroll } from "./utils/seedSamplePayroll.js";
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5

// dotenv.config();

// const app = express();

// <<<<<<< HEAD
// // CORS සකස් කිරීම (Allowed Origins සමඟ)
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

// // ── Base Routes ───────────────────────────────────────────────────────────────
// app.get("/", (req, res) => res.send("SEMS Backend Running"));
// app.get("/api", (req, res) => res.json({ message: "Smart Employee Management API" }));

// // ── API Middleware Routes ─────────────────────────────────────────────────────
// app.use("/api/auth", authRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/tasks", taskRoutes);

// const PORT = process.env.PORT || 5000;

// // ── Server එක ආරම්භ කිරීම ──────────────────────────────────────────────────────
// const startServer = async () => {
//   // Database එකට සම්බන්ධ වීම
//   await connectDB();

//   const server = app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });

//   // Port එකක් දැනටමත් භාවිතයේ තිබේ නම් (EADDRINUSE) වෙන දෝෂ පාලනය කිරීම
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
// =======
// // Middleware
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//     exposedHeaders: ["Content-Disposition"],
//   })
// );

// app.use(express.json());

// // Static uploads folder
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// // Health check routes
// app.get("/", (req, res) => {
//   res.send("SEMS Backend Running");
// });

// app.get("/api", (req, res) => {
//   res.json({
//     message: "Smart Employee Management API",
//   });
// });

// // API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/notifications/reports", reportRoutes);
// app.use("/api/payroll", payrollRoutes);
// app.use("/api/leaves", leaveRoutes);

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("MongoDB Connected");

//     // Seed default data
//     await seedDefaultUser();
//     await seedSamplePayroll();
//   })
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err.message);
//     process.exit(1);
//   });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5


import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db.js";

// ─── ROUTES IMPORT කිරීම් ─────────────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";

// ─── UTILS / SEEDERS IMPORT කිරීම් ─────────────────────────────────────────────
import { seedDefaultUser } from "./utils/seedDefaultUser.js";
import { seedSamplePayroll } from "./utils/seedSamplePayroll.js";

dotenv.config();

const app = express();

// ─── CORS CONFIGURATION ───────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  exposedHeaders: ["Content-Disposition"], // PDF/CSV Download file names frontend එකට පෙනීමට අත්‍යවශ්‍යයි
}));

app.use(express.json());

// ─── STATIC UPLOADS FOLDER ────────────────────────────────────────────────────
// Profile ඡායාරූප frontend එකට පෙන්වීම සඳහා static middleware එක සකසයි
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── BASE / HEALTH CHECK ROUTES ────────────────────────────────────────────────
app.get("/", (req, res) => res.send("SEMS Backend Running"));
app.get("/api", (req, res) => res.json({ message: "Smart Employee Management API" }));

// ─── API MIDDLEWARE ROUTES ─────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications/reports", reportRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/leaves", leaveRoutes);

const PORT = process.env.PORT || 5000;

// ─── SERVER සහ DATABASE එක ආරම්භ කිරීම ──────────────────────────────────────────
const startServer = async () => {
  try {
    // Database එකට සම්බන්ධ වීම (./config/db.js හරහා)
    await connectDB();
    console.log("Database Connection Verified.");

    // Default සහ Sample දත්ත ස්වයංක්‍රීයව ඇතුළත් කිරීම (Seed Data)
    await seedDefaultUser();
    await seedSamplePayroll();

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

  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

startServer();