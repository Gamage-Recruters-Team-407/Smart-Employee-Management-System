// frontend/src/hooks/useAttendanceSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getSocketConfig } from "../utils/socketConfig";
import { setWorkerInterval, clearWorkerInterval } from "../utils/socketWorkerTimer";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────
/**
 * How often (ms) the background worker timer checks the socket connection.
 * 30 s is a safe interval — short enough to reconnect quickly, but not so
 * aggressive that it creates unnecessary network traffic.
 *
 * Why a worker timer?  Standard browser setInterval is throttled to ~1 Hz
 * (or completely paused) when the tab is hidden or minimized.  A Web Worker
 * timer runs on a separate thread that is NOT subject to background throttling,
 * so the health-check fires reliably even when the user switches tabs or the
 * OS minimizes the browser window.
 */
const HEALTH_CHECK_INTERVAL_MS = 30_000;

const useAttendanceSocket = (user, onAuthenticated) => {
  const socketRef = useRef(null);
  const onAuthenticatedRef = useRef(onAuthenticated);
  // Store the worker-timer ID so we can cancel it on cleanup
  const healthCheckIdRef = useRef(null);

  // Keep callback ref up-to-date without restarting the effect
  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  useEffect(() => {
    // Only connect if the user exists
    if (!user) return;

    // Use shared socket configuration
    const { url, options } = getSocketConfig();

    // Connect to the WebSocket
    const socket = io(url, {
      ...options,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // Expose on window so BreakNotification can emit break-started / break-ended
    window.socket = socket;

    console.log("🔌 Attempting to connect to WebSocket...");

    // ─── AUTHENTICATE HELPER ─────────────────────────────────────────────
    /**
     * Emit the authenticate event only when the socket is already connected.
     * The backend responds with the "authenticated" event and sets the
     * employee's onlineStatus to "Online" in the database.
     */
    const authenticate = () => {
      if (socket.connected) {
        console.log("🔑 Authenticating employee via socket...");
        socket.emit("authenticate", {
          employeeId: user.employeeId,
          userId: user.id || user._id,
        });
      }
    };

    // ─── HEALTH-CHECK LOOP (Web Worker timer) ────────────────────────────
    /**
     * This interval runs inside a Web Worker thread.
     *
     * Unlike window.setInterval, it is NOT throttled when the browser tab is
     * put to sleep, minimized, or the user switches to another tab.  Every
     * HEALTH_CHECK_INTERVAL_MS the worker fires and:
     *   1. If the socket is disconnected  → call socket.connect() to reopen it.
     *   2. If the socket is connected but we might have missed authentication
     *      (e.g. the tab was sleeping when the "connect" event fired)
     *      → re-authenticate so the backend marks the employee as Online.
     */
    const startHealthCheck = () => {
      // Guard: clear any existing timer before starting a new one
      if (healthCheckIdRef.current !== null) {
        clearWorkerInterval(healthCheckIdRef.current);
      }

      healthCheckIdRef.current = setWorkerInterval(() => {
        if (!socket.connected) {
          console.log("⚙️ [Worker] Socket disconnected. Reconnecting...");
          socket.connect();
        } else {
          // Re-authenticate to guarantee the server has us marked Online.
          // This is a no-op if the backend already has us as Online.
          console.log("⚙️ [Worker] Health-check ping — re-authenticating...");
          authenticate();
        }
      }, HEALTH_CHECK_INTERVAL_MS);

      console.log(
        `✅ Worker health-check started (every ${HEALTH_CHECK_INTERVAL_MS / 1000}s)`
      );
    };

    // ─── SOCKET EVENT HANDLERS ───────────────────────────────────────────
    socket.on("connect", () => {
      console.log("✅ Connected to server. Authenticating employee...");
      authenticate();
      // Start the background health-check loop once connected
      startHealthCheck();
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
      window.dispatchEvent(
        new CustomEvent("socket-disconnected", { detail: { reason } })
      );
      // The health-check worker will detect the disconnected state on its
      // next tick and call socket.connect() automatically — no extra logic needed.
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      authenticate();
    });

    // ─── SECONDARY: Visibility & Online Listeners ────────────────────────
    /**
     * These are an additional "fast path" that fires immediately when the
     * user brings the tab back into focus, so we don't wait up to 30 s for
     * the next worker tick.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👀 Tab became visible. Verifying socket connection...");
        if (!socket.connected) {
          console.log("🔌 Socket disconnected — reconnecting immediately...");
          socket.connect();
        } else {
          // Fast re-authenticate so the backend picks up Online status right away
          authenticate();
        }
      }
    };

    const handleOnline = () => {
      console.log("🌐 Browser back online. Reconnecting socket...");
      if (!socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    // ─── CLEANUP ─────────────────────────────────────────────────────────
    // Runs on component unmount (logout / route change out of Dashboard).
    // Disconnecting the socket triggers the backend disconnect handler which
    // sets the employee's onlineStatus to "Offline".
    return () => {
      console.log("🔌 Disconnecting socket (component unmount / logout)...");

      // Stop the worker health-check timer first
      if (healthCheckIdRef.current !== null) {
        clearWorkerInterval(healthCheckIdRef.current);
        healthCheckIdRef.current = null;
        console.log("⛔ Worker health-check stopped.");
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);

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
