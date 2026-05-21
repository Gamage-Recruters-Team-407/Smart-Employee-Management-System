import Employee from "../models/Employee.js";

/**
 * Generates the next sequential employee ID in the format EMP-001, EMP-002, etc.
 * Queries the last created employee, extracts the numeric part, increments it,
 * then pads to 3 digits.
 *
 * @returns {Promise<string>} The next employee ID string (e.g. "EMP-005")
 */
const generateEmployeeId = async () => {
  // Find the most recently created employee that has an employeeId
  const lastEmployee = await Employee.findOne({ employeeId: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .select("employeeId");

  if (!lastEmployee || !lastEmployee.employeeId) {
    // No employees yet — start from EMP-001
    return "EMP-001";
  }

  // Extract the numeric portion from "EMP-XXX"
  const parts = lastEmployee.employeeId.split("-");
  const lastNumber = parseInt(parts[1], 10);

  if (isNaN(lastNumber)) {
    return "EMP-001";
  }

  // Increment and pad with leading zeros to at least 3 digits
  const nextNumber = lastNumber + 1;
  const padded = String(nextNumber).padStart(3, "0");

  return `EMP-${padded}`;
};

export default generateEmployeeId;
