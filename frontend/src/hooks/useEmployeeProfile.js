import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  EMPLOYEE_PROFILE_UPDATED,
  notifyEmployeeProfileUpdated,
} from "../utils/employeeProfileEvents";

const syncStoredUserName = (employee) => {
  if (!employee?.email) return;
  const displayName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!displayName) return;

  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem("user");
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed.email?.toLowerCase() === employee.email.toLowerCase()) {
        if (parsed.name !== displayName) {
          parsed.name = displayName;
          storage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch {
      /* ignore */
    }
  }
};

/**
 * Loads /employees/me and refreshes when HR updates the profile or user returns to the app.
 */
export function useEmployeeProfile({ enabled = true } = {}) {
  const { user } = useAuth();
  const location = useLocation();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!enabled || !user?.email) {
      setEmployee(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await API.get("/employees/me");
      setEmployee(data);
      console.log("Employee profile fetched:", data);
      syncStoredUserName(data);
      notifyEmployeeProfileUpdated(data);
    } catch (err) {
      setEmployee(null);
      setError(err.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "") {
      fetchProfile();
    }
  }, [location.pathname, fetchProfile]);

  useEffect(() => {
    const onUpdated = (event) => {
      const updated = event.detail;
      if (
        updated?.email &&
        user?.email &&
        updated.email.toLowerCase() === user.email.toLowerCase()
      ) {
        setEmployee(updated);
        syncStoredUserName(updated);
        return;
      }
      fetchProfile();
    };

    const onFocus = () => fetchProfile();

    window.addEventListener(EMPLOYEE_PROFILE_UPDATED, onUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener(EMPLOYEE_PROFILE_UPDATED, onUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchProfile, user?.email]);

  const displayName =
    employee?.firstName || employee?.lastName
      ? [employee.firstName, employee.lastName].filter(Boolean).join(" ")
      : user?.name || "User";

  return { employee, loading, error, displayName, refetch: fetchProfile };
}
