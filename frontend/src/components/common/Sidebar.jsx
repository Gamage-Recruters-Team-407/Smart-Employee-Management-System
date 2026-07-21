import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBadges } from "../../context/BadgeContext";
import useTaskCapabilities from "../../hooks/useTaskCapabilities";
import {
  Home,
  Users,
  Clock,
  Calendar,
  DollarSign,
  Award,
  Bell,
  CheckSquare,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose, toggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { canManageTasks } = useTaskCapabilities();
  const { unreadNotifications, activeTasks } = useBadges();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (toggle) {
      toggle();
    }
  };

  const taskNavItems =
    user?.role === "Admin" || canManageTasks
      ? [
          {
            icon: CheckSquare,
            label: "Task Management",
            path: "/tasks/manage",
          },
        ]
      : [
          {
            icon: CheckSquare,
            label: "My Tasks",
            path: "/tasks",
          },
        ];

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },

    ...(user?.role !== "Employee"
      ? [{ icon: Users, label: "Employees", path: "/employees" }]
      : []),

    ...(user?.role !== "Employee"
      ? [{ icon: Clock, label: "Attendance", path: "/attendance" }]
      : []),

    { icon: Calendar, label: "Leaves", path: "/leaves" },
    { icon: DollarSign, label: "Payroll", path: "/payroll" },
    { icon: Award, label: "Performance", path: "/performance" },
    ...taskNavItems,
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  return (
    <>
      {/* Mobile / Tablet Overlay */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 h-screen bg-white border-r overflow-hidden transform transition-transform duration-300 ease-in-out flex-shrink-0 w-64 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6">
          {/* Mobile / Tablet Close Button */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">S</span>
            </div>

            <span className="block font-bold text-2xl whitespace-nowrap">
              SEMS
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.innerWidth < 1024
                    ) {
                      handleClose();
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition relative ${
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon size={20} />

                    {item.label === "Notifications" &&
                      unreadNotifications > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 min-w-[14px] h-[14px]">
                            {unreadNotifications}
                          </span>
                        </span>
                      )}
                  </div>

                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.label}</span>

                    <div className="flex gap-2 items-center flex-shrink-0">
                      {(item.label === "My Tasks" ||
                        item.label === "Task Management") &&
                        activeTasks > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-none">
                            {activeTasks}
                          </span>
                        )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;