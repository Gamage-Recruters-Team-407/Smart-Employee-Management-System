import axios from "axios";

/**
 * Axios instance pre-configured with the backend base URL.
 * All requests automatically include the Authorization header
 * if a token is found in localStorage.
 */
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Request interceptor — attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;