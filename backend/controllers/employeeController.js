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

/**
 * @desc Get currently logged in employee profile
 * @route GET /api/employees/me
 */
export const getMyProfile = async (req, res) => {
  try {
    let employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      // Auto-create profile if missing
      const employeeCount = await Employee.countDocuments();
      const newEmpId = `emp-${String(employeeCount + 1).padStart(3, '0')}`;
      
      const names = (req.user.name || "Test User").split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'User';

      employee = new Employee({
        employeeId: newEmpId,
        firstName,
        lastName,
        email: req.user.email,
        joiningDate: new Date(),
        status: "Active",
      });
      await employee.save();
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};
