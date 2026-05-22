import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setToken(null);
    setUser(null);
  }, []);

  // Restore session on refresh
  useEffect(() => {
    const storedToken =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const storedUser =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Session restore failed:", error);
        clearSession();
      }
    }

    setLoading(false);
  }, [clearSession]);

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

  // Login
  const login = async (
    email,
    password,
    rememberMe = false
  ) => {
    setError(null);

    try {
      const data = await authService.login(
        email,
        password
      );

      const storage = rememberMe
        ? localStorage
        : sessionStorage;

      storage.setItem("token", data.token);
      storage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      // Record check-in automatically for Employee role using local browser time
      if (data.user && data.user.role === "Employee") {
        try {
          const { date, time } = getBrowserDateTime();
          await authService.checkIn({
            date,
            checkInTime: time,
            location: "Office"
          });
        } catch (checkInErr) {
          console.error("Auto check-in failed during login:", checkInErr);
        }
      }

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Login failed. Please try again.";

      setError(message);
      throw new Error(message);
    }
  };

  // Register / Signup
  const register = async (
    name,
    email,
    password
  ) => {
    setError(null);

    try {
      const data = await authService.register({
        name,
        email,
        password,
      });

      // Auto login after signup
      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      // Record check-in automatically for Employee role using local browser time
      if (data.user && data.user.role === "Employee") {
        try {
          const { date, time } = getBrowserDateTime();
          await authService.checkIn({
            date,
            checkInTime: time,
            location: "Office"
          });
        } catch (checkInErr) {
          console.error("Auto check-in failed during signup:", checkInErr);
        }
      }

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);
      throw new Error(message);
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      // Record check-out automatically for Employee role using local browser time
      if (user && user.role === "Employee") {
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
    }
  }, [clearSession, user]);

  // Clear error
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
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
};