import Employee from "../models/Employee.js";

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();

/** Find employee by email (case-insensitive). */
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
    email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  });
};

const generateUniqueEmployeeId = async () => {
  const count = await Employee.countDocuments();
  for (let offset = 1; offset <= 20; offset += 1) {
    const candidate = `emp-${String(count + offset).padStart(3, "0")}`;
    const taken = await Employee.exists({ employeeId: candidate });
    if (!taken) {
      return candidate;
    }
  }
  return `emp-${Date.now()}`;
};

/**
 * Resolve the Employee record for a logged-in User (auth account).
 * Tasks are assigned to Employee._id — never use User._id for task queries.
 */
export const resolveEmployeeForAuthUser = async (authUser, { createIfMissing = true } = {}) => {
  if (!authUser?.email) {
    return null;
  }

  const email = normalizeEmail(authUser.email);
  let employee = await findEmployeeByEmail(email);

  if (employee || !createIfMissing) {
    return employee;
  }

  const names = (authUser.name || "Employee User").trim().split(/\s+/);
  const firstName = names[0] || "Employee";
  const lastName = names.slice(1).join(" ") || "User";
  const employeeId = await generateUniqueEmployeeId();

  try {
    employee = await Employee.create({
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

  const employee = await resolveEmployeeForAuthUser(req.user, { createIfMissing: true });
  return employee?._id || null;
};
