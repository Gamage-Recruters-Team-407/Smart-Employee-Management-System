// import Employee from "../models/Employee.js";
// <<<<<<< HEAD

// /**
//  * @desc Get all employees
//  * @route GET /api/employees
//  */
// export const getEmployees = async (req, res) => {
//   try {
//     const employees = await Employee.find({});
    
//     // Map database properties to match the frontend 'name' field
//     const formatted = employees.map((emp) => {
//       const e = emp.toObject();
//       e.name = `${e.firstName || ""} ${e.lastName || ""}`.trim();
//       return e;
//     });
    
//     res.status(200).json(formatted);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching employees", error: error.message });
//   }
// };

// /**
//  * @desc Create a new employee
//  * @route POST /api/employees
//  */
// =======
// import Task from "../models/Task.js";
// import mongoose from "mongoose";

// export const getEmployees = async (req, res) => {
//   try {
//     const employees = await Employee.aggregate([
//       { $match: { status: { $ne: "Inactive" } } },
//       {
//         $lookup: {
//           from: "tasks",
//           localField: "_id",
//           foreignField: "assignedTo",
//           as: "assignedTasks",
//         },
//       },
//       {
//         $addFields: {
//           taskCount: { $size: "$assignedTasks" },
//         },
//       },
//       { $project: { assignedTasks: 0 } },
//       { $sort: { firstName: 1, lastName: 1 } },
//     ]);
//     res.json(employees);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getEmployeeById = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ message: "Invalid employee ID" });
//     }
//     const employee = await Employee.findById(req.params.id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }
//     res.json(employee);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const getEmployeeTasks = async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ message: "Invalid employee ID" });
//     }
//     const employee = await Employee.findById(req.params.id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }
//     const tasks = await Task.find({ assignedTo: req.params.id }).sort({
//       dueDate: 1,
//       updatedAt: -1,
//     });
//     res.json(tasks);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
// export const createEmployee = async (req, res) => {
//   try {
//     const {
//       employeeId,
//       firstName,
//       lastName,
//       email,
//       phone,
//       department,
//       designation,
//       salary,
//       joiningDate,
//       address,
// <<<<<<< HEAD
//     } = req.body;

//     if (!employeeId || !firstName || !lastName || !email) {
//       return res.status(400).json({
//         message: "employeeId, firstName, lastName, and email are required.",
//       });
//     }

//     const employee = new Employee({
//       employeeId,
//       firstName,
//       lastName,
//       email,
// =======
//       status,
//     } = req.body;

//     if (!firstName?.trim() || !lastName?.trim()) {
//       return res
//         .status(400)
//         .json({ message: "First name and last name are required" });
//     }

//     if (!email?.trim()) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     const employee = await Employee.create({
//       employeeId: employeeId?.trim() || `EMP${Date.now()}`,
//       firstName: firstName.trim(),
//       lastName: lastName.trim(),
//       email: email.trim().toLowerCase(),
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
//       phone,
//       department,
//       designation,
//       salary,
// <<<<<<< HEAD
//       joiningDate: joiningDate || new Date(),
//       address,
//     });

//     await employee.save();
//     res.status(201).json(employee);
//   } catch (error) {
//     res.status(500).json({ message: "Error creating employee", error: error.message });
//   }
// };

// /**
//  * @desc Get currently logged in employee profile
//  * @route GET /api/employees/me
//  */
// export const getMyProfile = async (req, res) => {
//   try {
//     let employee = await Employee.findOne({ email: req.user.email });
//     if (!employee) {
//       // Auto-create profile if missing
//       const employeeCount = await Employee.countDocuments();
//       const newEmpId = `emp-${String(employeeCount + 1).padStart(3, '0')}`;
      
//       const names = (req.user.name || "Test User").split(' ');
//       const firstName = names[0];
//       const lastName = names.slice(1).join(' ') || 'User';

//       employee = new Employee({
//         employeeId: newEmpId,
//         firstName,
//         lastName,
//         email: req.user.email,
//         joiningDate: new Date(),
//         status: "Active",
//       });
//       await employee.save();
//     }
//     res.status(200).json(employee);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching profile", error: error.message });
// =======
//       joiningDate,
//       address,
//       status: status || "Active",
//     });

//     res.status(201).json(employee);
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Email already exists" });
//     }
//     res.status(500).json({ message: error.message });
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
//   }
// };
import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import mongoose from "mongoose";

/**
 * @desc Get all active employees with task counts and formatted names
 * @route GET /api/employees
 */
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.aggregate([
      { $match: { status: { $ne: "Inactive" } } },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "assignedTo",
          as: "assignedTasks",
        },
      },
      {
        $addFields: {
          taskCount: { $size: "$assignedTasks" },
          // Frontend එකට අවශ්‍ය පරිදි firstName සහ lastName එකතු කර 'name' සාදයි
          name: { $trim: { input: { $concat: ["$firstName", " ", "$lastName"] } } }
        },
      },
      { $project: { assignedTasks: 0 } },
      { $sort: { firstName: 1, lastName: 1 } },
    ]);
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching employees", error: error.message });
  }
};

/**
 * @desc Get single employee by ID
 * @route GET /api/employees/:id
 */
export const getEmployeeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get tasks assigned to a specific employee
 * @route GET /api/employees/:id/tasks
 */
export const getEmployeeTasks = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const tasks = await Task.find({ assignedTo: req.params.id }).sort({
      dueDate: 1,
      updatedAt: -1,
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      status,
    } = req.body;

    // Validation
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const employee = await Employee.create({
      employeeId: employeeId?.trim() || `EMP${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone,
      department,
      designation,
      salary,
      joiningDate: joiningDate || new Date(),
      address,
      status: status || "Active",
    });

    res.status(201).json(employee);
  } catch (error) {
    // 11000 කියන්නේ MongoDB වල Unique Email එකක් duplicate වුනාම එන error code එකයි
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
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