import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Award,
  Settings,
  LayoutDashboard,
} from "lucide-react";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Users, label: "Employees", path: "/employees" },
    { icon: Clock, label: "Attendance", path: "/attendance" },
    { icon: Calendar, label: "Leaves", path: "/leaves" },
    { icon: DollarSign, label: "Payroll", path: "/payroll" },
    { icon: Award, label: "Performance", path: "/performance" },
  ];

  return (
    <aside
      className={`${
        isOpen ? "w-72" : "w-0 lg:w-24"
      } transition-all duration-300 bg-white border-r border-gray-100 h-screen overflow-hidden shadow-sm`}
    >
      <div className="h-full flex flex-col p-5">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-md">
            <LayoutDashboard className="text-white" size={26} />
          </div>

          <div className={`${isOpen ? "block" : "hidden lg:hidden"}`}>
            <h1 className="font-bold text-2xl text-gray-900">SEMS</h1>
            <p className="text-xs text-gray-500">Employee System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <Icon size={21} />

                <span
                  className={`${
                    isOpen ? "block" : "hidden"
                  } font-medium whitespace-nowrap`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <Link
          to="/settings"
          className="flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition"
        >
          <Settings size={21} />
          <span
            className={`${
              isOpen ? "block" : "hidden"
            } font-medium whitespace-nowrap`}
          >
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;