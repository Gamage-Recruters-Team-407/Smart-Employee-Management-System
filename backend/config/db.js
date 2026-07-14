import mongoose from "mongoose";
import dns from "dns";

// Only override DNS servers in local Windows development, not on Vercel/AWS Lambda
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      process.exit(1);
    }
    throw err;
  }
};