// <<<<<<< HEAD
// // services/api.js
// import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add token to requests if it exists
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Auth endpoints
// export const authAPI = {
//   login: (data) => api.post('/auth/login', data),
//   register: (data) => api.post('/auth/register', data),
  
//   // Forgot Password with Code
//   forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
//   verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
//   resetPasswordWithCode: (email, code, password) => api.post('/auth/reset-password-with-code', { email, code, password }),
  
//   // Traditional token-based reset (kept for compatibility)
//   resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
//   verifyResetToken: (token) => api.get(`/auth/reset-password/${token}/verify`),
  
//   logout: () => api.post('/auth/logout'),
//   getMe: () => api.get('/auth/me'),
// };

// export default api;
// =======
// const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// const getAuthHeaders = () => {
//   const headers = {};

//   // FUTURE JWT: const token = localStorage.getItem("token");
//   // if (token) headers.Authorization = `Bearer ${token}`;

//   const mockEmployeeId = localStorage.getItem("sems_mock_employee_id");
//   if (mockEmployeeId) {
//     headers["X-Mock-Employee-Id"] = mockEmployeeId;
//   }

//   return headers;
// };

// async function request(path, options = {}) {
//   let res;
//   try {
//     res = await fetch(`${baseURL}${path}`, {
//       headers: {
//         "Content-Type": "application/json",
//         ...getAuthHeaders(),
//         ...options.headers,
//       },
//       ...options,
//     });
//   } catch {
//     throw new Error(
//       "Cannot reach the backend. Start it with: cd backend && npm run dev"
//     );
//   }

//   let data;
//   try {
//     data = await res.json();
//   } catch {
//     data = null;
//   }

//   if (!res.ok) {
//     const err = new Error(data?.message || `Request failed (${res.status})`);
//     if (data?.errors) err.errors = data.errors;
//     throw err;
//   }

//   return data;
// }

// const API = {
//   get: (path) => request(path),
//   post: (path, data) =>
//     request(path, { method: "POST", body: JSON.stringify(data) }),
//   put: (path, data) =>
//     request(path, { method: "PUT", body: JSON.stringify(data) }),
//   patch: (path, data) =>
//     request(path, { method: "PATCH", body: JSON.stringify(data) }),
//   delete: (path) => request(path, { method: "DELETE" }),
// };

// export default API;
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Token සහ Mock Headers එකතු කිරීම
api.interceptors.request.use(
  (config) => {
    // 1. JWT Token එකක් තිබේ නම් එය Authorization Header එකට එකතු කරයි
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Testing වලට පාවිච්චි කරපු Mock Employee ID එකක් තිබේ නම් එයද එකතු කරයි
    const mockEmployeeId = localStorage.getItem("sems_mock_employee_id");
    if (mockEmployeeId) {
      config.headers["X-Mock-Employee-Id"] = mockEmployeeId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Backend එකට reach වෙන්න බැරි නම් එන දෝෂ පාලනය (Error Handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ජාලයේ ගැටලුවක් හෝ Backend එක Off වී ඇත්නම් (Network Error)
    if (!error.response) {
      return Promise.reject(
        new Error("Cannot reach the backend. Start it with: cd backend && npm run dev")
      );
    }
    
    // Server එකෙන් ආපු error message එකක් ඇත්නම් එය පෙන්වයි
    const serverMessage = error.response.data?.message || `Request failed (${error.response.status})`;
    const customError = new Error(serverMessage);
    if (error.response.data?.errors) {
      customError.errors = error.response.data.errors;
    }
    
    return Promise.reject(customError);
  }
);

// Auth Endpoints ටික (HEAD එකේ තිබූ පරිදිම සුරැකී ඇත)
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  
  // Forgot Password with Code
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPasswordWithCode: (email, code, password) => api.post('/auth/reset-password-with-code', { email, code, password }),
  
  // Traditional token-based reset
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}/verify`),
  
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export default api;