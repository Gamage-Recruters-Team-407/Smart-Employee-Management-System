const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const User = require("./models/User");

async function createUser() {
  const hashed = await bcrypt.hash("test1234", 10);
  await User.create({
    name: "Kaveesha",
    email: "test@test.com",
    password: hashed,
    role: "employee"
  });
  console.log("✅ User created!");
  process.exit();
}

createUser();