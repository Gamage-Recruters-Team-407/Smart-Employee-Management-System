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
import { useEffect, useState } from "react";

const Sidebar = ({ isOpen, onClose, toggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { canManageTasks } = useTaskCapabilities();
  const { unreadNotifications } = useBadges();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window !== 'undefined') {
      setIsLargeScreen(window.innerWidth >= 1024);
      
      const handleResize = () => {
        setIsLargeScreen(window.innerWidth >= 1024);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
    else if (toggle) toggle();
  };

  const taskNavItems =
    user?.role === "Admin" || canManageTasks
      ? [{ icon: CheckSquare, label: "Task Management", path: "/tasks/manage" }]
      : [{ icon: CheckSquare, label: "My Tasks", path: "/tasks" }];

  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    ...(user?.role !== "Employee" ? [{ icon: Users, label: "Employees", path: "/employees" }] : []),
    ...(user?.role !== "Employee" ? [{ icon: Clock, label: "Attendance", path: "/attendance" }] : []),
    { icon: Calendar, label: "Leaves", path: "/leaves" },
    { icon: DollarSign, label: "Payroll", path: "/payroll" },
    { icon: Award, label: "Performance", path: "/performance" },
    ...taskNavItems,
    { icon: Bell, label: "Notifications", path: "/notifications" },
  ];

  // Show sidebar on large screens always, on mobile only when isOpen
  const shouldShow = isLargeScreen || isOpen;

  return (
    <>
      {/* Mobile Overlay - Only on mobile when sidebar is open */}
      {!isLargeScreen && isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 h-screen w-64 bg-white border-r shadow-xl 
          transform transition-transform duration-300 ease-in-out flex-shrink-0
          ${shouldShow ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          // Override transform for large screens to always show
          transform: isLargeScreen ? 'translateX(0)' : (isOpen ? 'translateX(0)' : 'translateX(-100%)')
        }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Mobile Close Button - Hidden on large screens */}
          <div className="flex justify-end mb-6 lg:hidden">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={24} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-3xl">S</span>
            </div>
            <span className="font-bold text-2xl text-gray-800">SEMS</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                              (item.path !== "/" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (!isLargeScreen) handleClose();
                  }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={22} className="flex-shrink-0" />
                  <span className="truncate">{item.label}</span>

                  {/* Badges */}
                  {item.label === "Notifications" && unreadNotifications > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
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