// services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  
  // Forgot Password with Code
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPasswordWithCode: (email, code, password) => api.post('/auth/reset-password-with-code', { email, code, password }),
  
  // Traditional token-based reset (kept for compatibility)
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}/verify`),
  
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export default api;
