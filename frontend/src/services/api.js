import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  let userId = localStorage.getItem("userId");
  let role = localStorage.getItem("role");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!token && import.meta.env.DEV) {
    if (!role) {
      role = "Manager";
      localStorage.setItem("role", role);
    }

    if (!userId) {
      userId = "64b000000000000000000001";
      localStorage.setItem("userId", userId);
    }
  }

  if (userId && role) {
    config.headers["x-user-id"] = userId;
    config.headers["x-user-role"] = role;
  }

  return config;
});

export default api;
