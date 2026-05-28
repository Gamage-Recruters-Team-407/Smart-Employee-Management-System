import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  FALLBACK_MOCK_USER,
  MOCK_USER_STORAGE_KEY,
} from "../config/mockAuth";

const MockAuthContext = createContext(null);

/**
 * TEMPORARY: simulates logged-in employee via localStorage + header.
 * FUTURE: replace with AuthContext that stores JWT + user from login API.
 */
export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const applyEmployee = useCallback((employee) => {
    if (!employee?._id) return;
    const mockUser = {
      _id: employee._id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeId: employee.employeeId,
      role: "employee",
    };
    localStorage.setItem(MOCK_USER_STORAGE_KEY, employee._id);
    setUser(mockUser);
  }, []);

  const loadMockSession = useCallback(async () => {
    setLoading(true);
    try {
      const list = await API.get("/employees");
      setEmployees(list);

      const savedId =
        localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
        import.meta.env.VITE_MOCK_EMPLOYEE_ID;

      const match =
        list.find((e) => e._id === savedId) ||
        list.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
        list[0];

      if (match) applyEmployee(match);
      else if (FALLBACK_MOCK_USER._id) setUser(FALLBACK_MOCK_USER);
    } catch (err) {
      console.error("Mock auth load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [applyEmployee]);

  useEffect(() => {
    loadMockSession();
  }, [loadMockSession]);

  const switchMockUser = (employeeId) => {
    const emp = employees.find((e) => e._id === employeeId);
    if (emp) applyEmployee(emp);
  };

  const logout = () => {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <MockAuthContext.Provider
      value={{
        user,
        employees,
        loading,
        isAuthenticated: !!user?._id,
        switchMockUser,
        logout,
        refreshSession: loadMockSession,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = () => useContext(MockAuthContext);
