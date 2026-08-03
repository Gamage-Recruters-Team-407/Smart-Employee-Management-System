import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { getSocketConfig } from "../utils/socketConfig";
import { setWorkerInterval, clearWorkerInterval } from "../utils/socketWorkerTimer";
import API from "../services/api";

const SocketContext = createContext(null);

const HEALTH_CHECK_INTERVAL_MS = 30_000;

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const healthCheckIdRef = useRef(null);

  const [wsConnected, setWsConnected] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState("Offline");
  const [breakStatus, setBreakStatus] = useState(null);

  // Helper to fetch current break status from API
  const fetchBreakStatus = useCallback(async () => {
    if (!user || user.role !== "Employee") return;
    try {
      const response = await API.get("/attendance/break/status");
      const data = response.data?.data || response.data || {};
      setBreakStatus(data);
      if (data?.onlineStatus) {
        setOnlineStatus(data.onlineStatus);
      }
    } catch (err) {
      console.error("Failed to fetch break status:", err);
    }
  }, [user]);

  // Connect socket and keep it alive continuously while user is logged in
  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socketRef.current) {
        console.log("🔌 User logged out. Disconnecting global socket...");
        if (healthCheckIdRef.current !== null) {
          clearWorkerInterval(healthCheckIdRef.current);
          healthCheckIdRef.current = null;
        }
        socketRef.current.disconnect();
        socketRef.current = null;
        window.socket = null;
        setWsConnected(false);
        setOnlineStatus("Offline");
      }
      return;
    }

    const targetEmployeeId = user.employeeId || user.employee?.employeeId || null;
    const targetUserId = user.id || user._id || null;

    // Helper to send authentication payload over socket
    const authenticate = (sock) => {
      const targetSock = sock || socketRef.current;
      if (targetSock && targetSock.connected && targetEmployeeId) {
        console.log("🔑 Authenticating employee via persistent socket...", { employeeId: targetEmployeeId, userId: targetUserId });
        targetSock.emit("authenticate", {
          employeeId: targetEmployeeId,
          userId: targetUserId,
        });
      }
    };

    // If socket is not already created, create it
    if (!socketRef.current) {
      const { url, options } = getSocketConfig();
      console.log("🔌 Initializing global Socket.IO connection...");
      const socket = io(url, {
        ...options,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;
      window.socket = socket;

      // ─── HEALTH-CHECK LOOP (Web Worker timer) ───────────────
      const startHealthCheck = () => {
        if (healthCheckIdRef.current !== null) {
          clearWorkerInterval(healthCheckIdRef.current);
        }

        healthCheckIdRef.current = setWorkerInterval(() => {
          if (!socket.connected) {
            console.log("⚙️ [Worker] Socket disconnected. Reconnecting...");
            socket.connect();
          } else {
            console.log("⚙️ [Worker] Health-check ping — re-authenticating...");
            authenticate(socket);
          }
        }, HEALTH_CHECK_INTERVAL_MS);
      };

      // Event handlers
      socket.on("connect", () => {
        console.log("✅ Global socket connected. Authenticating...");
        setWsConnected(true);
        authenticate(socket);
        if (user.role === "Admin" || user.role === "HR") {
          socket.emit("join-admin");
        }
        startHealthCheck();
      });

      socket.on("authenticated", (data) => {
        console.log("🟢 Employee authenticated via socket:", data);
        if (data.onlineStatus) {
          setOnlineStatus(data.onlineStatus);
        }
        window.dispatchEvent(new CustomEvent("socket-authenticated", { detail: data }));
      });

      socket.on("attendance-update", (data) => {
        console.log("📡 Attendance update received on global socket:", data);
        if (data.employeeId === targetEmployeeId && data.onlineStatus) {
          setOnlineStatus(data.onlineStatus);
        }
        window.dispatchEvent(new CustomEvent("socket-attendance-update", { detail: data }));
      });

      socket.on("badge-update", () => {
        console.log("🔔 Badge update received via global socket");
        window.dispatchEvent(new CustomEvent("socket-badge-update"));
      });

      socket.on("disconnect", (reason) => {
        console.log("🔴 Global socket disconnected:", reason);
        setWsConnected(false);
        window.dispatchEvent(new CustomEvent("socket-disconnected", { detail: { reason } }));
      });

      socket.on("reconnect", () => {
        console.log("🔄 Global socket reconnected");
        authenticate(socket);
      });
    } else {
      // Socket already exists - if socket is connected, update auth if employeeId changed
      if (socketRef.current.connected) {
        authenticate(socketRef.current);
      }
    }

    // Tab visibility & online window event listeners
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && socketRef.current) {
        if (!socketRef.current.connected) {
          socketRef.current.connect();
        } else {
          authenticate(socketRef.current);
        }
      }
    };

    const handleOnline = () => {
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    // Initial break status fetch for employees
    if (user.role === "Employee") {
      fetchBreakStatus();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
      // NOTE: We deliberately DO NOT disconnect socketRef.current here!
      // The socket remains active across route changes while user is logged in.
    };
  }, [user, fetchBreakStatus]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        wsConnected,
        onlineStatus,
        setOnlineStatus,
        breakStatus,
        setBreakStatus,
        fetchBreakStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
