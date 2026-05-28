import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages & Components Import කිරීම්
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./components/common/DashboardHome";
import Employees from "./pages/Employees";
import EmployeeAccount from "./pages/EmployeeAccount"; // 👈 අලුත් පිටුව
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Tasks from "./pages/Tasks"; // 👈 අලුත් පිටුව
import MyTasks from "./pages/MyTasks"; // 👈 අලුත් පිටුව
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// 🔐 ලොග් වී නොමැති පරිශීලකයන් වළක්වන ආරක්ෂිත ශ්‍රිතය (ProtectedRoute)
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

function App() {
  return (
    <Routes>
      {/* 🔓 Public Routes (ඕනෑම අයෙකුට පිවිසිය හැක) */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* 🔐 Protected Route Shell (ලොග් වූ අයට පමණි - Dashboard එක ඇතුළත) */}
      <Route
        path="/"
        element = {
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        {/* Dashboard එක ඇතුලත තියෙන Sub-Routes */}
        <Route index element={<DashboardHome />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeAccount />} /> {/* 👈 එකතු කරන ලදී */}
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leave />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="performance" element={<Performance />} />
        <Route path="tasks" element={<Tasks />} /> {/* 👈 එකතු කරන ලදී */}
        <Route path="my-tasks" element={<MyTasks />} /> {/* 👈 එකතු කරන ලදී */}
      </Route>

      {/* 🔄 වැරදි Route එකක් ගැහුවොත් Auto මුල් පිටුවට (Home) හරවා යවයි (Catch-all) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;