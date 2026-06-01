import { useState, useEffect } from "react";
import API from "../services/api";

const MANAGER_ROLES = ["Admin", "HR", "Manager"];

const getStoredRole = () => {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw)?.role;
  } catch {
    return null;
  }
};

const defaultCaps = {
  canManageTasks: false,
  canCreateTasks: false,
  canAssignTasks: false,
  canUpdateProgress: true,
  canAddComments: true,
  canTrackStatus: true,
  workflow: ["To Do", "In Progress", "Review", "Completed"],
  department: null,
  designation: null,
  isHrManager: false,
  role: null,
  loading: true,
};

export function useTaskCapabilities() {
  const [caps, setCaps] = useState(defaultCaps);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const storedRole = getStoredRole();
      const roleFallback = MANAGER_ROLES.includes(storedRole);

      try {
        const { data } = await API.get("/tasks/capabilities");
        if (!cancelled) {
          setCaps({ ...data, loading: false });
        }
      } catch {
        if (!cancelled) {
          setCaps({
            ...defaultCaps,
            canManageTasks: roleFallback,
            canCreateTasks: roleFallback,
            canAssignTasks: roleFallback,
            role: storedRole,
            loading: false,
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return caps;
}

export default useTaskCapabilities;
