// context/AuthContext.jsx

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { authService } from "../services/authService";
import API from "../services/api";
import { EMPLOYEE_PROFILE_UPDATED } from "../utils/employeeProfileEvents";

const AuthContext = createContext(null);

// ─── HELPER FUNCTION: STORAGE SESSION ──────────────────────────────────────
const getInitialAuthData = () => {
  let token = localStorage.getItem("token");
  let user = localStorage.getItem("user");

  if (token === "undefined") { localStorage.removeItem("token"); token = null; }
  if (user === "undefined") { localStorage.removeItem("user"); user = null; }

  if (!token || !user) {
    const sessToken = sessionStorage.getItem("token");
    const sessUser = sessionStorage.getItem("user");
    if (sessToken && sessToken !== "undefined") token = sessToken;
    if (sessUser && sessUser !== "undefined") user = sessUser;
  }

  try {
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  } catch (e) {
    console.error("Initial session parsing failed:", e);
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [initialData] = useState(() => getInitialAuthData());
  
  const [token, setToken] = useState(initialData.token);
  const [user, setUser] = useState(initialData.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [breakStatus, setBreakStatus] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);

  // ─── CLEAR SESSION ────────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("attendanceId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("attendanceId");

    setToken(null);
    setUser(null);
    setBreakStatus(null);
    setEmployeeData(null);
  }, []);

  // ─── PATCH STORED USER ──────────────────────────────────────────────────
  const patchStoredUser = useCallback((patch) => {
    for (const storage of [localStorage, sessionStorage]) {
      const raw = storage.getItem("user");
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        storage.setItem("user", JSON.stringify({ ...parsed, ...patch }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // ─── EMPLOYEE PROFILE UPDATE LISTENER ──────────────────────────────────
  useEffect(() => {
    const onEmployeeUpdated = (event) => {
      const emp = event.detail;
      if (!emp?.email) return;

      setUser((prev) => {
        if (!prev?.email || prev.email.toLowerCase() !== emp.email.toLowerCase()) {
          return prev;
        }
        const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ").trim();
        const next = { ...prev, name: name || prev.name };
        patchStoredUser({ name: next.name });
        return next;
      });
    };

    window.addEventListener(EMPLOYEE_PROFILE_UPDATED, onEmployeeUpdated);
    return () => window.removeEventListener(EMPLOYEE_PROFILE_UPDATED, onEmployeeUpdated);
  }, [patchStoredUser]);

  // ─── GET BROWSER DATE/TIME ──────────────────────────────────────────────
  const getBrowserDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    return { date: dateStr, time: timeStr };
  };

  // ─── FETCH BREAK STATUS ──────────────────────────────────────────────────
  const fetchBreakStatus = useCallback(async () => {
    if (!token || !user) return;
    
    try {
      const response = await API.get('/attendance/break/status');
      const data = response.data?.data || response.data || {};
      setBreakStatus(data);
    } catch (err) {
      console.error('Failed to fetch break status:', err);
    }
  }, [token, user]);

  // ─── FETCH OR CREATE EMPLOYEE ──────────────────────────────────────────
  const fetchOrCreateEmployee = useCallback(async (userData) => {
    if (!userData?.email) return null;

    try {
      // Try to get existing employee
      const response = await API.get('/employees/me');
      const empData = response.data?.data || response.data;
      if (empData?._id) {
        setEmployeeData(empData);
        return empData;
      }
    } catch (err) {
      console.log('No employee found, will create one:', err.message);
    }

    // If no employee exists, create one
    try {
      const createResponse = await API.post('/employees', {
        userId: userData._id,
        email: userData.email,
        firstName: userData.name?.split(' ')[0] || 'User',
        lastName: userData.name?.split(' ').slice(1).join(' ') || '',
        role: userData.role || 'Employee',
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0]
      });
      const newEmp = createResponse.data?.data || createResponse.data;
      setEmployeeData(newEmp);
      return newEmp;
    } catch (createErr) {
      console.error('Failed to create employee:', createErr);
      return null;
    }
  }, []);

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const login = async (email, password, rememberMe = false) => {
    setError(null);
    setLoading(true);
    
    try {
      const data = await authService.login(email, password);
      const authUser = data?.user || data;
      const storage = rememberMe ? localStorage : sessionStorage;

      // Fetch or create employee
      const employee = await fetchOrCreateEmployee(authUser);

      const userObj = {
        _id: authUser?._id,
        name: authUser?.name,
        email: authUser?.email,
        role: authUser?.role,
        employeeId: employee?.employeeId || null,
        employee: employee || null
      };

      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(userObj));

      setToken(data.token);
      setUser(userObj);
      setEmployeeData(employee);

      // Fetch break status after login
      setTimeout(() => fetchBreakStatus(), 500);

      if (userObj) {
        setTimeout(async () => {
          try {
            const { date, time } = getBrowserDateTime();
            const checkInRes = await authService.checkIn({
              date,
              checkInTime: time,
              location: "Office"
            });
            if (checkInRes && checkInRes.attendance) {
              storage.setItem("attendanceId", checkInRes.attendance._id);
            }
          } catch (checkInErr) {
            console.error("Auto check-in failed during login:", checkInErr);
          }
        }, 100);
      }
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER ──────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    setError(null);
    setLoading(true);
    
    try {
      const data = await authService.register({ name, email, password });
      const authUser = data?.user || data;
      
      // Fetch or create employee
      const employee = await fetchOrCreateEmployee(authUser);

      const userObj = {
        _id: authUser?._id,
        name: authUser?.name,
        email: authUser?.email,
        role: authUser?.role,
        employeeId: employee?.employeeId || null,
        employee: employee || null
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userObj));

      setToken(data.token);
      setUser(userObj);
      setEmployeeData(employee);
      
      setTimeout(() => fetchBreakStatus(), 500);

      if (userObj) {
        setTimeout(async () => {
          try {
            const { date, time } = getBrowserDateTime();
            const checkInRes = await authService.checkIn({
              date,
              checkInTime: time,
              location: "Office"
            });
            if (checkInRes && checkInRes.attendance) {
              localStorage.setItem("attendanceId", checkInRes.attendance._id);
            }
          } catch (checkInErr) {
            console.error("Auto check-in failed during signup:", checkInErr);
          }
        }, 100);
      }
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      if (user) {
        try {
          const { date, time } = getBrowserDateTime();
          await authService.checkOut({
            date,
            checkOutTime: time
          });
        } catch (checkOutErr) {
          console.error("Auto check-out failed during logout:", checkOutErr);
        }
      }
      await authService.logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearSession();
      setBreakStatus(null);
      setEmployeeData(null);
      setLoading(false);
    }
  }, [clearSession, user]);

  // ─── PERSIST SESSION ──────────────────────────────────────────────────────
  const persistSession = (data, rememberMe = true) => {
    const authUser = data?.user || data;
    const userObj = {
      _id: authUser?._id,
      name: authUser?.name,
      email: authUser?.email,
      role: authUser?.role,
    };
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("token", data.token);
    storage.setItem("user", JSON.stringify(userObj));
    setToken(data.token);
    setUser(userObj);
    setTimeout(() => fetchBreakStatus(), 500);
    return userObj;
  };

  // ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────
  const loginWithGoogle = async (credential, rememberMe = true) => {
    setError(null);
    setLoading(true);
    
    try {
      const data = await authService.googleLogin(credential);
      const userObj = persistSession(data, rememberMe);
      
      // Fetch or create employee
      const employee = await fetchOrCreateEmployee(userObj);
      setEmployeeData(employee);

      if (userObj) {
        setTimeout(async () => {
          try {
            const { date, time } = getBrowserDateTime();
            const checkInRes = await authService.checkIn({
              date,
              checkInTime: time,
              location: "Office",
            });
            if (checkInRes?.attendance) {
              const storage = rememberMe ? localStorage : sessionStorage;
              storage.setItem("attendanceId", checkInRes.attendance._id);
            }
          } catch (checkInErr) {
            console.error("Auto check-in failed after Google login:", checkInErr);
          }
        }, 100);
      }
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Google sign-in failed. Please try again.";
      setError(message);
      throw new Error(message, { cause: err });
    } finally {
      setLoading(false);
    }
  };

  // ─── START BREAK ──────────────────────────────────────────────────────────
  const startBreak = useCallback(async (breakType) => {
    try {
      const response = await API.post('/attendance/break/start', { breakType });
      const data = response.data?.data || response.data || {};
      await fetchBreakStatus();
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to start break';
      setError(message);
      throw new Error(message, { cause: err });
    }
  }, [fetchBreakStatus]);

  // ─── END BREAK ──────────────────────────────────────────────────────────
  const endBreak = useCallback(async () => {
    try {
      const response = await API.post('/attendance/break/end');
      const data = response.data?.data || response.data || {};
      await fetchBreakStatus();
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to end break';
      setError(message);
      throw new Error(message, { cause: err });
    }
  }, [fetchBreakStatus]);

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        breakStatus,
        employeeData,
        login,
        register,
        loginWithGoogle,
        logout,
        clearError,
        startBreak,
        endBreak,
        fetchBreakStatus,
        fetchOrCreateEmployee,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}