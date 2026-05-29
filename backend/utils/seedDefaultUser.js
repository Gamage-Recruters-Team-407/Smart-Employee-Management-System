import bcrypt from "bcryptjs";
import User from "../models/User.js";

const DEFAULT_ADMIN = {
  name: "Admin User",
  email: "admin@sems.com",
  password: "admin123",
  role: "Admin",
};

export const seedDefaultUser = async () => {
  const hashed = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  const existing = await User.findOne({ email: DEFAULT_ADMIN.email }).select("+password");

  if (existing) {
    const valid = existing.password
      ? await bcrypt.compare(DEFAULT_ADMIN.password, existing.password)
      : false;
    if (!valid) {
      existing.password = hashed;
      existing.role = DEFAULT_ADMIN.role;
      await existing.save();
      console.log("Default admin password reset to admin123");
    }
    return;
  }

  await User.create({
    name: DEFAULT_ADMIN.name,
    email: DEFAULT_ADMIN.email,
    password: hashed,
    role: DEFAULT_ADMIN.role,
  });

  console.log(
    `Default admin created: ${DEFAULT_ADMIN.email} / ${DEFAULT_ADMIN.password}`
  );
};
