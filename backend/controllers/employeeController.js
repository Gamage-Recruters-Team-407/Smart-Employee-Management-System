import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import mongoose from "mongoose";

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
        },
      },
      { $project: { assignedTasks: 0 } },
      { $sort: { firstName: 1, lastName: 1 } },
    ]);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
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

    if (!firstName?.trim() || !lastName?.trim()) {
      return res
        .status(400)
        .json({ message: "First name and last name are required" });
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
      joiningDate,
      address,
      status: status || "Active",
    });

    res.status(201).json(employee);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};
