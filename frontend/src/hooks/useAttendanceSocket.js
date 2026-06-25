// frontend/src/hooks/useAttendanceSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const useAttendanceSocket = (user, onAuthenticated) => {
  const socketRef = useRef(null);
  const onAuthenticatedRef = useRef(onAuthenticated);

  // Keep callback ref updated
  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  useEffect(() => {
    // Only connect if the user exists
    if (!user) return;

    // Determine the backend URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // Connect to the WebSocket
    const socket = io(backendUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Expose on window so BreakNotification can emit break-started / break-ended
    window.socket = socket;

    console.log("🔌 Attempting to connect to WebSocket...");

    socket.on("connect", () => {
      console.log("✅ Connected to server. Authenticating employee...");
      // Send the authenticate event — backend sets onlineStatus to "Online"
      socket.emit("authenticate", { employeeId: user.employeeId, userId: user.id || user._id });
    });

    socket.on("authenticated", (data) => {
      console.log("🟢 Employee authenticated via socket:", data);
      if (onAuthenticatedRef.current) {
        onAuthenticatedRef.current(data);
      }
      window.dispatchEvent(new CustomEvent("socket-authenticated", { detail: data }));
    });

    socket.on("attendance-update", (data) => {
      console.log("📡 Attendance update received:", data);
    });

    socket.on("badge-update", () => {
      console.log("🔔 Badge update received via socket");
      window.dispatchEvent(new CustomEvent("socket-badge-update"));
    });

    socket.on("error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
      window.dispatchEvent(new CustomEvent("socket-disconnected", { detail: { reason } }));
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      // Re-authenticate after reconnection
      socket.emit("authenticate", { employeeId: user.employeeId, userId: user.id || user._id });
    });

    // Cleanup: runs when the component unmounts (logout) or tab closes
    // This triggers the backend disconnect handler → sets status to "Offline"
    return () => {
      console.log("🔌 Disconnecting socket (component unmount / logout)...");
      socket.disconnect();
      socketRef.current = null;
      if (window.socket === socket) {
        window.socket = null;
      }
    };
  }, [user?.id, user?._id, user?.employeeId]);

  return socketRef;
};

export default useAttendanceSocket;
