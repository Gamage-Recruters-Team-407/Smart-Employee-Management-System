/**
 * TEMPORARY mock employee until JWT login is ready.
 * Override via .env or localStorage (see MockAuthContext).
 *
 * FUTURE: remove this file; user comes from AuthContext after login.
 */
export const FALLBACK_MOCK_USER = {
  _id: import.meta.env.VITE_MOCK_EMPLOYEE_ID || "",
  email: import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL || "",
  firstName: "Mock",
  lastName: "Employee",
  role: "employee",
};

export const MOCK_USER_STORAGE_KEY = "sems_mock_employee_id";
