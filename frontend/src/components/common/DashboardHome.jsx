// pages/dashboard/DashboardHome.jsx

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useEmployeeProfile } from "../../hooks/useEmployeeProfile";
import { 
  User, Briefcase, Award, Clock, Coffee, Utensils, 
  Moon, Wifi, WifiOff 
} from "lucide-react";
import DashboardStats from "./DashboardStats";
import RecentActivity from "./RecentActivity";
import BreakTimer from "../../components/common/BreakTimer";
import AdminAttendanceTable from "../../components/admin/AdminAttendanceTable";
import API from "../../services/api";

const displayValue = (loading, value) => {
  if (loading) return "Loading...";
  if (value === undefined || value === null || value === "") return "—";
  return value;
};

const DashboardHome = () => {
  const { user } = useAuth();
  const { employee, loading, error, displayName } = useEmployeeProfile({
    enabled: user?.role === "Employee",
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [breakStatus, setBreakStatus] = useState(null);

  // ─── TICKING CLOCK ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── FETCH BREAK STATUS ──────────────────────────────────────────────────
  const fetchBreakStatus = useCallback(async () => {
    try {
      const response = await API.get('/attendance/break/status');
      const data = response.data?.data || response.data || {};
      setBreakStatus(data);
    } catch (err) {
      console.error('Failed to fetch break status:', err);
    }
  }, []);

  // ─── EFFECT: FETCH BREAK STATUS ON MOUNT ──────────────────────────────
  useEffect(() => {
    if (user?.role === 'Employee') {
      const timerId = setTimeout(() => {
        fetchBreakStatus();
      }, 0);
      
      const interval = setInterval(() => {
        fetchBreakStatus();
      }, 30000);
      
      return () => {
        clearTimeout(timerId);
        clearInterval(interval);
      };
    }
  }, [user, fetchBreakStatus]);

  // ─── CHECK WORKING HOURS ──────────────────────────────────────────────────
  const getWorkingHoursStatus = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    const startTime = 8 * 60 + 30;
    const endTime = 17 * 60 + 30;

    if (timeInMinutes < startTime) {
      return { status: "before", message: "Working hours start at 8:30 AM" };
    } else if (timeInMinutes > endTime) {
      return { status: "after", message: "Working hours ended at 5:30 PM" };
    } else {
      return { status: "active", message: "Working hours in progress" };
    }
  };

  const workStatus = getWorkingHoursStatus();

  // ─── GET ONLINE STATUS DISPLAY ──────────────────────────────────────────
  const getOnlineStatusDisplay = () => {
    if (breakStatus?.isOnBreak && breakStatus?.currentBreak) {
      return breakStatus.currentBreak.label;
    }
    if (breakStatus?.onlineStatus) {
      return breakStatus.onlineStatus;
    }
    return "Offline";
  };

  const getStatusColor = (status) => {
    if (status === 'Online') return 'text-emerald-600';
    if (status === 'Breakfast') return 'text-amber-600';
    if (status === 'Lunch') return 'text-orange-600';
    if (status === 'Tea Time') return 'text-blue-600';
    return 'text-gray-500';
  };

  const getStatusIcon = (status) => {
    if (status === 'Online') return <Wifi size={16} className="text-emerald-500" />;
    if (status === 'Offline') return <WifiOff size={16} className="text-gray-400" />;
    if (status === 'Breakfast') return <Coffee size={16} className="text-amber-500" />;
    if (status === 'Lunch') return <Utensils size={16} className="text-orange-500" />;
    if (status === 'Tea Time') return <Moon size={16} className="text-blue-500" />;
    return null;
  };

  // ─── EMPLOYEE VIEW ──────────────────────────────────────────────────────────
  if (user?.role === "Employee") {
    const onlineStatus = getOnlineStatusDisplay();
    const statusColor = getStatusColor(onlineStatus);
    const statusIcon = getStatusIcon(onlineStatus);
    
    const isOnBreak = breakStatus?.isOnBreak || false;
    const currentBreak = breakStatus?.currentBreak || null;
    const remainingSeconds = currentBreak?.remainingSeconds || 0;

    return (
      <div className="space-y-6">
        {/* ─── WELCOME BANNER ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome Back, {displayName}!
                </h1>
                <p className="text-indigo-200 text-sm mt-2 flex items-center gap-2">
                  {statusIcon}
                  <span className={statusColor}>Status: {onlineStatus}</span>
                  <span className="text-indigo-300">•</span>
                  <span className="text-indigo-200">
                    {workStatus.status === "active" ? "Working" : workStatus.message}
                  </span>
                </p>
              </div>
              {employee?.employeeId && (
                <div className="text-indigo-300 text-xs bg-white/10 px-4 py-2 rounded-xl">
                  ID: {employee.employeeId}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ─── STATS CARDS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Department</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {displayValue(loading, employee?.department)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Designation</p>
              <p className="text-lg font-bold text-gray-800 mt-1">
                {displayValue(loading, employee?.designation)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${onlineStatus === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
              <Clock size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Status</p>
              <p className={`text-lg font-bold mt-1 ${statusColor}`}>
                {onlineStatus}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Award size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Joining Date</p>
              <p className="text-sm font-bold text-gray-800 mt-1">
                {loading ? "Loading..." : employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ─── BREAK TIMER SECTION ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Break Timer Component */}
          <BreakTimer />
          
          {/* Working Hours */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <h4 className="font-semibold text-gray-700 mb-3">Working Hours</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Start Time</span>
                <span className="font-mono text-sm font-semibold text-gray-800">8:30 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">End Time</span>
                <span className="font-mono text-sm font-semibold text-gray-800">5:30 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Time</span>
                <span className="font-mono text-sm font-semibold text-indigo-600">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${Math.min(100, ((currentTime.getHours() * 60 + currentTime.getMinutes() - 510) / (1050 - 510)) * 100)}%` 
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>8:30 AM</span>
                <span>5:30 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── QUICK LINKS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
            <h3 className="font-semibold text-lg mb-4 text-gray-800">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/attendance"
                className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors flex flex-col justify-between group"
              >
                <span className="font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                  View Attendance →
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Check your check-in history and logs
                </span>
              </a>
              <a
                href="/leaves"
                className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors flex flex-col justify-between group"
              >
                <span className="font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                  Leave Requests →
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  Apply and track your leave applications
                </span>
              </a>
            </div>
          </div>

          {/* ─── CURRENT BREAK STATUS ────────────────────────────────────── */}
          {isOnBreak && currentBreak && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
              <h3 className="font-semibold text-lg mb-4 text-gray-800">Current Break</h3>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentBreak.label === 'Breakfast' && <Coffee size={24} className="text-amber-500" />}
                    {currentBreak.label === 'Lunch' && <Utensils size={24} className="text-orange-500" />}
                    {currentBreak.label === 'Tea Time' && <Moon size={24} className="text-blue-500" />}
                    <div>
                      <p className="font-semibold text-amber-800">{currentBreak.label}</p>
                      <p className="text-xs text-amber-600">Started at {currentBreak.startTime ? new Date(currentBreak.startTime).toLocaleTimeString() : '—'}</p>
                    </div>
                  </div>
                  <span className="text-xl font-mono font-bold text-amber-700">
                    {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── ADMIN / HR VIEW ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <DashboardStats />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <AdminAttendanceTable />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;