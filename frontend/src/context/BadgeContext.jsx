import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "./AuthContext";

const BadgeContext = createContext(null);

export const BadgeProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);

  const fetchBadges = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      setActiveTasks(0);
      return;
    }

    try {
      const [notifRes, taskRes] = await Promise.all([
        API.get("/notifications/unread-count").catch(() => ({ data: { data: { unreadCount: 0 } } })),
        API.get("/tasks/active-count").catch(() => ({ data: { activeCount: 0 } }))
      ]);

      setUnreadNotifications(notifRes.data?.data?.unreadCount ?? 0);
      setActiveTasks(taskRes.data?.activeCount ?? 0);
    } catch (err) {
      console.error("Failed to fetch badge counts:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBadges();
    // Poll every 60 seconds to keep badges somewhat in sync (fallback)
    const interval = setInterval(fetchBadges, 60000);
    
    // Listen for real-time socket updates
    const handleSocketUpdate = () => {
      fetchBadges();
    };
    window.addEventListener("socket-badge-update", handleSocketUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("socket-badge-update", handleSocketUpdate);
    };
  }, [fetchBadges]);

  return (
    <BadgeContext.Provider value={{ unreadNotifications, activeTasks, refreshBadges: fetchBadges }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadges = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error("useBadges must be used within a BadgeProvider");
  }
  return context;
};
