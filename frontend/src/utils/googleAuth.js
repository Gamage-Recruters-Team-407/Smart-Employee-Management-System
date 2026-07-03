/**
 * Start URL for Google OAuth in the browser.
 * In dev, always use the Vite dev server (proxy → backend), never open :5000 directly.
 */
export function getGoogleAuthStartUrl() {
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const cleanBase = apiBase.replace(/\/+$/, "");
  return `${cleanBase}/auth/google`;
}
