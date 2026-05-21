import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Generate avatar initials from user's name
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
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
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-800">{user?.name || "User"}</p>
              <p className="text-sm text-gray-500">{user?.role || "Employee"}</p>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm select-none">
              {initials}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
