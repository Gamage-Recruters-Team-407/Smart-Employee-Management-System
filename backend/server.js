import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});