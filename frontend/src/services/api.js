import axios from "axios";
import { getAuthToken } from "../utils/authToken.js";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(getAuthToken());
    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
    if (!error.response && error.message === "Network Error") {
      error.message =
        "Cannot reach the API server. Start the backend on port 5000 and refresh.";
    }
    return Promise.reject(error);
  }
);

export default API;
