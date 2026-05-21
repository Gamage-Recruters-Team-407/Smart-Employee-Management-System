import Employee from "../models/Employee.js";
import generateEmployeeId from "../utils/generateEmployeeId.js";

/**
 * POST /api/employees
 * Create a new employee with an auto-generated employee ID.
 * Returns 409 if the email already exists.
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      address,
      documents,
      status,
    } = req.body;

    // Only check duplicate if email is a string
    if (email && typeof email === "string" && email.trim()) {
      const existing = await Employee.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "An employee with this email already exists.",
        });
      }
    }

    const employeeId = await generateEmployeeId();

    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email: email && typeof email === "string" ? email.toLowerCase().trim() : email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      address,
      documents,
      status,
    });

    await employee.save();

    return res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("createEmployee error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating employee.",
      error: error.message,
    });
  }
};

/**
 * GET /api/employees
 * Return all employees sorted newest first.
 */
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("getEmployees error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching employees.",
      error: error.message,
    });
  }
};

/**
 * GET /api/employees/:id
 * Return a single employee by MongoDB _id.
 */
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error("getEmployeeById error:", error);
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while fetching employee.",
      error: error.message,
    });
  }
};
