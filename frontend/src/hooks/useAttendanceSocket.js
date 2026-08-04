// frontend/src/hooks/useAttendanceSocket.js
import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";

const useAttendanceSocket = (user, onAuthenticated) => {
  const { socket } = useSocket();
  const socketRef = useRef(socket);
  const onAuthenticatedRef = useRef(onAuthenticated);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  useEffect(() => {
    const handleAuthenticated = (e) => {
      if (onAuthenticatedRef.current) {
        onAuthenticatedRef.current(e.detail);
      }
    };

    window.addEventListener("socket-authenticated", handleAuthenticated);
    return () => {
      window.removeEventListener("socket-authenticated", handleAuthenticated);
    };
  }, []);

  return socketRef;
};

export default useAttendanceSocket;
