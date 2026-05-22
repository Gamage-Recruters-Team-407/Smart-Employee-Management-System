import Employee from "../models/Employee.js";
import { generateEmployeeId } from "../utils/generateEmployeeId.js";

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new employee
// @route   POST /api/employees
// @access  Public
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

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee with this email already exists." });
    }

    const employeeId = await generateEmployeeId();

    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      salary: salary || 0,
      joiningDate: joiningDate || new Date(),
      address,
      documents: documents || [],
      status: status || "Active",
    });

    const savedEmployee = await employee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Public
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    res.status(200).json({ message: "Employee deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
