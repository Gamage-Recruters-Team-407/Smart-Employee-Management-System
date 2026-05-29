import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const mockEmployeeId = localStorage.getItem("sems_mock_employee_id");
    if (mockEmployeeId) {
      config.headers["X-Mock-Employee-Id"] = mockEmployeeId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("attendanceId");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }

    if (!error.response) {
      return Promise.reject(
        new Error("Cannot reach the backend. Start it with: cd backend && npm run dev")
      );
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post("/auth/login", data),
  register: (data) => API.post("/auth/register", data),
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  verifyResetCode: (email, code) => API.post("/auth/verify-reset-code", { email, code }),
  resetPasswordWithCode: (email, code, password) =>
    API.post("/auth/reset-password-with-code", { email, code, password }),
  resetPassword: (token, password) => API.put(`/auth/reset-password/${token}`, { password }),
  verifyResetToken: (token) => API.get(`/auth/reset-password/${token}/verify`),
  logout: () => API.post("/auth/logout"),
  getMe: () => API.get("/auth/me")
};

export const payrollAPI = {
  getAll: (params) => API.get("/payroll", { params }),
  getById: (id) => API.get(`/payroll/${id}`),
  create: (data) => API.post("/payroll", data),
  update: (id, data) => API.put(`/payroll/${id}`, data),
  delete: (id) => API.delete(`/payroll/${id}`),
  generateBulk: (data) => API.post("/payroll/bulk", data),
  getSummary: (month) => API.get(`/payroll/summary/${month}`),
  getEmployees: () => API.get("/payroll/employees")
};

export default API;
