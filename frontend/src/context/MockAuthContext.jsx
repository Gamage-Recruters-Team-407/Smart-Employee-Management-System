/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  FALLBACK_MOCK_USER,
  MOCK_USER_STORAGE_KEY,
} from "../config/mockAuth";

const MockAuthContext = createContext(null);

/**
 * TEMPORARY: simulates logged-in employee via localStorage + header.
 * FIX: Added loading loops prevention and reference checks.
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
    
    setUser((prevUser) => {
      if (prevUser?._id === mockUser._id) return prevUser;
      return mockUser;
    });
  }, []);

  // ✅ Safe array extraction helper
  const extractEmployeesArray = useCallback((response) => {
    // If response is an array, return it directly
    if (Array.isArray(response)) {
      return response;
    }
    // If response has a data property that is an array
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    // If response has a data property that has a data property (nested)
    if (response?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // If response has a results property
    if (response && Array.isArray(response.results)) {
      return response.results;
    }
    // Fallback: empty array
    console.warn('Unexpected response format for employees:', response);
    return [];
  }, []);

  // ✅ මුල් වරට ඇප් එක ලෝඩ් වෙද්දී පමණක් සෙස්ෂන් එක හදන ශ්‍රිතය
  const loadMockSession = useCallback(async () => {
    try {
      const response = await API.get("/employees");
      
      // Extract the employees array safely
      const employeesList = extractEmployeesArray(response);
      setEmployees(employeesList);

      const savedId =
        localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
        import.meta.env.VITE_MOCK_EMPLOYEE_ID;

      // Use the extracted list
      const match =
        employeesList.find((e) => e._id === savedId) ||
        employeesList.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
        employeesList[0];

      if (match) {
        applyEmployee(match);
      } else if (FALLBACK_MOCK_USER._id) {
        setUser(FALLBACK_MOCK_USER);
      }
    } catch (err) {
      console.error("Mock auth load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [applyEmployee, extractEmployeesArray]);

  // ─── Synchronous-Safe Session Loader ────────────────────────────────────────
  useEffect(() => {
    let ignore = false;

    const runSession = async () => {
      try {
        const response = await API.get("/employees");
        
        if (ignore) return;

        // Extract the employees array safely
        const employeesList = extractEmployeesArray(response);
        setEmployees(employeesList);

        const savedId =
          localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
          import.meta.env.VITE_MOCK_EMPLOYEE_ID;

        // Use the extracted list
        const match =
          employeesList.find((e) => e._id === savedId) ||
          employeesList.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
          employeesList[0];

        if (match) {
          applyEmployee(match);
        } else if (FALLBACK_MOCK_USER._id) {
          setUser(FALLBACK_MOCK_USER);
        }
      } catch (err) {
        console.error("Mock auth load failed:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    runSession();

    // ─── CLEANUP FUNCTION ─────────────────────────────────────────────────────
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyEmployee, extractEmployeesArray]);

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

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}