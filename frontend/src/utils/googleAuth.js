/**
 * Start URL for Google OAuth in the browser.
 * In dev, always use the Vite dev server (proxy → backend), never open :5000 directly.
 */
export function getGoogleAuthStartUrl() {
  const path = "/api/auth/google";

  if (!import.meta.env.DEV) {
    return new URL(path, window.location.origin).href;
  }

  const { protocol } = window.location;
  const hostname =
    window.location.hostname === "localhost"
      ? "127.0.0.1"
      : window.location.hostname;
  const vitePort = import.meta.env.VITE_DEV_PORT || "5173";

  return `${protocol}//${hostname}:${vitePort}${path}`;
}
