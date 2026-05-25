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
   * POST /api/auth/register
   */
  register: async (payload) => {
    const { data } = await API.post("/auth/register", payload);
    return data;
  },

  /**
   * GET /api/auth/me
   */
  getMe: async () => {
    const { data } = await API.get("/auth/me");
    return data;
  },

  /**
   * POST /api/auth/forgot-password
   * Sends a 6-digit reset code to user's email
   */
  forgotPassword: async (email) => {
    const { data } = await API.post("/auth/forgot-password", { email });
    return data;
  },

  /**
   * POST /api/auth/verify-reset-code
   * Verifies the 6-digit reset code
   */
  verifyResetCode: async (email, code) => {
    const { data } = await API.post("/auth/verify-reset-code", { email, code });
    return data;
  },

  /**
   * POST /api/auth/reset-password-with-code
   * Resets password using email and code
   */
  resetPasswordWithCode: async (email, code, password) => {
    const { data } = await API.post("/auth/reset-password-with-code", { email, code, password });
    return data;
  },

  /**
   * POST /api/auth/google
   * Sends Google ID token to backend for verification
   */
  googleLogin: async (token) => {
    const { data } = await API.post("/auth/google", { token });
    return data;
  },

  /**
   * GET /api/auth/google — Initiates Google OAuth flow
   */
  initiateGoogleAuth: () => {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/auth/google`;
  },
};

export default API;