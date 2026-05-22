import Employee from "../models/Employee.js";

export const generateEmployeeId = async () => {
  try {
    const lastEmployee = await Employee.findOne().sort({ createdAt: -1 });
    if (!lastEmployee || !lastEmployee.employeeId) {
      return "EMP-0001";
    }
    const match = lastEmployee.employeeId.match(/EMP-(\d+)/);
    if (!match) {
      return "EMP-0001";
    }
    const nextNum = parseInt(match[1]) + 1;
    return `EMP-${nextNum.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating employee ID, using fallback:", error);
    return `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  }
};
