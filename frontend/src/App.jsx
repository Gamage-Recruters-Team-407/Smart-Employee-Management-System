<<<<<<< HEAD
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
=======
import { Route, Routes } from "react-router-dom";
import { MockAuthProvider } from "./context/MockAuthContext";
>>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./components/common/DashboardHome";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
<<<<<<< HEAD
import Performance from "./pages/Performance";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Wraps routes that require a logged-in user
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
=======
import Tasks from "./pages/Tasks";
import EmployeeAccount from "./pages/EmployeeAccount";
import MyTasks from "./pages/MyTasks";
>>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8

function App() {
  return (
    <MockAuthProvider>
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeAccount />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leave />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="performance" element={<Performance />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="my-tasks" element={<MyTasks />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </MockAuthProvider>
  );
}

export default App;
