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
