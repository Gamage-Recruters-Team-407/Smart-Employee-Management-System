/**
 * Reads JWT from the same storage keys used by AuthContext after login:
 * - "token" in localStorage (Remember me) or sessionStorage (default session)
 * - optional fallback: user.token inside stored "user" JSON
 */
export const getAuthToken = () => {
  for (const storage of [localStorage, sessionStorage]) {
    const token = storage.getItem("token");
    if (token) return token;
  }

  for (const storage of [localStorage, sessionStorage]) {
    const userRaw = storage.getItem("user");
    if (!userRaw) continue;
    try {
      const user = JSON.parse(userRaw);
      if (user?.token) return user.token;
    } catch {
      // ignore invalid JSON
    }
  }

  return null;
};

export const hasAuthToken = () => Boolean(getAuthToken());
