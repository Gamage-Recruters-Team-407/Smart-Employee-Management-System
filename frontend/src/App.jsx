import { lazy, Suspense } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { BadgeProvider } from "./context/BadgeContext";

// ─── LAZY LOADED PAGES & COMPONENTS ─────────────────────────────────────────
const Login = lazy(() => import("./pages/Login"));
const GoogleAuthCallback = lazy(() => import("./pages/GoogleAuthCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./components/common/DashboardHome"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeAccount = lazy(() => import("./pages/EmployeeAccount"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Leave = lazy(() => import("./pages/Leave"));
const Payroll = lazy(() => import("./pages/Payroll"));
const Performance = lazy(() => import("./pages/Performance"));
const TasksRouter = lazy(() => import("./pages/TasksRouter"));
const Tasks = lazy(() => import("./pages/Tasks"));
const ManagerRoute = lazy(() => import("./components/ManagerRoute"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Issues = lazy(() => import("./pages/Issues"));

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* 🔓 Public Routes */}
          <Route path="/login" element={<Login />} />
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
      </Suspense>
    </BadgeProvider>
  );
}

export default App;