import api from "./api";

/**
 * Employee Service
 * Centralises all HTTP calls related to the /api/employees resource.
 * Consumed by React components/pages via hooks.
 */

// ─── List / Search / Filter / Paginate ────────────────────────────────────────

/**
 * Fetch employees with server-side pagination, sorting, and filtering.
 *
 * @param {Object} params  All optional:
 *   - search        : string   (regex across firstName, lastName, email, employeeId)
 *   - department    : string   (comma-separated for multi-select, e.g. "IT,HR")
 *   - designation   : string   (comma-separated for multi-select)
 *   - status        : string   (Active | Inactive | On Leave | Terminated)
 *   - salaryMin     : number
 *   - salaryMax     : number
 *   - joiningFrom   : string   (ISO date)
 *   - joiningTo     : string   (ISO date)
 *   - page          : number   (default 1)
 *   - limit         : number   (default 10)
 *   - sortField     : string   (default "createdAt")
 *   - sortDir       : string   ("asc" | "desc", default "desc")
 * @returns {Promise<{ success, data, count, pagination: { page, limit, totalCount, totalPages } }>}
 */
export const fetchEmployees = (params = {}) =>
  api.get("/employees", { params }).then((res) => res.data);

/**
 * Fetch a single employee by MongoDB _id.
 * @param {string} id  MongoDB _id
 * @returns {Promise<{ success, data }>}
 */
export const fetchEmployeeById = (id) =>
  api.get(`/employees/${id}`).then((res) => res.data);

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Fetch lightweight employee status counts for stat cards.
 * @returns {Promise<{ success, data: { total, active, inactive, onLeave, terminated } }>}
 */
export const fetchEmployeeStats = () =>
  api.get("/employees/stats").then((res) => res.data);

/**
 * Fetch detailed analytics: department counts, status breakdown,
 * salary distribution histogram, and salary min/avg/max.
 * @returns {Promise<{ success, data: { departmentCounts, statusCounts, salaryDistribution, salaryStats } }>}
 */
export const fetchEmployeeStatsDetailed = () =>
  api.get("/employees/stats/detailed").then((res) => res.data);

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Create a new employee.
 * @param {Object} employeeData  All required + optional fields
 * @returns {Promise<{ success, message, data }>}
 */
export const addEmployee = (employeeData) =>
  api.post("/employees", employeeData).then((res) => res.data);

/**
 * Update an existing employee.
 * employeeId is immutable and should NOT be included in updateData.
 * @param {string} id          MongoDB _id
 * @param {Object} updateData  Fields to update
 * @returns {Promise<{ success, message, data }>}
 */
export const updateEmployee = (id, updateData) =>
  api.put(`/employees/${id}`, updateData).then((res) => res.data);

/**
 * Permanently delete an employee.
 * @param {string} id  MongoDB _id
 * @returns {Promise<{ success, message }>}
 */
export const deleteEmployee = (id) =>
  api.delete(`/employees/${id}`).then((res) => res.data);

/**
 * Permanently delete multiple employees at once.
 * @param {string[]} ids  Array of MongoDB _ids
 * @returns {Promise<{ success, deletedCount, message }>}
 */
export const bulkDeleteEmployees = (ids) =>
  api.delete("/employees/bulk", { data: { ids } }).then((res) => res.data);

// ─── CSV Import ───────────────────────────────────────────────────────────────

/**
 * Bulk-import employees from parsed CSV data.
 * @param {Object[]} employees  Array of employee objects (already column-mapped)
 * @returns {Promise<{ success, data: { created, skipped, errors } }>}
 */
export const importEmployees = (employees) =>
  api.post("/employees/import", { employees }).then((res) => res.data);

// ─── Documents ────────────────────────────────────────────────────────────────

/**
 * Upload a document (PDF / JPG / PNG, max 5 MB) for an employee.
 * @param {string} employeeId  MongoDB _id of the employee
 * @param {File}   file        File object from an <input type="file">
 * @param {Function} [onProgress]  Optional upload-progress callback (0–100)
 * @returns {Promise<{ success, message, data }>}
 */
export const uploadDocument = (employeeId, file, onProgress) => {
  const formData = new FormData();
  formData.append("document", file);

  return api
    .post(`/employees/${employeeId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
        : undefined,
    })
    .then((res) => res.data);
};

/**
 * Delete a specific document from an employee's documents array.
 * @param {string} employeeId  MongoDB _id of the employee
 * @param {string} docId       MongoDB _id of the document sub-document
 * @returns {Promise<{ success, message, data }>}
 */
export const deleteDocument = (employeeId, docId) =>
  api
    .delete(`/employees/${employeeId}/documents/${docId}`)
    .then((res) => res.data);

// ─── Profile Photo ────────────────────────────────────────────────────────────

/**
 * Upload or replace an employee's profile photo.
 * @param {string} employeeId  MongoDB _id of the employee
 * @param {File}   file        Image file (JPG or PNG)
 * @returns {Promise<{ success, message, data }>}
 */
export const uploadProfilePhoto = (employeeId, file) => {
  const formData = new FormData();
  formData.append("photo", file);
  return api
    .post(`/employees/${employeeId}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data);
};

// ─── Audit / Change History ───────────────────────────────────────────────────

/**
 * Fetch the change history (audit log) for a specific employee.
 * @param {string} employeeId  MongoDB _id of the employee
 * @param {Object} params      Optional: { page: 1, limit: 20 }
 * @returns {Promise<{ success, data: [...logs], pagination }>}
 */
export const fetchEmployeeHistory = (employeeId, params = {}) =>
  api
    .get(`/employees/${employeeId}/history`, { params })
    .then((res) => res.data);
