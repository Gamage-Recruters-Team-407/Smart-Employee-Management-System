import mongoose from "mongoose";
import dns from "dns";

// Force Google DNS to fix SRV lookup failures on Windows
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
