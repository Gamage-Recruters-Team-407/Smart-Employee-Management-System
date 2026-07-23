import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import generateEmployeeId from "./generateEmployeeId.js";

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();

/** Find employee by email case-insensitive. */
export const findEmployeeByEmail = async (email) => {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  let employee = await Employee.findOne({ email: normalized });

  if (employee) {
    return employee;
  }

  return Employee.findOne({
    email: {
      $regex: new RegExp(
        `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i"
      ),
    },
  });
};

const generateUniqueEmployeeId = async () => {
  return generateEmployeeId();
};

/**
 * Resolve Employee record for logged-in User.
 * When user registers, Employee.userId will save User._id.
 */
export const resolveEmployeeForAuthUser = async (
  authUser,
  { createIfMissing = true } = {}
) => {
  if (!authUser?.email) {
    return null;
  }

  const email = normalizeEmail(authUser.email);
  const userObjectId = authUser?._id;
  const userRole = authUser?.role || "Employee";

  // 1. First find employee by userId
  if (userObjectId && mongoose.Types.ObjectId.isValid(userObjectId)) {
    const employeeByUserId = await Employee.findOne({
      userId: userObjectId,
    });

    if (employeeByUserId) {
      let needSave = false;

      // Update role from User to Employee
      if (employeeByUserId.role !== userRole) {
        employeeByUserId.role = userRole;
        needSave = true;
      }

      // Safety: make sure email is normalized
      if (employeeByUserId.email !== email) {
        employeeByUserId.email = email;
        needSave = true;
      }

      if (needSave) {
        await employeeByUserId.save();
      }

      return employeeByUserId;
    }
  }

  // 2. Then find employee by email
  let employee = await findEmployeeByEmail(email);

  // 3. If employee already exists, attach userId and role
  if (employee) {
    let needSave = false;

    if (!employee.userId && userObjectId) {
      employee.userId = userObjectId;
      needSave = true;
    }

    if (employee.role !== userRole) {
      employee.role = userRole;
      needSave = true;
    }

    if (needSave) {
      await employee.save();
    }

    return employee;
  }

  if (!createIfMissing) {
    return null;
  }

  const names = (authUser.name || "Employee User").trim().split(/\s+/);
  const firstName = names[0] || "Employee";
  const lastName = names.slice(1).join(" ") || "User";
  const employeeId = await generateUniqueEmployeeId();

  try {
    employee = await Employee.create({
      userId: userObjectId || null,
      role: userRole,
      employeeId,
      firstName,
      lastName,
      email,
      joiningDate: new Date(),
      status: "Active",
    });

    return employee;
  } catch (err) {
    if (err?.code === 11000) {
      employee = await findEmployeeByEmail(email);

      if (employee) {
        let needSave = false;

        if (!employee.userId && userObjectId) {
          employee.userId = userObjectId;
          needSave = true;
        }

        if (employee.role !== userRole) {
          employee.role = userRole;
          needSave = true;
        }

        if (needSave) {
          await employee.save();
        }

        return employee;
      }
    }

    throw err;
  }
};

export const getEmployeeIdForRequest = async (req) => {
  const mockId = req.headers["x-mock-employee-id"];

  if (mockId) {
    const employee = await Employee.findById(mockId);
    return employee?._id || null;
  }

  if (!req.user?.email) {
    return null;
  }

  const employee = await resolveEmployeeForAuthUser(req.user, {
    createIfMissing: true,
  });

  return employee?._id || null;
};