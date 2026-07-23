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

// 💡 අලුතෙන් එකතු කළ කෑලි ටික:
export const saveAuthSession = ({ token, user }, remember = false) => {
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;

  other.removeItem("token");
  other.removeItem("user");

  storage.setItem("token", token);
  storage.setItem("user", JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};

export const getStoredUser = () => {
  for (const storage of [localStorage, sessionStorage]) {
    const raw = storage.getItem("user");
    if (!raw) continue;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
};