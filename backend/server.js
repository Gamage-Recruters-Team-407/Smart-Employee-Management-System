import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import performanceRoutes from "./routes/performanceRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< refs/remotes/origin/Fawdhan
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));
=======
app.use("/api/performance", performanceRoutes);

const connectWithFallback = async () => {
  const uri = process.env.MONGO_URI;
  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log("MongoDB Connected (primary)");
      return;
    }
    throw new Error("No MONGO_URI provided");
  } catch (err) {
    console.warn("Primary MongoDB connection failed:", err.message);
    console.warn("Starting in-memory MongoDB for local development...");
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri);
    app.locals.mongod = mongod;
    console.log("Connected to in-memory MongoDB");
  }
};
>>>>>>> local

connectWithFallback();

app.get("/", (req, res) => res.send("Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
