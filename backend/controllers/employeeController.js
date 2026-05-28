// import Employee from "../models/Employee.js";
// <<<<<<< HEAD
// import AuditLog from "../models/AuditLog.js";
// import generateEmployeeId from "../utils/generateEmployeeId.js";
// import fs from "fs";
// import path from "path";

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// const SORTABLE_FIELDS = [
//   "firstName", "lastName", "email", "department", "designation",
//   "salary", "joiningDate", "status", "createdAt", "employeeId",
// ];

// /** Fire-and-forget audit log creation — never blocks the HTTP response. */
// const logAudit = (entry) =>
//   AuditLog.create(entry).catch((err) => console.error("Audit log error:", err));

// /** Build a human-readable summary from a changes array. */
// const buildSummary = (changes) => {
//   if (!changes || changes.length === 0) return "No fields changed.";
//   const fields = changes.map((c) => c.field);
//   return `Updated ${fields.join(", ")}`;
// };

// // ─── CREATE ───────────────────────────────────────────────────────────────────

// /**
//  * POST /api/employees
//  * Create a new employee with an auto-generated employee ID.
//  */
// export const createEmployee = async (req, res) => {
//   try {
//     const {
//       firstName, lastName, email, phone, department, designation,
//       salary, joiningDate, address, documents, status,
//     } = req.body;

//     // Required fields
//     if (!firstName || !String(firstName).trim())
//       return res.status(400).json({ success: false, message: "First name is required." });
//     if (!lastName || !String(lastName).trim())
//       return res.status(400).json({ success: false, message: "Last name is required." });
//     if (!email || !String(email).trim())
//       return res.status(400).json({ success: false, message: "Email address is required." });

//     // Email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(String(email).trim()))
//       return res.status(400).json({ success: false, message: "Please provide a valid email address." });

//     // Phone
//     if (phone !== undefined && phone !== null && String(phone).trim()) {
//       const phoneTrimmed = String(phone).trim();
//       if (!/^[\d\s+\-()\[\]]+$/.test(phoneTrimmed))
//         return res.status(400).json({ success: false, message: "Phone number contains invalid characters." });
//       const digits = phoneTrimmed.replace(/\D/g, "");
//       if (digits.length < 7 || digits.length > 15)
//         return res.status(400).json({ success: false, message: "Phone number must be between 7 and 15 digits." });
//     }

//     // Salary
//     if (salary !== undefined && salary !== null && salary !== "") {
//       const salaryNum = Number(salary);
//       if (isNaN(salaryNum))
//         return res.status(400).json({ success: false, message: "Salary must be a valid number." });
//       if (salaryNum < 0)
//         return res.status(400).json({ success: false, message: "Salary cannot be negative." });
//       if (salaryNum > 10000000)
//         return res.status(400).json({ success: false, message: "Salary value seems unrealistically high." });
//     }

//     // Joining date
//     if (joiningDate) {
//       const chosenDate = new Date(joiningDate);
//       if (isNaN(chosenDate.getTime()))
//         return res.status(400).json({ success: false, message: "Joining date is not a valid date." });
//       const todayEnd = new Date();
//       todayEnd.setHours(23, 59, 59, 999);
//       if (chosenDate > todayEnd)
//         return res.status(400).json({ success: false, message: "Joining date cannot be in the future." });
//     }

//     // Duplicate email
//     const normalizedEmail = String(email).toLowerCase().trim();
//     const existing = await Employee.findOne({ email: normalizedEmail });
//     if (existing)
//       return res.status(409).json({ success: false, message: "An employee with this email already exists." });

//     const employeeId = await generateEmployeeId();

//     const employee = new Employee({
//       employeeId, firstName, lastName, email: normalizedEmail,
//       phone, department, designation,
//       salary: salary !== undefined && salary !== null && salary !== "" ? Number(salary) : 0,
//       joiningDate, address, documents, status,
//       profilePhoto: req.body.profilePhoto || null,
//     });

//     await employee.save();

//     // Audit log (fire-and-forget)
//     logAudit({
//       employeeId: employee._id,
//       action: "created",
//       performedBy: req.user?.name || "System",
//       summary: `Employee ${firstName} ${lastName} (${employeeId}) created.`,
//     });

//     return res.status(201).json({ success: true, message: "Employee created successfully.", data: employee });
//   } catch (error) {
//     console.error("createEmployee error:", error);
//     if (error.name === "ValidationError")
//       return res.status(400).json({ success: false, message: "Validation error.", error: error.message });
//     return res.status(500).json({ success: false, message: "Server error while creating employee.", error: error.message });
//   }
// };

// // ─── READ (list with server-side pagination + advanced filters) ───────────────

// /**
//  * GET /api/employees
//  * Returns paginated, sorted, filtered employees.
//  *
//  * Query params:
//  *   search, department (comma-separated), designation (comma-separated),
//  *   status, salaryMin, salaryMax, joiningFrom, joiningTo,
//  *   page (default 1), limit (default 10),
//  *   sortField (default "createdAt"), sortDir (default "desc")
//  */
// export const getEmployees = async (req, res) => {
//   try {
//     const {
//       search, department, designation, status,
//       salaryMin, salaryMax, joiningFrom, joiningTo,
//       page: pageStr, limit: limitStr, sortField, sortDir,
//     } = req.query;

//     const query = {};

//     // Text search across multiple fields
//     if (search && search.trim()) {
//       const searchRegex = new RegExp(search.trim(), "i");
//       query.$or = [
//         { firstName: searchRegex },
//         { lastName: searchRegex },
//         { email: searchRegex },
//         { employeeId: searchRegex },
//       ];
//     }

//     // Department — supports comma-separated multi-select
//     if (department && department.trim()) {
//       const depts = department.split(",").map((d) => d.trim()).filter(Boolean);
//       if (depts.length === 1) {
//         query.department = { $regex: new RegExp(`^${depts[0]}$`, "i") };
//       } else if (depts.length > 1) {
//         query.department = { $in: depts.map((d) => new RegExp(`^${d}$`, "i")) };
//       }
//     }

//     // Designation — supports comma-separated multi-select
//     if (designation && designation.trim()) {
//       const desigs = designation.split(",").map((d) => d.trim()).filter(Boolean);
//       if (desigs.length === 1) {
//         query.designation = { $regex: new RegExp(`^${desigs[0]}$`, "i") };
//       } else if (desigs.length > 1) {
//         query.designation = { $in: desigs.map((d) => new RegExp(`^${d}$`, "i")) };
//       }
//     }

//     // Status
//     if (status && status.trim()) {
//       query.status = status.trim();
//     }

//     // Salary range
//     if (salaryMin !== undefined || salaryMax !== undefined) {
//       query.salary = {};
//       if (salaryMin !== undefined && salaryMin !== "") query.salary.$gte = Number(salaryMin);
//       if (salaryMax !== undefined && salaryMax !== "") query.salary.$lte = Number(salaryMax);
//       if (Object.keys(query.salary).length === 0) delete query.salary;
//     }

//     // Joining date range
//     if (joiningFrom || joiningTo) {
//       query.joiningDate = {};
//       if (joiningFrom) query.joiningDate.$gte = new Date(joiningFrom);
//       if (joiningTo) query.joiningDate.$lte = new Date(joiningTo);
//       if (Object.keys(query.joiningDate).length === 0) delete query.joiningDate;
//     }

//     // Pagination
//     const page = Math.max(1, parseInt(pageStr, 10) || 1);
//     const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 10));
//     const skip = (page - 1) * limit;

//     // Sorting — sanitize sortField
//     const sf = SORTABLE_FIELDS.includes(sortField) ? sortField : "createdAt";
//     const sd = sortDir === "asc" ? 1 : -1;
//     const sortObj = { [sf]: sd };

//     // Execute query + count in parallel
//     const [employees, totalCount] = await Promise.all([
//       Employee.find(query).sort(sortObj).skip(skip).limit(limit),
//       Employee.countDocuments(query),
//     ]);

//     const totalPages = Math.max(1, Math.ceil(totalCount / limit));

//     return res.status(200).json({
//       success: true,
//       count: employees.length,
//       data: employees,
//       pagination: { page, limit, totalCount, totalPages },
//     });
//   } catch (error) {
//     console.error("getEmployees error:", error);
//     return res.status(500).json({ success: false, message: "Server error while fetching employees.", error: error.message });
//   }
// };

// // ─── READ (single) ───────────────────────────────────────────────────────────

// /**
//  * GET /api/employees/:id
//  */
// export const getEmployeeById = async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.params.id);
//     if (!employee)
//       return res.status(404).json({ success: false, message: "Employee not found." });
//     return res.status(200).json({ success: true, data: employee });
//   } catch (error) {
//     console.error("getEmployeeById error:", error);
//     if (error.name === "CastError")
//       return res.status(400).json({ success: false, message: "Invalid employee ID format." });
//     return res.status(500).json({ success: false, message: "Server error while fetching employee.", error: error.message });
//   }
// };

// // ─── UPDATE ──────────────────────────────────────────────────────────────────

// /**
//  * PUT /api/employees/:id
//  */
// export const updateEmployee = async (req, res) => {
//   try {
//     const body = req.body || {};
//     const {
//       firstName, lastName, email, phone, department, designation,
//       salary, joiningDate, address, documents, status,
//     } = body;

//     // Field-level validation (same rules as create, only when field is provided)
//     if (email !== undefined) {
//       if (!email || !String(email).trim())
//         return res.status(400).json({ success: false, message: "Email address is required." });
//       if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()))
//         return res.status(400).json({ success: false, message: "Please provide a valid email address." });
//     }
//     if (phone !== undefined && phone !== null && String(phone).trim()) {
//       const phoneTrimmed = String(phone).trim();
//       if (!/^[\d\s+\-()\[\]]+$/.test(phoneTrimmed))
//         return res.status(400).json({ success: false, message: "Phone number contains invalid characters." });
//       const digits = phoneTrimmed.replace(/\D/g, "");
//       if (digits.length < 7 || digits.length > 15)
//         return res.status(400).json({ success: false, message: "Phone number must be between 7 and 15 digits." });
//     }
//     if (salary !== undefined && salary !== null && salary !== "") {
//       const salaryNum = Number(salary);
//       if (isNaN(salaryNum))
//         return res.status(400).json({ success: false, message: "Salary must be a valid number." });
//       if (salaryNum < 0)
//         return res.status(400).json({ success: false, message: "Salary cannot be negative." });
//       if (salaryNum > 10000000)
//         return res.status(400).json({ success: false, message: "Salary value seems unrealistically high." });
//     }
//     if (joiningDate) {
//       const chosenDate = new Date(joiningDate);
//       if (isNaN(chosenDate.getTime()))
//         return res.status(400).json({ success: false, message: "Joining date is not a valid date." });
//       const todayEnd = new Date();
//       todayEnd.setHours(23, 59, 59, 999);
//       if (chosenDate > todayEnd)
//         return res.status(400).json({ success: false, message: "Joining date cannot be in the future." });
//     }

//     // Fetch old employee for audit diff
//     const oldEmployee = await Employee.findById(req.params.id);
//     if (!oldEmployee)
//       return res.status(404).json({ success: false, message: "Employee not found." });

//     // Build update payload
//     const updateData = {};
//     if (firstName !== undefined) updateData.firstName = firstName;
//     if (lastName !== undefined) updateData.lastName = lastName;
//     if (phone !== undefined) updateData.phone = phone;
//     if (department !== undefined) updateData.department = department;
//     if (designation !== undefined) updateData.designation = designation;
//     if (salary !== undefined) updateData.salary = salary !== "" ? Number(salary) : 0;
//     if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
//     if (address !== undefined) updateData.address = address;
//     if (documents !== undefined) updateData.documents = documents;
//     if (status !== undefined) updateData.status = status;
//     if (req.body.profilePhoto !== undefined) updateData.profilePhoto = req.body.profilePhoto;

//     // Email dedup
//     if (email !== undefined) {
//       const normalizedEmail = String(email).toLowerCase().trim();
//       const duplicate = await Employee.findOne({ email: normalizedEmail, _id: { $ne: req.params.id } });
//       if (duplicate)
//         return res.status(409).json({ success: false, message: "Another employee with this email already exists." });
//       updateData.email = normalizedEmail;
//     }

//     const updatedEmployee = await Employee.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true, returnDocument: "after", runValidators: true }
//     );

//     if (!updatedEmployee)
//       return res.status(404).json({ success: false, message: "Employee not found." });

//     // Audit log — diff old vs new
//     const changes = [];
//     for (const key of Object.keys(updateData)) {
//       const oldVal = oldEmployee[key];
//       const newVal = updatedEmployee[key];
//       if (String(oldVal) !== String(newVal)) {
//         changes.push({ field: key, oldValue: oldVal, newValue: newVal });
//       }
//     }
//     if (changes.length > 0) {
//       logAudit({
//         employeeId: updatedEmployee._id,
//         action: "updated",
//         performedBy: req.user?.name || "System",
//         changes,
//         summary: buildSummary(changes),
//       });
//     }

//     return res.status(200).json({ success: true, message: "Employee updated successfully.", data: updatedEmployee });
//   } catch (error) {
//     console.error("updateEmployee error:", error);
//     if (error.name === "CastError")
//       return res.status(400).json({ success: false, message: "Invalid employee ID format." });
//     if (error.name === "ValidationError")
//       return res.status(400).json({ success: false, message: "Validation error.", error: error.message });
//     return res.status(500).json({ success: false, message: "Server error while updating employee.", error: error.message });
//   }
// };

// // ─── DELETE ──────────────────────────────────────────────────────────────────

// /**
//  * DELETE /api/employees/:id
//  */
// export const deleteEmployee = async (req, res) => {
//   try {
//     const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
//     if (!deletedEmployee)
//       return res.status(404).json({ success: false, message: "Employee not found." });

//     // Audit log
//     logAudit({
//       employeeId: deletedEmployee._id,
//       action: "deleted",
//       performedBy: req.user?.name || "System",
//       summary: `Employee '${deletedEmployee.firstName} ${deletedEmployee.lastName}' (${deletedEmployee.employeeId}) deleted.`,
//     });

//     return res.status(200).json({
//       success: true,
//       message: `Employee '${deletedEmployee.firstName} ${deletedEmployee.lastName}' (${deletedEmployee.employeeId}) has been permanently deleted.`,
//     });
//   } catch (error) {
//     console.error("deleteEmployee error:", error);
//     if (error.name === "CastError")
//       return res.status(400).json({ success: false, message: "Invalid employee ID format." });
//     return res.status(500).json({ success: false, message: "Server error while deleting employee.", error: error.message });
//   }
// };

// // ─── PROFILE PHOTO ───────────────────────────────────────────────────────────

// /**
//  * POST /api/employees/:id/photo
//  */
// export const uploadProfilePhoto = async (req, res) => {
//   try {
//     if (!req.file)
//       return res.status(400).json({ success: false, message: "No image file provided." });

//     const employee = await Employee.findById(req.params.id);
//     if (!employee)
//       return res.status(404).json({ success: false, message: "Employee not found." });

//     // Delete old photo
//     if (employee.profilePhoto) {
//       const oldPath = path.join(process.cwd(), employee.profilePhoto);
//       if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//     }

//     const photoPath = `uploads/${req.file.filename}`.replace(/\\/g, "/");
//     employee.profilePhoto = photoPath;
//     await employee.save();

//     logAudit({
//       employeeId: employee._id,
//       action: "photo_uploaded",
//       performedBy: req.user?.name || "System",
//       summary: "Profile photo uploaded.",
//     });

//     return res.status(200).json({ success: true, message: "Profile photo uploaded successfully.", data: employee });
//   } catch (error) {
//     console.error("uploadProfilePhoto error:", error);
//     return res.status(500).json({ success: false, message: "Server error while uploading profile photo.", error: error.message });
//   }
// };

// // ─── BULK DELETE ─────────────────────────────────────────────────────────────

// /**
//  * DELETE /api/employees/bulk
//  */
// export const bulkDeleteEmployees = async (req, res) => {
//   try {
//     const { ids } = req.body;

//     if (!Array.isArray(ids) || ids.length === 0)
//       return res.status(400).json({ success: false, message: "A non-empty array of employee IDs is required." });

//     const { Types } = await import("mongoose");
//     const invalidIds = ids.filter((id) => !Types.ObjectId.isValid(id));
//     if (invalidIds.length > 0)
//       return res.status(400).json({ success: false, message: `The following IDs have an invalid format: ${invalidIds.join(", ")}.` });

//     const result = await Employee.deleteMany({ _id: { $in: ids } });

//     if (result.deletedCount === 0)
//       return res.status(404).json({ success: false, message: "No employees were found for the provided IDs." });

//     return res.status(200).json({
//       success: true,
//       deletedCount: result.deletedCount,
//       message: `${result.deletedCount} employee(s) deleted successfully.`,
//     });
//   } catch (error) {
//     console.error("bulkDeleteEmployees error:", error);
//     return res.status(500).json({ success: false, message: "Server error while bulk deleting employees.", error: error.message });
//   }
// };

// // ─── STATS (lightweight for stat cards) ──────────────────────────────────────

// /**
//  * GET /api/employees/stats
//  * Returns total + per-status counts in a single aggregation query.
//  */
// export const getEmployeeStats = async (req, res) => {
//   try {
//     const [result] = await Employee.aggregate([
//       {
//         $group: {
//           _id: null,
//           total: { $sum: 1 },
//           active: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
//           inactive: { $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] } },
//           onLeave: { $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] } },
//           terminated: { $sum: { $cond: [{ $eq: ["$status", "Terminated"] }, 1, 0] } },
//         },
//       },
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: result || { total: 0, active: 0, inactive: 0, onLeave: 0, terminated: 0 },
//     });
//   } catch (error) {
//     console.error("getEmployeeStats error:", error);
//     return res.status(500).json({ success: false, message: "Server error while fetching stats.", error: error.message });
//   }
// };

// // ─── STATS DETAILED (for analytics panel) ────────────────────────────────────

// /**
//  * GET /api/employees/stats/detailed
//  * Returns department distribution, status breakdown, salary histogram + stats.
//  */
// export const getEmployeeStatsDetailed = async (req, res) => {
//   try {
//     const [result] = await Employee.aggregate([
//       {
//         $facet: {
//           departmentCounts: [
//             { $group: { _id: "$department", count: { $sum: 1 } } },
//             { $sort: { count: -1 } },
//           ],
//           statusCounts: [
//             { $group: { _id: "$status", count: { $sum: 1 } } },
//           ],
//           salaryDistribution: [
//             {
//               $bucket: {
//                 groupBy: "$salary",
//                 boundaries: [0, 25000, 50000, 75000, 100000, 10000001],
//                 default: "Other",
//                 output: { count: { $sum: 1 } },
//               },
//             },
//           ],
//           salaryStats: [
//             {
//               $group: {
//                 _id: null,
//                 avgSalary: { $avg: "$salary" },
//                 minSalary: { $min: "$salary" },
//                 maxSalary: { $max: "$salary" },
//               },
//             },
//           ],
//         },
//       },
//     ]);

//     return res.status(200).json({ success: true, data: result });
//   } catch (error) {
//     console.error("getEmployeeStatsDetailed error:", error);
//     return res.status(500).json({ success: false, message: "Server error while fetching detailed stats.", error: error.message });
//   }
// };

// // ─── CSV IMPORT ──────────────────────────────────────────────────────────────

// /**
//  * POST /api/employees/import
//  * Bulk-import employees from parsed CSV data.
//  * Body: { employees: [{ firstName, lastName, email, ... }, ...] }
//  */
// export const importEmployees = async (req, res) => {
//   try {
//     const { employees } = req.body;

//     if (!Array.isArray(employees) || employees.length === 0)
//       return res.status(400).json({ success: false, message: "A non-empty array of employee data is required." });

//     const errors = [];
//     const validRows = [];
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const seenEmails = new Set();

//     // Check existing emails in DB
//     const allEmails = employees
//       .map((e) => (e.email ? String(e.email).toLowerCase().trim() : ""))
//       .filter(Boolean);
//     const existingEmps = await Employee.find({ email: { $in: allEmails } }).select("email");
//     const existingEmailSet = new Set(existingEmps.map((e) => e.email));

//     for (let i = 0; i < employees.length; i++) {
//       const row = employees[i];
//       const rowErrors = [];

//       // Required fields
//       if (!row.firstName || !String(row.firstName).trim()) rowErrors.push("First name is required");
//       if (!row.lastName || !String(row.lastName).trim()) rowErrors.push("Last name is required");
//       if (!row.email || !String(row.email).trim()) rowErrors.push("Email is required");

//       // Email format
//       const email = row.email ? String(row.email).toLowerCase().trim() : "";
//       if (email && !emailRegex.test(email)) rowErrors.push("Invalid email format");

//       // Duplicate within CSV
//       if (email && seenEmails.has(email)) rowErrors.push("Duplicate email in CSV");

//       // Duplicate in DB
//       if (email && existingEmailSet.has(email)) rowErrors.push("Email already exists in database");

//       if (rowErrors.length > 0) {
//         errors.push({ index: i, reason: rowErrors.join("; ") });
//       } else {
//         seenEmails.add(email);
//         validRows.push({ ...row, email });
//       }
//     }

//     // Generate IDs and create employees
//     let created = 0;
//     const createdEmployees = [];
//     for (const row of validRows) {
//       try {
//         const employeeId = await generateEmployeeId();
//         const emp = await Employee.create({
//           employeeId,
//           firstName: row.firstName,
//           lastName: row.lastName,
//           email: row.email,
//           phone: row.phone || "",
//           department: row.department || "",
//           designation: row.designation || "",
//           salary: row.salary ? Number(row.salary) : 0,
//           joiningDate: row.joiningDate || undefined,
//           address: row.address || "",
//           status: row.status || "Active",
//         });
//         createdEmployees.push(emp);
//         created++;

//         logAudit({
//           employeeId: emp._id,
//           action: "created",
//           performedBy: req.user?.name || "System",
//           summary: `Employee ${emp.firstName} ${emp.lastName} (${emp.employeeId}) imported via CSV.`,
//         });
//       } catch (err) {
//         errors.push({ index: validRows.indexOf(row), reason: err.message });
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         created,
//         skipped: employees.length - created,
//         errors,
//       },
//     });
//   } catch (error) {
//     console.error("importEmployees error:", error);
//     return res.status(500).json({ success: false, message: "Server error while importing employees.", error: error.message });
//   }
// };

// // ─── AUDIT HISTORY ───────────────────────────────────────────────────────────

// /**
//  * GET /api/employees/:id/history
//  * Returns paginated audit logs for a specific employee.
//  */
// export const getEmployeeHistory = async (req, res) => {
//   try {
//     const { page: pageStr, limit: limitStr } = req.query;
//     const page = Math.max(1, parseInt(pageStr, 10) || 1);
//     const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
//     const skip = (page - 1) * limit;

//     const [logs, totalCount] = await Promise.all([
//       AuditLog.find({ employeeId: req.params.id })
//         .sort({ timestamp: -1 })
//         .skip(skip)
//         .limit(limit),
//       AuditLog.countDocuments({ employeeId: req.params.id }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: logs,
//       pagination: {
//         page,
//         limit,
//         totalCount,
//         totalPages: Math.max(1, Math.ceil(totalCount / limit)),
//       },
//     });
//   } catch (error) {
//     console.error("getEmployeeHistory error:", error);
//     if (error.name === "CastError")
//       return res.status(400).json({ success: false, message: "Invalid employee ID format." });
//     return res.status(500).json({ success: false, message: "Server error while fetching history.", error: error.message });
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
// >>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
//   }
// };


import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import AuditLog from "../models/AuditLog.js";
import generateEmployeeId from "../utils/generateEmployeeId.js";

const SORTABLE_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "department",
  "designation",
  "salary",
  "joiningDate",
  "status",
  "createdAt",
  "employeeId",
];

const logAudit = (entry) =>
  AuditLog.create(entry).catch((err) =>
    console.error("Audit log error:", err)
  );

const buildSummary = (changes) => {
  if (!changes || changes.length === 0) return "No fields changed.";
  return `Updated ${changes.map((c) => c.field).join(", ")}`;
};

// CREATE EMPLOYEE
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

    if (!firstName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name is required.",
      });
    }

    if (!lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Last name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const existing = await Employee.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An employee with this email already exists.",
      });
    }

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
      joiningDate,
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

    return res.status(500).json({
      success: false,
      message: "Server error while creating employee.",
      error: error.message,
    });
  }
};

// GET ALL EMPLOYEES
export const getEmployees = async (req, res) => {
  try {
    const {
      search,
      department,
      designation,
      status,
      salaryMin,
      salaryMax,
      joiningFrom,
      joiningTo,
      page: pageStr,
      limit: limitStr,
      sortField,
      sortDir,
    } = req.query;

    const query = {};

    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex },
      ];
    }

    if (department?.trim()) {
      const departments = department
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      query.department = {
        $in: departments.map((d) => new RegExp(`^${d}$`, "i")),
      };
    }

    if (designation?.trim()) {
      const designations = designation
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      query.designation = {
        $in: designations.map((d) => new RegExp(`^${d}$`, "i")),
      };
    }

    if (status?.trim()) {
      query.status = status.trim();
    }

    if (salaryMin || salaryMax) {
      query.salary = {};

      if (salaryMin) query.salary.$gte = Number(salaryMin);
      if (salaryMax) query.salary.$lte = Number(salaryMax);
    }

    if (joiningFrom || joiningTo) {
      query.joiningDate = {};

      if (joiningFrom) query.joiningDate.$gte = new Date(joiningFrom);
      if (joiningTo) query.joiningDate.$lte = new Date(joiningTo);
    }

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 10));
    const skip = (page - 1) * limit;

    const safeSortField = SORTABLE_FIELDS.includes(sortField)
      ? sortField
      : "createdAt";

    const sortOrder = sortDir === "asc" ? 1 : -1;

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
        {
          $addFields: {
            taskCount: { $size: "$assignedTasks" },
          },
        },
        {
          $project: {
            assignedTasks: 0,
          },
        },
        {
          $sort: {
            [safeSortField]: sortOrder,
          },
        },
        { $skip: skip },
        { $limit: limit },
      ]),

      Employee.countDocuments(query),
    ]);

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

    return res.status(500).json({
      success: false,
      message: "Server error while fetching employees.",
      error: error.message,
    });
  }
};

// GET EMPLOYEE BY ID
export const getEmployeeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format.",
      });
    }

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

    return res.status(500).json({
      success: false,
      message: "Server error while fetching employee.",
      error: error.message,
    });
  }
};

// GET EMPLOYEE TASKS
export const getEmployeeTasks = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid employee ID",
      });
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const tasks = await Task.find({
      assignedTo: req.params.id,
    }).sort({
      dueDate: 1,
      updatedAt: -1,
    });

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID format.",
      });
    }

    const oldEmployee = await Employee.findById(req.params.id);

    if (!oldEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    const updateData = { ...req.body };

    if (updateData.email) {
      updateData.email = String(updateData.email).toLowerCase().trim();

      const duplicate = await Employee.findOne({
        email: updateData.email,
        _id: { $ne: req.params.id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Another employee with this email already exists.",
        });
      }
    }

    if (updateData.salary !== undefined && updateData.salary !== "") {
      updateData.salary = Number(updateData.salary);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    );

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
      message: "Employee updated successfully.",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("updateEmployee error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating employee.",
      error: error.message,
    });
  }
};

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);

    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }

    logAudit({
      employeeId: deletedEmployee._id,
      action: "deleted",
      performedBy: req.user?.name || "System",
      summary: `Employee '${deletedEmployee.firstName} ${deletedEmployee.lastName}' (${deletedEmployee.employeeId}) deleted.`,
    });

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    console.error("deleteEmployee error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting employee.",
      error: error.message,
    });
  }
};

// BULK DELETE
export const bulkDeleteEmployees = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty array of employee IDs is required.",
      });
    }

    const invalidIds = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid IDs: ${invalidIds.join(", ")}`,
      });
    }

    const result = await Employee.deleteMany({
      _id: { $in: ids },
    });

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

// UPLOAD PROFILE PHOTO
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

    if (employee.profilePhoto) {
      const oldPath = path.join(process.cwd(), employee.profilePhoto);

      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const photoPath = `uploads/${req.file.filename}`.replace(/\\/g, "/");

    employee.profilePhoto = photoPath;

    await employee.save();

    logAudit({
      employeeId: employee._id,
      action: "photo_uploaded",
      performedBy: req.user?.name || "System",
      summary: "Profile photo uploaded.",
    });

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

// EMPLOYEE STATS
export const getEmployeeStats = async (req, res) => {
  try {
    const [result] = await Employee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0],
            },
          },
          onLeave: {
            $sum: {
              $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0],
            },
          },
          terminated: {
            $sum: {
              $cond: [{ $eq: ["$status", "Terminated"] }, 1, 0],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: result || {
        total: 0,
        active: 0,
        inactive: 0,
        onLeave: 0,
        terminated: 0,
      },
    });
  } catch (error) {
    console.error("getEmployeeStats error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching stats.",
      error: error.message,
    });
  }
};

// DETAILED EMPLOYEE STATS
export const getEmployeeStatsDetailed = async (req, res) => {
  try {
    const [result] = await Employee.aggregate([
      {
        $facet: {
          departmentCounts: [
            {
              $group: {
                _id: "$department",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          salaryDistribution: [
            {
              $bucket: {
                groupBy: "$salary",
                boundaries: [0, 25000, 50000, 75000, 100000, 10000001],
                default: "Other",
                output: {
                  count: { $sum: 1 },
                },
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

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("getEmployeeStatsDetailed error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching detailed stats.",
      error: error.message,
    });
  }
};

// CSV IMPORT
export const importEmployees = async (req, res) => {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty array of employee data is required.",
      });
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
        errors.push({
          index: i,
          reason: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        created,
        skipped: employees.length - created,
        errors,
      },
    });
  } catch (error) {
    console.error("importEmployees error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while importing employees.",
      error: error.message,
    });
  }
};

// EMPLOYEE HISTORY
export const getEmployeeHistory = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      employeeId: req.params.id,
    }).sort({
      timestamp: -1,
    });

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("getEmployeeHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching history.",
      error: error.message,
    });
  }
};