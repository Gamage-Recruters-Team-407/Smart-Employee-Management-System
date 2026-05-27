// <<<<<<< HEAD
//  import axios from 'axios';

// const API = axios.create({
//   baseURL: 'http://localhost:5000/api',
// });

// export default API;
// =======
// <<<<<<< HEAD
// // services/api.js
// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests if it exists
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Auth endpoints
// export const authAPI = {
//   login: (data) => api.post('/auth/login', data),
//   register: (data) => api.post('/auth/register', data),
  
//   // Forgot Password with Code
//   forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
//   verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
//   resetPasswordWithCode: (email, code, password) => api.post('/auth/reset-password-with-code', { email, code, password }),
  
//   // Traditional token-based reset (kept for compatibility)
//   resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
//   verifyResetToken: (token) => api.get(`/auth/reset-password/${token}/verify`),
  
//   logout: () => api.post('/auth/logout'),
//   getMe: () => api.get('/auth/me'),
// };

// // Payroll endpoints
// export const payrollAPI = {
//   getAll: (params) => api.get('/payroll', { params }),
//   getById: (id) => api.get(`/payroll/${id}`),
//   create: (data) => api.post('/payroll', data),
//   update: (id, data) => api.put(`/payroll/${id}`, data),
//   delete: (id) => api.delete(`/payroll/${id}`),
//   generateBulk: (data) => api.post('/payroll/bulk', data),
//   getSummary: (month) => api.get(`/payroll/summary/${month}`),
//   getEmployees: () => api.get('/payroll/employees'),
// };

// export default api;
// =======
// const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// const getAuthHeaders = () => {
//   const headers = {};

//   // FUTURE JWT: const token = localStorage.getItem("token");
//   // if (token) headers.Authorization = `Bearer ${token}`;

//   const mockEmployeeId = localStorage.getItem("sems_mock_employee_id");
//   if (mockEmployeeId) {
//     headers["X-Mock-Employee-Id"] = mockEmployeeId;
//   }

//   return headers;
// };

// async function request(path, options = {}) {
//   let res;
//   try {
//     res = await fetch(`${baseURL}${path}`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeaders(),
//         ...options.headers,
//       },
//       ...options,
//     });
//   } catch {
//     throw new Error(
//       "Cannot reach the backend. Start it with: cd backend && npm run dev"
//     );
//   }

//   let data;
//   try {
//     data = await res.json();
//   } catch {
//     data = null;
//   }

//   if (!res.ok) {
//     const err = new Error(data?.message || `Request failed (${res.status})`);
//     if (data?.errors) err.errors = data.errors;
//     throw err;
//   }

//   return data;
// }

// const API = {
//   get: (path) => request(path),
//   post: (path, data) =>
//     request(path, { method: "POST", body: JSON.stringify(data) }),
//   put: (path, data) =>
//     request(path, { method: "PUT", body: JSON.stringify(data) }),
//   patch: (path, data) =>
//     request(path, { method: "PATCH", body: JSON.stringify(data) }),
//   delete: (path) => request(path, { method: "DELETE" }),
// };

// export default API;
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
// >>>>>>> d9a15a9db0be8ea95b979aff342d68141b4a01ba


const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const headers = {};

  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const mockEmployeeId = localStorage.getItem("sems_mock_employee_id");
  if (mockEmployeeId) {
    headers["X-Mock-Employee-Id"] = mockEmployeeId;
  }

  return headers;
};

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${baseURL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the backend. Start it with: cd backend && npm run dev"
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response may not be JSON
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    if (data?.errors) err.errors = data.errors;
    throw err;
  }

  return data;
}

const API = {
  get: (path) => request(path),
  post: (path, data) =>
    request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) =>
    request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) =>
    request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),

  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  verifyResetCode: (email, code) =>
    API.post("/auth/verify-reset-code", { email, code }),
  resetPasswordWithCode: (email, code, password) =>
    API.post("/auth/reset-password-with-code", { email, code, password }),

  resetPassword: (token, password) =>
    API.put(`/auth/reset-password/${token}`, { password }),
  verifyResetToken: (token) => API.get(`/auth/reset-password/${token}/verify`),

  logout: () => API.post("/auth/logout"),
  getMe: () => API.get("/auth/me"),
};

export const payrollAPI = {
  getAll: (params) => API.get(`/payroll?${new URLSearchParams(params || {})}`),
  getById: (id) => API.get(`/payroll/${id}`),
  create: (data) => API.post("/payroll", data),
  update: (id, data) => API.put(`/payroll/${id}`, data),
  delete: (id) => API.delete(`/payroll/${id}`),
  generateBulk: (data) => API.post("/payroll/bulk", data),
  getSummary: (month) => API.get(`/payroll/summary/${month}`),
  getEmployees: () => API.get("/payroll/employees"),
};

export default API;