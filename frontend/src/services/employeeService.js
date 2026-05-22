import api from "./api";

/**
 * Employee Service
 * Centralises all HTTP calls related to the /api/employees resource.
 * Consumed by React components/pages via hooks.
 */

/**
 * Fetch all employees.
 * Supports optional query parameters for search and filtering:
 *   @param {Object} params  e.g. { search: "john", department: "IT", designation: "Manager" }
 * @returns {Promise<{ success, count, data }>}
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
