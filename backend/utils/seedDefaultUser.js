import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import generateEmployeeId from "./generateEmployeeId.js";

const DEFAULT_ADMIN = {
  name: "Admin User",
  email: "admin@sems.com",
  password: "admin123",
  role: "Admin",
};

const DEFAULT_HR_MANAGER = {
  name: "HR Manager",
  email: "hr.manager@sems.com",
  password: "hr123456",
  role: "Employee",
  department: "HR",
  designation: "Manager",
};

const seedHrManager = async () => {
  const hashed = await bcrypt.hash(DEFAULT_HR_MANAGER.password, 10);
  let user = await User.findOne({ email: DEFAULT_HR_MANAGER.email }).select("+password");

  if (!user) {
    user = await User.create({
      name: DEFAULT_HR_MANAGER.name,
      email: DEFAULT_HR_MANAGER.email,
      password: hashed,
      role: DEFAULT_HR_MANAGER.role,
    });
    console.log(
      `Default HR Manager user: ${DEFAULT_HR_MANAGER.email} / ${DEFAULT_HR_MANAGER.password}`
    );
  }

  const employeeExists = await Employee.findOne({ email: DEFAULT_HR_MANAGER.email });
  if (!employeeExists) {
    const newId = await generateEmployeeId();
    await Employee.create({
      employeeId: newId,
      firstName: "HR",
      lastName: "Manager",
      email: DEFAULT_HR_MANAGER.email,
      department: DEFAULT_HR_MANAGER.department,
      designation: DEFAULT_HR_MANAGER.designation,
      joiningDate: new Date(),
      status: "Active",
    });
    console.log("Default HR Manager employee profile created (department HR, designation Manager)");
  }
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
    await seedHrManager();
    await normalizeAllEmployeeIds();
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

  await seedHrManager();
  await normalizeAllEmployeeIds();
};

const normalizeAllEmployeeIds = async () => {
  try {
    const employees = await Employee.find({});
    for (const emp of employees) {
      if (!emp.employeeId) continue;
      const isStandardLowercase = /^emp-\d{3,}$/.test(emp.employeeId);
      if (!isStandardLowercase) {
        const lowered = emp.employeeId.toLowerCase();
        const isLoweredStandard = /^emp-\d{3,}$/.test(lowered);
        const collision = await Employee.findOne({ _id: { $ne: emp._id }, employeeId: lowered });

        if (isLoweredStandard && !collision) {
          console.log(`Normalized ID from ${emp.employeeId} to ${lowered}`);
          emp.employeeId = lowered;
          await emp.save();
        } else {
          const freshId = await generateEmployeeId();
          console.log(`Reassigned non-standard ID ${emp.employeeId} to ${freshId}`);
          emp.employeeId = freshId;
          await emp.save();
        }
      }
    }
  } catch (err) {
    console.warn("Normalize employee IDs error:", err.message);
  }
};
