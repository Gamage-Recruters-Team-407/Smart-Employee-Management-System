import mongoose from "mongoose";
import dns from "dns";

// Fix SRV lookup issues on some Windows systems
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

let inMemoryServer = null;
let cleanupRegistered = false;

const stopInMemoryServer = async () => {
  if (!inMemoryServer) {
    return;
  }

  try {
    await inMemoryServer.stop();
  } finally {
    inMemoryServer = null;
  }
};

const registerCleanupHandlers = () => {
  if (cleanupRegistered) {
    return;
  }

  cleanupRegistered = true;

  process.once("SIGINT", async () => {
    await stopInMemoryServer();
    process.exit(0);
  });

  process.once("SIGTERM", async () => {
    await stopInMemoryServer();
    process.exit(0);
  });
};

const connectWithUri = async (uri, label) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 });
  console.log(`MongoDB Connected (${label}):`, mongoose.connection.name);
};

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed.", err);
    process.exit(1);
  }
};