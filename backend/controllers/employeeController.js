import Employee from "../models/Employee.js";
import generateEmployeeId from "../utils/generateEmployeeId.js";
import fs from "fs";
import path from "path";

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

    // Validate required fields
    if (!firstName || !String(firstName).trim()) {
      return res.status(400).json({ success: false, message: "First name is required." });
    }
    if (!lastName || !String(lastName).trim()) {
      return res.status(400).json({ success: false, message: "Last name is required." });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

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
      profilePhoto: req.body.profilePhoto || null,
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
 *
 * Supports the following optional query parameters (can be combined):
 *   ?search=value       — case-insensitive regex search across firstName, lastName, email
 *   ?department=value   — exact (case-insensitive) match on department
 *   ?designation=value  — exact (case-insensitive) match on designation
 */
export const getEmployees = async (req, res) => {
  try {
    const { search, department, designation, status } = req.query;
    const query = {};

    // Case-insensitive search across firstName, lastName, and email
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    // Exact (case-insensitive) match on department
    if (department && department.trim()) {
      query.department = { $regex: new RegExp(`^${department.trim()}$`, "i") };
    }

    // Exact (case-insensitive) match on designation
    if (designation && designation.trim()) {
      query.designation = { $regex: new RegExp(`^${designation.trim()}$`, "i") };
    }

    // Exact match on status
    if (status && status.trim()) {
      query.status = status.trim();
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

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

/**
 * PUT /api/employees/:id
 * Update all editable fields of an employee.
 * NOTE: employeeId is NOT editable and is always excluded from updates.
 * Returns the updated employee document.
 * Returns 404 if the employee is not found.
 * Returns 409 if the new email belongs to a different employee.
 */
export const updateEmployee = async (req, res) => {
  try {
    // Guard against missing body (e.g. request sent with no Content-Type / no body)
    const body = req.body || {};

    // Destructure only editable fields — employeeId is intentionally excluded
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
    } = body;

    // Build update payload with only the fields that were actually provided
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (designation !== undefined) updateData.designation = designation;
    if (salary !== undefined) updateData.salary = salary;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (address !== undefined) updateData.address = address;
    if (documents !== undefined) updateData.documents = documents;
    if (status !== undefined) updateData.status = status;
    if (req.body.profilePhoto !== undefined) updateData.profilePhoto = req.body.profilePhoto;

    // Handle email: normalise and check for duplicates among OTHER employees
    if (email !== undefined) {
      const normalizedEmail =
        typeof email === "string" ? email.toLowerCase().trim() : email;

      const duplicate = await Employee.findOne({
        email: normalizedEmail,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another employee with this email already exists.",
        });
      }

      updateData.email = normalizedEmail;
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("updateEmployee error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format.",
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error.",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while updating employee.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/employees/:id
 * Permanently remove an employee from the database.
 * Returns a descriptive success message or 404 if the employee is not found.
 */
export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Employee '${deletedEmployee.firstName} ${deletedEmployee.lastName}' (${deletedEmployee.employeeId}) has been permanently deleted.`,
    });
  } catch (error) {
    console.error("deleteEmployee error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while deleting employee.",
      error: error.message,
    });
  }
};

/**
 * POST /api/employees/:id/photo
 * Upload or replace the profile photo for an employee.
 * Expects multipart/form-data with field name "photo".
 */
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    // Delete old photo if it exists
    if (employee.profilePhoto) {
      const oldPath = path.join(process.cwd(), employee.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoPath = `uploads/${req.file.filename}`.replace(/\\/g, "/");
    employee.profilePhoto = photoPath;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("uploadProfilePhoto error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while uploading profile photo.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/employees/bulk
 * Permanently remove multiple employees from the database in one request.
 * Expects body: { ids: ["mongoId1", "mongoId2", ...] }
 */
export const bulkDeleteEmployees = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty array of employee IDs is required.",
      });
    }

    const result = await Employee.deleteMany({ _id: { $in: ids } });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} employee(s) deleted successfully.`,
    });
  } catch (error) {
    console.error("bulkDeleteEmployees error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while bulk deleting employees.",
      error: error.message,
    });
  }
};
