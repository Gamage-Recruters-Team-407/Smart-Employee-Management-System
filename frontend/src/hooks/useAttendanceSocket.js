// frontend/src/hooks/useAttendanceSocket.js
import { useEffect } from "react";
import { io } from "socket.io-client";

const useAttendanceSocket = (user) => {
  useEffect(() => {
    // Only connect if the user exists and is an Employee
    if (!user || !user.employeeId) return;

    // Determine the backend URL (adjust if using Vite/CRA environments)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    
    // Connect to the WebSocket
    const socket = io(backendUrl);
    console.log("Attempting to connect to WebSocket...");

    socket.on("connect", () => {
      console.log("Connected to server. Initiating auto check-in...");
      // Send the authenticate event immediately upon connection
      socket.emit("authenticate", { employeeId: user.employeeId });
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });

    // Cleanup function runs when the component unmounts (e.g., user logs out)
    // or when the browser tab is closed. This instantly triggers the check-out on the backend.
    return () => {
      socket.disconnect();
    };
  }, [user]); // Re-run if the user object changes
};

export default useAttendanceSocket;
