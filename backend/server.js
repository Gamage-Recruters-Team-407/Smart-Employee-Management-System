const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

dotenv.config();

require("./models/UserProxy");

const leaveRoutes = require("./routes/leaveRoutes");

// Optional routes — uncomment if those files exist in your project
// const authRoutes = require("./routes/authRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const payrollRoutes = require("./routes/payrollRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => res.send("SEMS Backend Running"));
app.get("/api", (req, res) => res.json({ message: "Smart Employee Management API" }));

// Routes
app.use("/api/leaves", leaveRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/payroll", payrollRoutes);

// Database connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));