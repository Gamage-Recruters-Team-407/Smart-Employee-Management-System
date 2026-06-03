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
  const primaryUri = (process.env.MONGO_URI || "").trim();
  const localFallbackUri = (process.env.MONGO_FALLBACK_URI || "mongodb://127.0.0.1:27017/sems_local").trim();
  const isProduction = process.env.NODE_ENV === "production";
  const tryPrimaryInDev = process.env.MONGO_TRY_PRIMARY_IN_DEV === "true";
  const connectionAttempts = [];

  if (isProduction) {
    if (primaryUri) {
      connectionAttempts.push({ uri: primaryUri, label: "primary" });
    }
  } else {
    if (primaryUri && tryPrimaryInDev) {
      connectionAttempts.push({ uri: primaryUri, label: "primary" });
    }
    if (localFallbackUri && localFallbackUri !== primaryUri) {
      connectionAttempts.push({ uri: localFallbackUri, label: "local fallback" });
    }
    if (primaryUri && !tryPrimaryInDev) {
      console.warn("Skipping primary MongoDB URI in development. Set MONGO_TRY_PRIMARY_IN_DEV=true to use it.");
    }
  }

  let lastError = null;
  for (const attempt of connectionAttempts) {
    try {
      await connectWithUri(attempt.uri, attempt.label);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`MongoDB ${attempt.label} connection failed: ${error.message}`);
    }
  }

  if (!isProduction) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    inMemoryServer = await MongoMemoryServer.create();
    await connectWithUri(inMemoryServer.getUri(), "in-memory fallback");
    registerCleanupHandlers();
    console.warn("Using in-memory MongoDB because configured database is unreachable.");
    return;
  }

  throw lastError || new Error("No MongoDB connection URI available.");
};