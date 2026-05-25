import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { seedDefaultUser } from "./utils/seedDefaultUser.js";
import { seedSamplePayroll } from "./utils/seedSamplePayroll.js";
import payrollRoutes from "./routes/payrollRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await seedDefaultUser();
    await seedSamplePayroll();
  })
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications/reports", reportRoutes);
app.use("/api/payroll", payrollRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});