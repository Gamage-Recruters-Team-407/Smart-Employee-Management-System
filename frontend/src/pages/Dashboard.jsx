import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useEmployeeProfile } from "../hooks/useEmployeeProfile";
import useAttendanceSocket from "../hooks/useAttendanceSocket"; 


const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { employee } = useEmployeeProfile({
    enabled: user?.role === "Employee",
  });

  // Keep a stable reference to prevent the socket hook from re-running unnecessarily
  const [socketUser, setSocketUser] = useState(null);

  useEffect(() => {
    const target = user?.role === "Employee" ? employee : user;
    if (target && !socketUser) {
      setSocketUser(target);
    }
  }, [user, employee, socketUser]);

  useAttendanceSocket(socketUser);

  // ─── STORAGE ─────────────────────────────────
  let storedUser = {};
  let attendanceId = "";

  try {
    let rawUser = localStorage.getItem("user");
    if (rawUser === "undefined") {
      localStorage.removeItem("user");
      rawUser = null;
    }
    if (!rawUser) {
      rawUser = sessionStorage.getItem("user");
    }
    if (rawUser) {
      storedUser = JSON.parse(rawUser);
    }
    attendanceId = localStorage.getItem("attendanceId") || "";
  } catch (e) {
    console.error("Failed to parse user data from storage:", e);
  }

  const employeeFullName = employee
    ? [employee.firstName, employee.lastName].filter(Boolean).join(" ").trim()
    : "";

  const userName =
    (user?.role === "Employee" && employeeFullName) ||
    user?.name ||
    storedUser.name ||
    "User";

  const userRole =
    user?.role === "Employee"
      ? employee?.designation || employee?.department || user?.role || storedUser.role || "Employee"
      : user?.role || storedUser.role || "Employee";
  const isLoggedIn = !!(user || storedUser?.email);

  // Avatar 
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // ─── LOGOUT HANDLER ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // සෙස්ෂන් දත්ත සම්පූර්ණයෙන්ම පිරිසිදු කිරීම
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("attendanceId");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");

      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar කෝම්පෝනන්ට් එක */}
      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ─── HEADER / NAVBAR SECTION ──────────────────────────────────────── */}
        <header className="bg-white shadow-sm z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* පරිශීලක විස්තර (User Details) */}
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-800">{userName}</p>
                  <p className="text-sm text-gray-500">{userRole}</p>
                  {attendanceId && (
                    <p className="text-xs text-gray-400">
                      Attendance ID: {attendanceId}
                    </p>
                  )}
                </div>

                {/* Avatar රවුම */}
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm select-none">
                  {initials}
                </div>

                {/* Logout බොත්තම */}
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;