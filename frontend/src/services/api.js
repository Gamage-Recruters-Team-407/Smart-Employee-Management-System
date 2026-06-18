import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

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

// ─── API INTERCEPTOR ──────────────────────────────────────────────────────────

API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("attendanceId");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle 404 - Not Found
    if (error.response?.status === 404) {
      console.error(`❌ API Endpoint not found: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      return Promise.reject({
        ...error,
        message: `API endpoint not found: ${error.config?.url}`
      });
    }

    // Handle 500 - Server Error
    if (error.response?.status === 500) {
      console.error(`❌ Server Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      return Promise.reject({
        ...error,
        message: error.response?.data?.message || 'Internal server error. Please try again later.'
      });
    }

    // Network errors
    if (!error.response) {
      console.error('❌ Network Error: Cannot reach the backend server.');
      error.message = "Cannot reach the backend server. Please check if the server is running.";
    }

    return Promise.reject(error);
  }
);

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

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

export const employeeAPI = {
  getAll: (params) => API.get("/employees", { params }),
  getById: (id) => API.get(`/employees/${id}`),
  create: (data) => API.post("/employees", data),
  update: (id, data) => API.put(`/employees/${id}`, data),
  delete: (id) => API.delete(`/employees/${id}`),
  getMe: () => API.get("/employees/me"),
  getStats: () => API.get("/employees/stats"),
  getStatsDetailed: () => API.get("/employees/stats/detailed"),
  uploadPhoto: (id, file) => {
    const formData = new FormData();
    formData.append("photo", file);
    return API.post(`/employees/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append("document", file);
    return API.post(`/employees/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteDocument: (id, docId) => API.delete(`/employees/${id}/documents/${docId}`),
  getHistory: (id, params) => API.get(`/employees/${id}/history`, { params }),
  import: (employees) => API.post("/employees/import", { employees }),
  bulkDelete: (ids) => API.delete("/employees/bulk", { data: { ids } }),
};

export const attendanceAPI = {
  getToday: () => API.get("/attendance/today"),
  getHistory: (params) => API.get("/attendance/my-history", { params }),
  getAdminSummary: (params) => API.get("/attendance/admin/summary", { params }),
  mark: (data) => API.post("/attendance/mark", data),
  checkIn: (data) => API.post("/attendance/check-in", data),
  checkOut: (data) => API.post("/attendance/check-out", data),
  updateStatus: (data) => API.post("/attendance/update-status", data),
  getBreakStatus: () => API.get("/attendance/break/status"),
  getBreakRemaining: () => API.get("/attendance/break/remaining"),
  startBreak: (breakType) => API.post("/attendance/break/start", { breakType }),
  endBreak: () => API.post("/attendance/break/end"),
};

export const payrollAPI = {
  getAll: (params) => API.get("/payroll", { params }),
  getById: (id) => API.get(`/payroll/${id}`),
  create: (data) => API.post("/payroll", data),
  update: (id, data) => API.put(`/payroll/${id}`, data),
  delete: (id) => API.delete(`/payroll/${id}`),
  generateBulk: (data) => API.post("/payroll/bulk", data),
  getSummary: (month) => API.get(`/payroll/summary/${month}`),
  getEmployees: () => API.get("/payroll/employees"),
  getPayslip: (id) => API.get(`/payroll/payslip/${id}`),
};

export const leaveAPI = {
  getAll: (params) => API.get("/leaves", { params }),
  getMyLeaves: (params) => API.get("/leaves/my-leaves", { params }),
  getById: (id) => API.get(`/leaves/${id}`),
  create: (data) => API.post("/leaves", data),
  update: (id, data) => API.put(`/leaves/${id}`, data),
  delete: (id) => API.delete(`/leaves/${id}`),
  cancel: (id) => API.put(`/leaves/cancel/${id}`),
  approve: (id) => API.put(`/leaves/approve/${id}`),
  reject: (id) => API.put(`/leaves/reject/${id}`),
  getBalance: () => API.get("/leaves/balance"),
};

export const taskAPI = {
  getAll: (params) => API.get("/tasks", { params }),
  getMyTasks: (params) => API.get("/tasks/my-tasks", { params }),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post("/tasks", data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
  assign: (id, data) => API.post(`/tasks/${id}/assign`, data),
  updateStatus: (id, status) => API.put(`/tasks/${id}/status`, { status }),
  getStats: () => API.get("/tasks/stats"),
};

export const notificationAPI = {
  getAll: (params) => API.get("/notifications", { params }),
  getUnreadCount: () => API.get("/notifications/unread-count"),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch("/notifications/read-all"),
  delete: (id) => API.delete(`/notifications/${id}`),
  create: (data) => API.post("/notifications", data),
  getEmailStatus: () => API.get("/notifications/email-status"),
  sendTestEmail: () => API.post("/notifications/test-email"),
};

export const performanceAPI = {
  getAll: (params) => API.get("/performance", { params }),
  getMyPerformance: (params) => API.get("/performance/my", { params }),
  getById: (id) => API.get(`/performance/${id}`),
  create: (data) => API.post("/performance", data),
  update: (id, data) => API.put(`/performance/${id}`, data),
  delete: (id) => API.delete(`/performance/${id}`),
  getStats: () => API.get("/performance/stats"),
};

export const dashboardAPI = {
  getStats: () => API.get("/dashboard/stats"),
  getRecentActivity: () => API.get("/dashboard/recent-activity"),
  getChartData: () => API.get("/dashboard/chart-data"),
};

export const reportAPI = {
  generateAttendanceReport: (params) => API.get("/reports/attendance", { params, responseType: 'blob' }),
  generatePayrollReport: (params) => API.get("/reports/payroll", { params, responseType: 'blob' }),
  generateLeaveReport: (params) => API.get("/reports/leave", { params, responseType: 'blob' }),
  generatePerformanceReport: (params) => API.get("/reports/performance", { params, responseType: 'blob' }),
  downloadPayslip: (id) => API.get(`/reports/payslip/${id}`, { responseType: 'blob' }),
};

// ─── BREAK MANAGEMENT ──────────────────────────────────────────────────────
export const breakAPI = {
  startBreak: (breakType) => API.post('/attendance/break/start', { breakType }),
  endBreak: () => API.post('/attendance/break/end'),
  getBreakStatus: () => API.get('/attendance/break/status'),
  getBreakRemaining: () => API.get('/attendance/break/remaining'),
  updateStatus: (data) => API.post('/attendance/update-status', data),
};

export default API;