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
