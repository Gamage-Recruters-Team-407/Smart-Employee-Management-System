import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { BadgeProvider } from "./context/BadgeContext";

// ─── PAGES & COMPONENTS IMPORTS ─────────────────────────────────────────────
import Login from "./pages/Login";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
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
import TasksRouter from "./pages/TasksRouter";
import Tasks from "./pages/Tasks";
import ManagerRoute from "./components/ManagerRoute";
import Notifications from "./pages/Notifications";
import Issues from "./pages/Issues";
import AuthForm from "./pages/Login";

// ────────────────────────────────────────────────────────────────────────────
// 🔐 PROTECTED ROUTE GUARD
// ────────────────────────────────────────────────────────────────────────────
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
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ────────────────────────────────────────────────────────────────────────────
// MAIN APP COMPONENT
// ────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BadgeProvider>
      <Routes>
        {/* 🔓 Public Routes */}
        <Route path="/login" element={<AuthForm />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* 🔑 Password Reset Routes - Both OTP and Token flows */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* 🔐 Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Shell - Sub-Routes */}
          <Route index element={<DashboardHome />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeAccount />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<Leave />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="performance" element={<Performance />} />
          <Route path="tasks" element={<TasksRouter />} />
          <Route
            path="tasks/manage"
            element={
              <ManagerRoute>
                <Tasks />
              </ManagerRoute>
            }
          />
          <Route path="my-tasks" element={<TasksRouter />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="issues" element={<Issues />} />
        </Route>

        {/* 🔄Route Auto (Catch-all) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BadgeProvider>
  );
}

export default App;