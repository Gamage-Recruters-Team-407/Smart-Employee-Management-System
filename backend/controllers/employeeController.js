import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import Leave from "../models/Leave.js";
import generateEmployeeId from "../utils/generateEmployeeId.js";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";

// ─── HELPERS & CONFIGURATIONS ───────────────────────────────────────────────

const SORTABLE_FIELDS = [
  "firstName", "lastName", "email", "department", "designation",
  "salary", "joiningDate", "status", "createdAt", "employeeId",
];

/** Fire-and-forget audit log creation — response එක block නොකර පසුබිමෙන් ක්‍රියාත්මක වේ. */
const logAudit = (entry) =>
  AuditLog.create(entry).catch((err) => console.error("Audit log error:", err));

/** වෙනස් කරන ලද fields ඇසුරෙන් summary එකක් ගොඩනගයි. */
const buildSummary = (changes) => {
  if (!changes || changes.length === 0) return "No fields changed.";
  return `Updated ${changes.map((c) => c.field).join(", ")}`;
};

// ─── 1. CREATE EMPLOYEE ───────────────────────────────────────────────────────

export const createEmployee = async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone, department, designation,
      salary, joiningDate, address, documents, status,
    } = req.body;

    // අනිවාර්යය Fields පිරික්සීම
    if (!firstName?.trim()) return res.status(400).json({ success: false, message: "First name is required." });
    if (!lastName?.trim()) return res.status(400).json({ success: false, message: "Last name is required." });
    if (!email?.trim()) return res.status(400).json({ success: false, message: "Email address is required." });

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }

    // එකම ඊමේල් එකෙන් වෙනත් අයෙක් සිටීදැයි බැලීම
    const existing = await Employee.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "An employee with this email already exists." });
    }

    // Custom ID එකක් සාදා ගැනීම
    const employeeId = await generateEmployeeId();

    const employee = await Employee.create({
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone,
      department,
      designation,
      salary: salary ? Number(salary) : 0,
      joiningDate: joiningDate || new Date(),
      address,
      documents,
      status: status || "Active",
      profilePhoto: req.body.profilePhoto || null,
    });

    logAudit({
      employeeId: employee._id,
      action: "created",
      performedBy: req.user?.name || "System",
      summary: `Employee ${employee.firstName} ${employee.lastName} (${employee.employeeId}) created.`,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("createEmployee error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }
    return res.status(500).json({ success: false, message: "Server error while creating employee.", error: error.message });
  }
};

// ─── 2. GET ALL EMPLOYEES (With Server Pagination, Sort & Filters) ────────────

export const getEmployees = async (req, res) => {
  try {
    const {
      search, department, designation, status,
      salaryMin, salaryMax, joiningFrom, joiningTo,
      page: pageStr, limit: limitStr, sortField, sortDir,
    } = req.query;

    const query = {};

    // Dynamic Search Filter
    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
      ];
    }

    // Department multi-select Filter
    if (department?.trim()) {
      const departments = department.split(",").map((d) => d.trim()).filter(Boolean);
      query.department = { $in: departments.map((d) => new RegExp(`^${d}$`, "i")) };
    }

    // Designation multi-select Filter
    if (designation?.trim()) {
      const designations = designation.split(",").map((d) => d.trim()).filter(Boolean);
      query.designation = { $in: designations.map((d) => new RegExp(`^${d}$`, "i")) };
    }

    if (status?.trim()) {
      query.status = status.trim();
    }

    // Salary Range Filter
    if (salaryMin || salaryMax) {
      query.salary = {};
      if (salaryMin) query.salary.$gte = Number(salaryMin);
      if (salaryMax) query.salary.$lte = Number(salaryMax);
    }

    // Date Range Filter
    if (joiningFrom || joiningTo) {
      query.joiningDate = {};
      if (joiningFrom) query.joiningDate.$gte = new Date(joiningFrom);
      if (joiningTo) query.joiningDate.$lte = new Date(joiningTo);
    }

    // Pagination Calculations
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 10));
    const skip = (page - 1) * limit;

    const safeSortField = SORTABLE_FIELDS.includes(sortField) ? sortField : "createdAt";
    const sortOrder = sortDir === "asc" ? 1 : -1;

    // MongoDB Aggregation Pipeline: Filter, Sort, Tasks-Lookup සහ Pagination එකවර සිදු කරයි
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [employees, totalCount] = await Promise.all([
      Employee.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "tasks",
            localField: "_id",
            foreignField: "assignedTo",
            as: "assignedTasks",
          },
        },
        // ─── Leave Lookup: අද දින approved leave ද බලයි ───────────────────────
        {
          $lookup: {
            from: "leaves",
            let: { empId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$employee", "$$empId"] },
                      { $eq: ["$status", "Approved"] },
                      { $lte: ["$startDate", todayEnd] },
                      { $gte: ["$endDate", today] },
                    ],
                  },
                },
              },
              { $limit: 1 },
            ],
            as: "activeLeaves",
          },
        },
        {
          $addFields: {
            taskCount: { $size: "$assignedTasks" },
            // Frontend එකේ සාමාන්‍ය භාවිතය සඳහා formatted full name එක සකසයි
            name: { $trim: { input: { $concat: ["$firstName", " ", "$lastName"] } } },
            // අද දින approved leave ඇත්නම් true වේ
            isOnLeaveToday: { $gt: [{ $size: "$activeLeaves" }, 0] },
          },
        },
        { $project: { assignedTasks: 0, activeLeaves: 0 } },
        { $sort: { [safeSortField]: sortOrder } },
        { $skip: skip },
        { $limit: limit },
      ]),
      Employee.countDocuments(query),
    ]);

    // ─── DB Status Sync: isOnLeaveToday flag අනුව bulk update ─────────────────
    // Aggregation pipeline ෙකෙ DB change කරන්න නෑ, ඉතින් result ලැබුණාට පස්සේ update
    const toSetOnLeave = employees
      .filter((e) => e.isOnLeaveToday && e.status !== "On Leave")
      .map((e) => e._id);

    const toRestoreActive = employees
      .filter((e) => !e.isOnLeaveToday && e.status === "On Leave")
      .map((e) => e._id);

    if (toSetOnLeave.length > 0 || toRestoreActive.length > 0) {
      const bulkOps = [];

      if (toSetOnLeave.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: { _id: { $in: toSetOnLeave } },
            update: { $set: { status: "On Leave" } },
          },
        });
      }

      if (toRestoreActive.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: { _id: { $in: toRestoreActive } },
            update: { $set: { status: "Active" } },
          },
        });
      }

      // Fire-and-forget: response block නොකර background ෙකෙ update කරනවා
      Employee.bulkWrite(bulkOps).catch((err) =>
        console.error("[leave-sync] Bulk status update error:", err.message)
      );

      // In-memory patch: response ෙකෙ updated status immediately reflect කරනවා
      employees.forEach((e) => {
        if (e.isOnLeaveToday && e.status !== "On Leave") e.status = "On Leave";
        else if (!e.isOnLeaveToday && e.status === "On Leave") e.status = "Active";
      });
    }

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (error) {
    console.error("getEmployees error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching employees.", error: error.message });
  }
};

// ─── 3. GET EMPLOYEE BY ID ───────────────────────────────────────────────────

export const getEmployeeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID format." });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // ─── Leave Check: අද approved leave ඇද්ද? ─────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeLeave = await Leave.findOne({
      employee: employee._id,
      status: "Approved",
      startDate: { $lte: todayEnd },
      endDate: { $gte: today },
    });

    const isOnLeaveToday = !!activeLeave;

    // DB status auto-update: leave ඇත්නම් "On Leave", නැත්නම් "Active" ලෙස restore
    if (isOnLeaveToday && employee.status !== "On Leave") {
      employee.status = "On Leave";
      await employee.save();
    } else if (!isOnLeaveToday && employee.status === "On Leave") {
      // Leave ඉවර වුණොත් නැවත "Active" ලෙස restore කරනවා
      employee.status = "Active";
      await employee.save();
    }

    return res.status(200).json({ success: true, data: employee, isOnLeaveToday });
  } catch (error) {
    console.error("getEmployeeById error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching employee.", error: error.message });
  }
};

// ─── 4. GET EMPLOYEE TASKS ───────────────────────────────────────────────────

export const getEmployeeTasks = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee ID" });
    }
    // <<<<<<< HEAD
    //     const employee = await Employee.findById(req.params.id);
    //     if (!employee) {
    //       return res.status(404).json({ message: "Employee not found" });
    //     }
    // =======

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const tasks = await Task.find({ assignedTo: req.params.id }).sort({
      dueDate: 1,
      updatedAt: -1,
    });
    // <<<<<<< HEAD
    //     res.json(tasks);
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // };
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
    //       phone,
    //       department,
    //       designation,
    //       salary,
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
    //   }
    // };
    // =======

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── 5. UPDATE EMPLOYEE (With Audit Log Diffs - Email Immutable) ───────────────

export const updateEmployee = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid employee ID format." });
    }

    const oldEmployee = await Employee.findById(req.params.id);
    if (!oldEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const updateData = { ...req.body };

    // 🔒 SECURITY GUARDRAIL: Strip email field entirely out of the update payload.
    // This silently drops any email change requests, allowing all other fields to update safely.
    if ("email" in updateData) {
      delete updateData.email;
    }

    // 🔒 SECURITY GUARDRAIL: Strip role field unless requester is Admin.
    if (req.user?.role !== "Admin" && "role" in updateData) {
      delete updateData.role;
    }

    // Process and cast other valid numeric fields safely
    if (updateData.salary !== undefined && updateData.salary !== "") {
      updateData.salary = Number(updateData.salary);
    }

    // Update everything else safely
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    );

    // 🔄 Sync linked User name and role if updated
    if (updatedEmployee.userId) {
      const userUpdate = {};
      if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
        userUpdate.name = `${updatedEmployee.firstName} ${updatedEmployee.lastName}`.trim();
      }
      if (updateData.role !== undefined) {
        userUpdate.role = updatedEmployee.role;
      }

      if (Object.keys(userUpdate).length > 0) {
        await User.findByIdAndUpdate(updatedEmployee.userId, { $set: userUpdate });
      }
    }

    // Track Audit Log changes for the allowed modified parameters
    const changes = [];
    for (const key of Object.keys(updateData)) {
      if (String(oldEmployee[key]) !== String(updatedEmployee[key])) {
        changes.push({
          field: key,
          oldValue: oldEmployee[key],
          newValue: updatedEmployee[key],
        });
      }
    }

    if (changes.length > 0) {
      logAudit({
        employeeId: updatedEmployee._id,
        action: "updated",
        performedBy: req.user?.name || "System",
        changes,
        summary: buildSummary(changes),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employee profile updated successfully. (Note: Email modifications are restricted)",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("updateEmployee error:", error);
    return res.status(500).json({ success: false, message: "Server error while updating employee.", error: error.message });
  }
};

// ─── 6. DELETE EMPLOYEE ───────────────────────────────────────────────────────

export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    logAudit({
      employeeId: deletedEmployee._id,
      action: "deleted",
      performedBy: req.user?.name || "System",
      summary: `Employee '${deletedEmployee.firstName} ${deletedEmployee.lastName}' (${deletedEmployee.employeeId}) permanently deleted.`,
    });

    return res.status(200).json({ success: true, message: "Employee deleted successfully." });
  } catch (error) {
    console.error("deleteEmployee error:", error);
    return res.status(500).json({ success: false, message: "Server error while deleting employee.", error: error.message });
  }
};

// ─── 7. BULK DELETE EMPLOYEES ─────────────────────────────────────────────────

export const bulkDeleteEmployees = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "A non-empty array of employee IDs is required." });
    }

    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid IDs format: ${invalidIds.join(", ")}` });
    }

    const result = await Employee.deleteMany({ _id: { $in: ids } });
    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} employee(s) bulk deleted successfully.`,
    });
  } catch (error) {
    console.error("bulkDeleteEmployees error:", error);
    return res.status(500).json({ success: false, message: "Server error while bulk deleting employees.", error: error.message });
  }
};

// ─── 8. UPLOAD PROFILE PHOTO ──────────────────────────────────────────────────

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image file provided." });

    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found." });

    // පැරණි profile ඡායාරූපය storage එකෙන් මකා දැමීම
    if (employee.profilePhoto) {
      const oldPath = path.join(process.cwd(), employee.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoPath = `uploads/${req.file.filename}`.replace(/\\/g, "/");
    employee.profilePhoto = photoPath;
    await employee.save();

    logAudit({
      employeeId: employee._id,
      action: "photo_uploaded",
      performedBy: req.user?.name || "System",
      summary: "Profile photo uploaded successfully.",
    });

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("uploadProfilePhoto error:", error);
    return res.status(500).json({ success: false, message: "Server error while uploading profile photo.", error: error.message });
  }
};

// ─── 9. GET EMPLOYEE LIGHTWEIGHT STATS (For Summary Cards) ───────────────────

export const getEmployeeStats = async (req, res) => {
  try {
    // Leave table ෙකෙන් අද approved leave ඇති employees ගේ unique IDs ගනිමු
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [result, onLeaveTodayDocs] = await Promise.all([
      Employee.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } },
            // DB status "On Leave" ලෙස manually set කළ employees
            onLeaveStatus: { $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] } },
            terminated: { $sum: { $cond: [{ $eq: ["$status", "Terminated"] }, 1, 0] } },
          },
        },
      ]),
      // Leave table ෙකෙන් අද approved leave ඇති unique employees
      Leave.distinct("employee", {
        status: "Approved",
        startDate: { $lte: todayEnd },
        endDate: { $gte: today },
      }),
    ]);

    // aggregate() returns an ARRAY — result[0] ෙකෙ object ගන්නා
    const base = result[0] || { total: 0, onLeaveStatus: 0, active: 0, inactive: 0, terminated: 0 };

    // DB status "On Leave" + Leave table ෙකෙන් on leave — unique ගණනක් ලෙස
    // onLeaveTodayDocs.length = leave table ෙකෙන් ආ count (DB status change නොකළ ඒවා ද ඇතුළු)
    const onLeaveCount = Math.max(base.onLeaveStatus, onLeaveTodayDocs.length);

    return res.status(200).json({
      success: true,
      data: {
        total: base.total,
        active: base.active,
        inactive: base.inactive,
        onLeave: onLeaveCount,
        terminated: base.terminated,
      },
    });
  } catch (error) {
    console.error("getEmployeeStats error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching stats.", error: error.message });
  }
};

// ─── 10. GET DETAILED STATS (For Analytics Charts) ──────────────────────────

export const getEmployeeStatsDetailed = async (req, res) => {
  try {
    const [result] = await Employee.aggregate([
      {
        $facet: {
          departmentCounts: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          salaryDistribution: [
            {
              $bucket: {
                groupBy: "$salary",
                boundaries: [0, 25000, 50000, 75000, 100000, 10000001],
                default: "Other",
                output: { count: { $sum: 1 } },
              },
            },
          ],
          salaryStats: [
            {
              $group: {
                _id: null,
                avgSalary: { $avg: "$salary" },
                minSalary: { $min: "$salary" },
                maxSalary: { $max: "$salary" },
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("getEmployeeStatsDetailed error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching detailed stats.", error: error.message });
  }
};

// ─── 11. CSV BULK IMPORT EMPLOYEES ───────────────────────────────────────────

export const importEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({ success: false, message: "A non-empty array of employee data is required." });
    }

    let created = 0;
    const errors = [];

    for (let i = 0; i < employees.length; i++) {
      try {
        const row = employees[i];
        const employeeId = await generateEmployeeId();

        await Employee.create({
          employeeId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: String(row.email).toLowerCase().trim(),
          phone: row.phone || "",
          department: row.department || "",
          designation: row.designation || "",
          salary: row.salary ? Number(row.salary) : 0,
          joiningDate: row.joiningDate || undefined,
          address: row.address || "",
          status: row.status || "Active",
        });
        created++;
      } catch (error) {
        errors.push({ index: i, reason: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      data: { created, skipped: employees.length - created, errors },
    });
  } catch (error) {
    console.error("importEmployees error:", error);
    return res.status(500).json({ success: false, message: "Server error while importing employees.", error: error.message });
  }
};

// ─── 12. GET EMPLOYEE AUDIT HISTORY LOGS ─────────────────────────────────────

export const getEmployeeHistory = async (req, res) => {
  try {
    const logs = await AuditLog.find({ employeeId: req.params.id }).sort({ timestamp: -1 });
    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("getEmployeeHistory error:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching history.", error: error.message });
  }
};

// ─── 13. GET LOGGED IN EMPLOYEE PROFILE ──────────────────────────────────────

export const getMyProfile = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, { createIfMissing: true });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found for this account." });
    }

    // ─── Leave Check: getEmployeeById ෙකෙ logic ෙකෙකෙම ─────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeLeave = await Leave.findOne({
      employee: employee._id,
      status: "Approved",
      startDate: { $lte: todayEnd },
      endDate: { $gte: today },
    });

    const isOnLeaveToday = !!activeLeave;

    if (isOnLeaveToday && employee.status !== "On Leave") {
      employee.status = "On Leave";
      await employee.save();
    } else if (!isOnLeaveToday && employee.status === "On Leave") {
      employee.status = "Active";
      await employee.save();
    }

    return res.status(200).json(employee);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};