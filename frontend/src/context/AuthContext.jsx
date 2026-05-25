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

      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Registration failed. Please try again.";

      setError(message);
      throw new Error(message);
    }
  };

  // Google OAuth Login
  const googleLogin = async (googleToken) => {
    setError(null);

    try {
      const data = await authService.googleLogin(googleToken);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || data));

      setToken(data.token);
      setUser(data.user || data);

      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Google login failed. Please try again.";

      setError(message);
      throw new Error(message);
    }
  };

  // Logout
  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

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
        googleLogin,
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