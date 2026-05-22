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
      } transition-all duration-300 bg-gradient-to-b from-white via-indigo-50/40 to-purple-50/60 border-r border-indigo-100 h-screen overflow-hidden shadow-xl`}
    >
      <div className="h-full flex flex-col p-5">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="relative w-13 h-13">
            <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-md opacity-40 animate-pulse"></div>
            <div className="relative w-13 h-13 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <LayoutDashboard className="text-white" size={28} />
            </div>
          </div>

          <div className={`${isOpen ? "block" : "hidden"}`}>
            <h1 className="font-extrabold text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SEMS
            </h1>
            <p className="text-xs font-medium text-gray-500">
              Employee System
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200"
                    : "text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-300 rounded-r-full"></span>
                )}

                <Icon
                  size={21}
                  className="group-hover:scale-110 transition-transform duration-300"
                />

                <span
                  className={`${
                    isOpen ? "block" : "hidden"
                  } font-semibold whitespace-nowrap`}
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
          className="group flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-600 hover:bg-white hover:text-purple-600 hover:shadow-md transition-all duration-300"
        >
          <Settings
            size={21}
            className="group-hover:rotate-90 transition-transform duration-500"
          />
          <span
            className={`${
              isOpen ? "block" : "hidden"
            } font-semibold whitespace-nowrap`}
          >
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;