/**
 * Shared Socket.IO connection configuration.
 *
 * Derives the WebSocket server URL from VITE_API_URL so there is a single
 * source of truth for both REST calls and Socket.IO connections.
 */
export function getSocketConfig() {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  // Derive the base URL by stripping the /api suffix
  let baseUrl;
  if (apiUrl.startsWith("http")) {
    baseUrl = apiUrl.replace(/\/api\/?$/, "");
  } else {
    baseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  }

  return {
    url: baseUrl,
    options: {
      transports: ["websocket"], // Required by Vercel (no long-polling)
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    },
  };
}
