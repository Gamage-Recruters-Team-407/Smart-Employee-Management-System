import mongoose from "mongoose";
<<<<<<< HEAD
import dns from "dns";

// Force Google DNS to fix SRV lookup failures on Windows
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
=======
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
<<<<<<< HEAD
    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
=======
    console.log("MongoDB Connected:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
