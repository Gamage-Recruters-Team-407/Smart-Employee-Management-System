import API from "./api.js";

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
   * POST /api/auth/google/token — Sign in with Google ID token from GIS button
   */
  googleLogin: async (credential) => {
    const { data } = await API.post("/auth/google/token", { credential });
    return data;
  },

  /**
   * GET /api/auth/google/status
   */
  getGoogleStatus: () => API.get("/auth/google/status"),

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