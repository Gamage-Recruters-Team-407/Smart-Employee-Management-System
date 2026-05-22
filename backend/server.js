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
app.use("/api/performance", performanceRoutes);

const connectWithFallback = async () => {
  const uri = process.env.MONGO_URI;
  const primaryOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  };

  try {
    if (!uri) {
      throw new Error("No MONGO_URI provided");
    }

    await mongoose.connect(uri, primaryOptions);
    console.log("MongoDB Connected (primary)");
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

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectWithFallback();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
