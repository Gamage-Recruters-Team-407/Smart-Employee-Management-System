import Employee from "../models/Employee.js";

/**
 * @desc Get all employees
 * @route GET /api/employees
 */
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    
    // Map database properties to match the frontend 'name' field
    const formatted = employees.map((emp) => {
      const e = emp.toObject();
      e.name = `${e.firstName || ""} ${e.lastName || ""}`.trim();
      return e;
    });
    
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error: error.message });
  }
};

/**
 * @desc Create a new employee
 * @route POST /api/employees
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate,
      address,
    } = req.body;

    if (!employeeId || !firstName || !lastName || !email) {
      return res.status(400).json({
        message: "employeeId, firstName, lastName, and email are required.",
      });
    }

    const employee = new Employee({
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      department,
      designation,
      salary,
      joiningDate: joiningDate || new Date(),
      address,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error creating employee", error: error.message });
  }
};
