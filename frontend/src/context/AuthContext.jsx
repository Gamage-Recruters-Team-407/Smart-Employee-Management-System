// import { createContext, useContext, useState,  useCallback } from "react";
// import { authService } from "../services/authService";

// const AuthContext = createContext(null);

// // ─── HELPER FUNCTION: STORAGE එකෙන් SESSION එක මුලින්ම කියවීම ───────────────────
// const getInitialAuthData = () => {
//   let token = localStorage.getItem("token");
//   let user = localStorage.getItem("user");

//   // Clean up string "undefined" if present
//   if (token === "undefined") { localStorage.removeItem("token"); token = null; }
//   if (user === "undefined") { localStorage.removeItem("user"); user = null; }

//   // Fallback to sessionStorage
//   if (!token || !user) {
//     const sessToken = sessionStorage.getItem("token");
//     const sessUser = sessionStorage.getItem("user");
//     if (sessToken && sessToken !== "undefined") token = sessToken;
//     if (sessUser && sessUser !== "undefined") user = sessUser;
//   }

//   try {
//     return {
//       token,
//       user: user ? JSON.parse(user) : null
//     };
//   } catch (e) {
//     console.error("Initial session parsing failed:", e);
//     return { token: null, user: null };
//   }
// };

// export const AuthProvider = ({ children }) => {
//   // 💡 STATE INITIALIZERS: ඇප් එක ලෝඩ් වෙද්දීම සෙස්ෂන් එක කෙලින්ම මෙතනින් රීස්ටෝර් වේ!
//   const [initialData] = useState(() => getInitialAuthData());
  
//   const [token, setToken] = useState(initialData.token);
//   const [user, setUser] = useState(initialData.user);
//   const [loading, ] = useState(false); // 👈 මුලින්ම ලෝඩින් එක false කරන්න පුළුවන්, මොකද දත්ත දැනටමත් ඇත!
//   const [error, setError] = useState(null);

//   // Clear session
//   const clearSession = useCallback(() => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("attendanceId");
//     sessionStorage.removeItem("token");
//     sessionStorage.removeItem("user");
//     sessionStorage.removeItem("attendanceId");

//     setToken(null);
//     setUser(null);
//   }, []);

//   // ─── ❌ පරණ LINE 59 තිබ්බ කරදරකාරී EFFECT එක සම්පූර්ණයෙන්ම ඉවත් කර පිරිසිදු කරන ලදී ───
//   // එය දැන් අවශ්‍ය නැත, මොකද useState Initializer එක හරහා වැඩේ 100% ක් ලූප්-ආරක්ෂිතව සිද්දවේ.

//   const getBrowserDateTime = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");
//     const day = String(now.getDate()).padStart(2, "0");
//     const dateStr = `${year}-${month}-${day}`;

//     const hours = String(now.getHours()).padStart(2, "0");
//     const minutes = String(now.getMinutes()).padStart(2, "0");
//     const timeStr = `${hours}:${minutes}`;

//     return { date: dateStr, time: timeStr };
//   };

//   // Login
//   const login = async (email, password, rememberMe = false) => {
//     setError(null);
//     try {
//       const data = await authService.login(email, password);
//       const storage = rememberMe ? localStorage : sessionStorage;

//       const userObj = {
//         _id: data._id,
//         name: data.name,
//         email: data.email,
//         role: data.role
//       };

//       storage.setItem("token", data.token);
//       storage.setItem("user", JSON.stringify(userObj));

//       setToken(data.token);
//       setUser(userObj);

//       if (userObj) {
//         try {
//           const { date, time } = getBrowserDateTime();
//           const checkInRes = await authService.checkIn({
//             date,
//             checkInTime: time,
//             location: "Office"
//           });
//           if (checkInRes && checkInRes.attendance) {
//             storage.setItem("attendanceId", checkInRes.attendance._id);
//           }
//         } catch (checkInErr) {
//           console.error("Auto check-in failed during login:", checkInErr);
//         }
//       }
//       return data;
//     } catch (err) {
//       const message = err.response?.data?.message || "Login failed. Please try again.";
//       setError(message);
//       throw new Error(message);
//     }
//   };

//   // Register / Signup
//   const register = async (name, email, password) => {
//     setError(null);
//     try {
//       const data = await authService.register({ name, email, password });
//       const userObj = {
//         _id: data._id,
//         name: data.name,
//         email: data.email,
//         role: data.role
//       };

//       localStorage.setItem("token", data.token);
//       localStorage.setItem("user", JSON.stringify(userObj));

//       setToken(data.token);
//       setUser(userObj);

//       if (userObj) {
//         try {
//           const { date, time } = getBrowserDateTime();
//           const checkInRes = await authService.checkIn({
//             date,
//             checkInTime: time,
//             location: "Office"
//           });
//           if (checkInRes && checkInRes.attendance) {
//             localStorage.setItem("attendanceId", checkInRes.attendance._id);
//           }
//         } catch (checkInErr) {
//           console.error("Auto check-in failed during signup:", checkInErr);
//         }
//       }
//       return data;
//     } catch (err) {
//       const message = err.response?.data?.message || "Registration failed. Please try again.";
//       setError(message);
//       throw new Error(message);
//     }
//   };

//   // Logout
//   const logout = useCallback(async () => {
//     try {
//       if (user) {
//         try {
//           const { date, time } = getBrowserDateTime();
//           await authService.checkOut({
//             date,
//             checkOutTime: time
//           });
//         } catch (checkOutErr) {
//           console.error("Auto check-out failed during logout:", checkOutErr);
//         }
//       }
//       await authService.logout();
//     } catch (err) {
//       console.error("Logout request failed:", err);
//     } finally {
//       clearSession();
//     }
//   }, [clearSession, user]);

//   const clearError = () => {
//     setError(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         loading,
//         error,
//         login,
//         register,
//         logout,
//         clearError,
//         isAuthenticated: !!token,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) {
//     throw new Error("useAuth must be used inside AuthProvider");
//   }
//   return ctx;
// };

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

// ─── HELPER FUNCTION: STORAGE එකෙන් SESSION එක මුලින්ම කියවීම ───────────────────
const getInitialAuthData = () => {
  let token = localStorage.getItem("token");
  let user = localStorage.getItem("user");

  // Clean up string "undefined" if present
  if (token === "undefined") { localStorage.removeItem("token"); token = null; }
  if (user === "undefined") { localStorage.removeItem("user"); user = null; }

  // Fallback to sessionStorage
  if (!token || !user) {
    const sessToken = sessionStorage.getItem("token");
    const sessUser = sessionStorage.getItem("user");
    if (sessToken && sessToken !== "undefined") token = sessToken;
    if (sessUser && sessUser !== "undefined") user = sessUser;
  }

  try {
    return {
      token,
      user: user ? JSON.parse(user) : null
    };
  } catch (e) {
    console.error("Initial session parsing failed:", e);
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  // 💡 STATE INITIALIZERS: ඇප් එක ලෝඩ් වෙද්දීම සෙස්ෂන් එක කෙලින්ම මෙතනින් රීස්ටෝර් වේ!
  const [initialData] = useState(() => getInitialAuthData());
  
  const [token, setToken] = useState(initialData.token);
  const [user, setUser] = useState(initialData.user);
  const [loading] = useState(false); 
  const [error, setError] = useState(null);

  // Clear session
  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("attendanceId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("attendanceId");

    setToken(null);
    setUser(null);
  }, []);

  const getBrowserDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    return { date: dateStr, time: timeStr };
  };

  // Login
  const login = async (email, password, rememberMe = false) => {
    setError(null);
    try {
      const data = await authService.login(email, password);
      const authUser = data?.user || data;
      const storage = rememberMe ? localStorage : sessionStorage;

      const userObj = {
        _id: authUser?._id,
        name: authUser?.name,
        email: authUser?.email,
        role: authUser?.role
      };

      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(userObj));

      setToken(data.token);
      setUser(userObj);

      // 💡 FIX: Auto check-in එක setTimeout එකක් ඇතුළට දමා ප්‍රධාන Render Cycle එකෙන් නිදහස් කරන ලදී
      if (userObj) {
        setTimeout(async () => {
          try {
            const { date, time } = getBrowserDateTime();
            const checkInRes = await authService.checkIn({
              date,
              checkInTime: time,
              location: "Office"
            });
            if (checkInRes && checkInRes.attendance) {
              storage.setItem("attendanceId", checkInRes.attendance._id);
            }
          } catch (checkInErr) {
            console.error("Auto check-in failed during login:", checkInErr);
          }
        }, 100); // මිලිසෙකන්ඩ් 100ක ප්‍රමාදයක් දීමෙන් Cascading render එක වළකී
      }
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Login failed. Please try again.";
      setError(message);
      // 💡 FIX: Error එකක් විසි කරද්දී සැබෑ දෝෂයට හේතුව (cause) මෙලෙස අමුණන ලදී
      throw new Error(message, { cause: err });
    }
  };

  // Register / Signup
  const register = async (name, email, password) => {
    setError(null);
    try {
      const data = await authService.register({ name, email, password });
      const authUser = data?.user || data;
      const userObj = {
        _id: authUser?._id,
        name: authUser?.name,
        email: authUser?.email,
        role: authUser?.role
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(userObj));

      setToken(data.token);
      setUser(userObj);

      // 💡 FIX: Auto check-in එක setTimeout එකක් ඇතුළට දමා ප්‍රධාන Signup Render Cycle එකෙන් නිදහස් කරන ලදී
      if (userObj) {
        setTimeout(async () => {
          try {
            const { date, time } = getBrowserDateTime();
            const checkInRes = await authService.checkIn({
              date,
              checkInTime: time,
              location: "Office"
            });
            if (checkInRes && checkInRes.attendance) {
              localStorage.setItem("attendanceId", checkInRes.attendance._id);
            }
          } catch (checkInErr) {
            console.error("Auto check-in failed during signup:", checkInErr);
          }
        }, 100);
      }
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
      // 💡 FIX: Signup error එකටත් 'cause' එක මෙලෙස අමුණන ලදී
      throw new Error(message, { cause: err });
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      if (user) {
        try {
          const { date, time } = getBrowserDateTime();
          await authService.checkOut({
            date,
            checkOutTime: time
          });
        } catch (checkOutErr) {
          console.error("Auto check-out failed during logout:", checkOutErr);
        }
      }
      await authService.logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession, user]);

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 💡 FIX: Named function එකක් ලෙස සකස් කර TypeScript/Linter 'never' type inference එක නිවැරදි කරන ලදී
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
