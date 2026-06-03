// // import  { createContext, useContext, useState, useEffect, useCallback } from "react";
// // import API from "../services/api";
// // import {
// //   FALLBACK_MOCK_USER,
// //   MOCK_USER_STORAGE_KEY,
// // } from "../config/mockAuth";

// // const MockAuthContext = createContext(null);

// // /**
// //  * TEMPORARY: simulates logged-in employee via localStorage + header.
// //  * FUTURE: replace with AuthContext that stores JWT + user from login API.
// //  */
// // export const MockAuthProvider = ({ children }) => {
// //   const [user, setUser] = useState(null);
// //   const [employees, setEmployees] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   const applyEmployee = useCallback((employee) => {
// //     if (!employee?._id) return;
// //     const mockUser = {
// //       _id: employee._id,
// //       email: employee.email,
// //       firstName: employee.firstName,
// //       lastName: employee.lastName,
// //       employeeId: employee.employeeId,
// //       role: "employee",
// //     };
// //     localStorage.setItem(MOCK_USER_STORAGE_KEY, employee._id);
// //     setUser(mockUser);
// //   }, []);

// //   const loadMockSession = useCallback(async () => {
// //     setLoading(true);
// //     try {
// //       const list = await API.get("/employees");
// //       setEmployees(list);

// //       const savedId =
// //         localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
// //         import.meta.env.VITE_MOCK_EMPLOYEE_ID;

// //       const match =
// //         list.find((e) => e._id === savedId) ||
// //         list.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
// //         list[0];

// //       if (match) applyEmployee(match);
// //       else if (FALLBACK_MOCK_USER._id) setUser(FALLBACK_MOCK_USER);
// //     } catch (err) {
// //       console.error("Mock auth load failed:", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [applyEmployee]);

// //   useEffect(() => {
// //     loadMockSession();
// //   }, [loadMockSession]);

// //   const switchMockUser = (employeeId) => {
// //     const emp = employees.find((e) => e._id === employeeId);
// //     if (emp) applyEmployee(emp);
// //   };

// //   const logout = () => {
// //     localStorage.removeItem(MOCK_USER_STORAGE_KEY);
// //     setUser(null);
// //   };

// //   return (
// //     <MockAuthContext.Provider
// //       value={{
// //         user,
// //         employees,
// //         loading,
// //         isAuthenticated: !!user?._id,
// //         switchMockUser,
// //         logout,
// //         refreshSession: loadMockSession,
// //       }}
// //     >
// //       {children}
// //     </MockAuthContext.Provider>
// //   );
// // };

// // export const useMockAuth = () => useContext(MockAuthContext);


// // import { createContext, useContext, useState, useEffect, useCallback } from "react";
// // import API from "../services/api";
// import { createContext, useContext, useState, useEffect, useCallback } from "react";
// import API from "../services/api";
// import {
//   FALLBACK_MOCK_USER,
//   MOCK_USER_STORAGE_KEY,
// } from "../config/mockAuth";

// const MockAuthContext = createContext(null);

// /**
//  * TEMPORARY: simulates logged-in employee via localStorage + header.
//  * FIX: Added loading loops prevention and reference checks.
//  */
// export const MockAuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // ✅ LocalStorage එකට දත්ත දමා සජීවීව User ව අප්ඩේට් කරන ශ්‍රිතය
//   const applyEmployee = useCallback((employee) => {
//     if (!employee?._id) return;
    
//     const mockUser = {
//       _id: employee._id,
//       email: employee.email,
//       firstName: employee.firstName,
//       lastName: employee.lastName,
//       employeeId: employee.employeeId,
//       role: "employee",
//     };

//     localStorage.setItem(MOCK_USER_STORAGE_KEY, employee._id);
    
//     // 💡 Infinite loop එකක් වීම වැළැක්වීමට, දැනට ඉන්න user ම නම් ආයෙ setState කරන්නේ නැත
//     setUser((prevUser) => {
//       if (prevUser?._id === mockUser._id) return prevUser;
//       return mockUser;
//     });
//   }, []);

//   // ✅ මුල් වරට ඇප් එක ලෝඩ් වෙද්දී පමණක් සෙස්ෂන් එක හදන ශ්‍රිතය
//   const loadMockSession = useCallback(async () => {
//     try {
//       const list = await API.get("/employees");
//       setEmployees(list.data || list); // Backend එකෙන් res.data ආවොත් ඒක ගනී

//       const savedId =
//         localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
//         import.meta.env.VITE_MOCK_EMPLOYEE_ID;

//       const match =
//         list.find((e) => e._id === savedId) ||
//         list.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
//         list[0];

//       if (match) {
//         applyEmployee(match);
//       } else if (FALLBACK_MOCK_USER._id) {
//         setUser(FALLBACK_MOCK_USER);
//       }
//     } catch (err) {
//       console.error("Mock auth load failed:", err);
//     } finally {
//       setLoading(false); // ✅ හැමවිටම අවසානයේ loading false වන බව සහතිකයි
//     }
//   }, [applyEmployee]);

//   // ─── Synchronous-Safe Session Loader ────────────────────────────────────────
//   useEffect(() => {
//     let ignore = false; // 💡 Strict Mode එකෙන් එන double render එක පාලනය කිරීමට flag එකක් සකසයි

//     const runSession = async () => {
//       // මෙතනදී loadMockSession එක ඇතුළේ තියෙන කේතයම ලූප ආරක්ෂිතව රන් කරයි
//       try {
//         const list = await API.get("/employees");
        
//         // යම් හෙයකින් Strict Mode එක නිසා Component එක Unmount වුණොත් මේ දත්ත බාරගන්නේ නැත
//         if (ignore) return; 

//         setEmployees(list.data || list);

//         const savedId =
//           localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
//           import.meta.env.VITE_MOCK_EMPLOYEE_ID;

//         const match =
//           list.find((e) => e._id === savedId) ||
//           list.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
//           list[0];

//         if (match) {
//           applyEmployee(match);
//         } else if (FALLBACK_MOCK_USER._id) {
//           setUser(FALLBACK_MOCK_USER);
//         }
//       } catch (err) {
//         console.error("Mock auth load failed:", err);
//       } finally {
//         if (!ignore) {
//           setLoading(false);
//         }
//       }
//     };

//     runSession();

//     // ─── CLEANUP FUNCTION ─────────────────────────────────────────────────────
//     // Component එක unmount වෙද්දී (Strict mode එකෙන් පළමු රෙන්ඩර් එක නවත්වද්දී) ignore එක true කරයි
//     return () => {
//       ignore = true;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // ✅ දැන් Dependencies සහ Async Cleanups ඔක්කොම 100% ක් ලූප්-ආරක්ෂිතයි!

//   // 💡 ඇප් එක මුලින්ම ලෝඩ් වෙද්දී (Mount) එකම එක වතාවක් පමණක් සෙස්ෂන් එක ලෝඩ් කරයි
//   // useEffect(() => {
//   //   loadMockSession();
//   //   // eslint-disable-next-line react-hooks/exhaustive-deps
//   // }, []); // 👈 Dependency array එක හිස් කිරීමෙන් අනන්ත loop එක සදහටම නතර වේ!

//   const switchMockUser = (employeeId) => {
//     const emp = employees.find((e) => e._id === employeeId);
//     if (emp) applyEmployee(emp);
//   };

//   const logout = () => {
//     localStorage.removeItem(MOCK_USER_STORAGE_KEY);
//     setUser(null);
//   };

//   return (
//     <MockAuthContext.Provider
//       value={{
//         user,
//         employees,
//         loading,
//         isAuthenticated: !!user?._id,
//         switchMockUser,
//         logout,
//         refreshSession: loadMockSession,
//       }}
//     >
//       {children}
//     </MockAuthContext.Provider>
//   );
// };

// export const useMockAuth = () => useContext(MockAuthContext);



/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  FALLBACK_MOCK_USER,
  MOCK_USER_STORAGE_KEY,
} from "../config/mockAuth";

const MockAuthContext = createContext(null);

/**
 * TEMPORARY: simulates logged-in employee via localStorage + header.
 * FIX: Added loading loops prevention and reference checks.
>>>>>>> 687d49e7c29b8cad9283c8b8232a0c5e85b99593
 */
export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ LocalStorage එකට දත්ත දමා සජීවීව User ව අප්ඩේට් කරන ශ්‍රිතය
  const applyEmployee = useCallback((employee) => {
    if (!employee?._id) return;
    
    const mockUser = {
      _id: employee._id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeId: employee.employeeId,
      role: "employee",
    };

    localStorage.setItem(MOCK_USER_STORAGE_KEY, employee._id);
    
    // 💡 Infinite loop එකක් වීම වැළැක්වීමට, දැනට ඉන්න user ම නම් ආයෙ setState කරන්නේ නැත
    setUser((prevUser) => {
      if (prevUser?._id === mockUser._id) return prevUser;
      return mockUser;
    });
  }, []);

  // ✅ මුල් වරට ඇප් එක ලෝඩ් වෙද්දී පමණක් සෙස්ෂන් එක හදන ශ්‍රිතය
  const loadMockSession = useCallback(async () => {
    try {
      const list = await API.get("/employees");
      setEmployees(list.data || list); // Backend එකෙන් res.data ආවොත් ඒක ගනී

      const savedId =
        localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
        import.meta.env.VITE_MOCK_EMPLOYEE_ID;

      const match =
        list.find((e) => e._id === savedId) ||
        list.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
        list[0];

      if (match) {
        applyEmployee(match);
      } else if (FALLBACK_MOCK_USER._id) {
        setUser(FALLBACK_MOCK_USER);
      }
    } catch (err) {
      console.error("Mock auth load failed:", err);
    } finally {
      setLoading(false); // ✅ හැමවිටම අවසානයේ loading false වන බව සහතිකයි
    }
  }, [applyEmployee]);

  // ─── Synchronous-Safe Session Loader ────────────────────────────────────────
  useEffect(() => {
    let ignore = false; // 💡 Strict Mode එකෙන් එන double render එක පාලනය කිරීමට flag එකක් සකසයි

    const runSession = async () => {
      try {
        const list = await API.get("/employees");
        
        // යම් හෙයකින් Strict Mode එක නිසා Component එක Unmount වුණොත් මේ දත්ත බාරගන්නේ නැත
        if (ignore) return; 

        setEmployees(list.data || list);

        const savedId =
          localStorage.getItem(MOCK_USER_STORAGE_KEY) ||
          import.meta.env.VITE_MOCK_EMPLOYEE_ID;

        const match =
          list.find((e) => e._id === savedId) ||
          list.find((e) => e.email === import.meta.env.VITE_MOCK_EMPLOYEE_EMAIL) ||
          list[0];

        if (match) {
          applyEmployee(match);
        } else if (FALLBACK_MOCK_USER._id) {
          setUser(FALLBACK_MOCK_USER);
        }
      } catch (err) {
        console.error("Mock auth load failed:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    runSession();

    // ─── CLEANUP FUNCTION ─────────────────────────────────────────────────────
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ දැන් Dependencies සහ Async Cleanups ඔක්කොම 100% ක් ලූප්-ආරක්ෂිතයි!

  const switchMockUser = (employeeId) => {
    const emp = employees.find((e) => e._id === employeeId);
    if (emp) applyEmployee(emp);
  };

  const logout = () => {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <MockAuthContext.Provider
      value={{
        user,
        employees,
        loading,
        isAuthenticated: !!user?._id,
        switchMockUser,
        logout,
        refreshSession: loadMockSession,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

// 💡 Named Function එකක් ලෙස export කිරීමෙන් TypeScript/Linter ගැටලු මඟහැරේ
export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}