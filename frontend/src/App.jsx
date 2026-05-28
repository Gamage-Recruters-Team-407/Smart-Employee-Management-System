// // 

// import { Route, Routes, Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
// import { MockAuthProvider } from "./context/MockAuthContext";

// import Login from "./pages/Login";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";

// import Dashboard from "./pages/Dashboard";
// <<<<<<< HEAD
// import Employees from "./pages/Employees";
// import EmployeeProfile from "./pages/EmployeeProfile";
// =======
// >>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
// import DashboardHome from "./components/common/DashboardHome";
// import Employees from "./pages/Employees";
// import EmployeeAccount from "./pages/EmployeeAccount";
// import Attendance from "./pages/Attendance";
// import Leave from "./pages/Leave";
// import Payroll from "./pages/Payroll";
// <<<<<<< HEAD
// import Notifications from "./pages/Notifications";
// import Login from "./pages/Login";
// =======
// import Performance from "./pages/Performance";
// import Tasks from "./pages/Tasks";
// import MyTasks from "./pages/MyTasks";

// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated, loading } = useAuth();
//   const location = useLocation();

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return children;
// };
// >>>>>>> 1fb63b3360fb66ed30b436aa24ad432255b11aea

// function App() {
//   return (
// <<<<<<< HEAD
//     <Routes>
//       <Route path="/login" element={<Login />} />
//       <Route path="/" element={<Dashboard />}>
//         <Route index element={<DashboardHome />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="employees/:id" element={<EmployeeProfile />} />
//         <Route path="attendance" element={<Attendance />} />
//         <Route path="leaves" element={<Leave />} />
//         <Route path="payroll" element={<Payroll />} />
//         <Route path="performance" element={<Performance />} />
//         <Route path="notifications" element={<Notifications />} />
//       </Route>
//     </Routes>
// =======
//     <MockAuthProvider>
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/reset-password/:token" element={<ResetPassword />} />

//         <Route
//           path="/"
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           }
//         >
//           <Route index element={<DashboardHome />} />
//           <Route path="employees" element={<Employees />} />
//           <Route path="employees/:id" element={<EmployeeAccount />} />
//           <Route path="attendance" element={<Attendance />} />
//           <Route path="leaves" element={<Leave />} />
//           <Route path="payroll" element={<Payroll />} />
//           <Route path="performance" element={<Performance />} />
//           <Route path="tasks" element={<Tasks />} />
//           <Route path="my-tasks" element={<MyTasks />} />
//         </Route>

//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </MockAuthProvider>
// >>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
//   );
// }

// export default App;

import { Route, Routes, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { MockAuthProvider } from "./context/MockAuthContext";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";

import DashboardHome from "./components/common/DashboardHome";

import Employees from "./pages/Employees";
import EmployeeAccount from "./pages/EmployeeAccount";

import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";

import Tasks from "./pages/Tasks";
import MyTasks from "./pages/MyTasks";

import Notifications from "./pages/Notifications";

// ─────────────────────────────────────────────
// Protected Route
// ─────────────────────────────────────────────

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────

function App() {
  return (
    <MockAuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />

          <Route
            path="employees"
            element={<Employees />}
          />

          <Route
            path="employees/:id"
            element={<EmployeeAccount />}
          />

          <Route
            path="attendance"
            element={<Attendance />}
          />

          <Route
            path="leaves"
            element={<Leave />}
          />

          <Route
            path="payroll"
            element={<Payroll />}
          />

          <Route
            path="performance"
            element={<Performance />}
          />

          <Route
            path="tasks"
            element={<Tasks />}
          />

          <Route
            path="my-tasks"
            element={<MyTasks />}
          />

          <Route
            path="notifications"
            element={<Notifications />}
          />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </MockAuthProvider>
  );
}

export default App;