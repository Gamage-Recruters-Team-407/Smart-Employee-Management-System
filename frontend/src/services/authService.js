import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request automatically
API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler - clear stale tokens silently
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

export const authService = {
  /**
   * POST /api/auth/login
   * Returns { token, user: { _id, name, email, role } }
   */
  login: async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    return data;
  },

  /**
   * POST /api/auth/register  (Admin use – kept for completeness)
   */
  register: async (payload) => {
    const { data } = await API.post("/auth/register", payload);
    return data;
  },

  /**
   * GET /api/auth/me — verify token and return current user
   */
  getMe: async () => {
    const { data } = await API.get("/auth/me");
    return data;
  },

  /**
   * POST /api/auth/logout - invalidate token and check out employee
   */
  logout: async () => {
    const { data } = await API.post("/auth/logout");
    return data;
  },

  /**
   * POST /api/attendance/check-in - record check-in
   */
  checkIn: async (payload) => {
    const { data } = await API.post("/attendance/check-in", payload);
    return data;
  },

  /**
   * POST /api/attendance/check-out - record check-out
   */
  checkOut: async (payload) => {
    const { data } = await API.post("/attendance/check-out", payload);
    return data;
  },
};

export default API;
