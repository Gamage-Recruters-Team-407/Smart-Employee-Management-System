import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info,
  MapPin
} from 'lucide-react';

const Attendance = () => {
  const { user } = useAuth();
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Ticking clock state
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Show temporary feedback toast/notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch personal profile and attendance history
  const fetchEmployeeHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await API.get('/attendance/my-history');
      setEmployeeHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      showNotification('Failed to load employee history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get('/employees/me');
        setEmployeeProfile(res.data);
      } catch (err) {
        console.error("Error fetching employee profile:", err);
      }
    };

    if (user) {
      fetchProfile();
      fetchEmployeeHistory();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Absent":
        return "bg-red-50 text-red-700 border border-red-200";
      case "Late":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Half-Day":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-gray-50 text-gray-500 border border-gray-200";
    }
  };

  // Get selected employee's record for today from history
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = employeeHistory ? employeeHistory.find(
    (rec) => rec.date === todayStr
  ) : null;
  
  const currentStatus = todayRecord?.status || 'Not Checked In';
  const checkInTime = todayRecord?.checkInTime || '-';
  const checkOutTime = todayRecord?.checkOutTime || '-';

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold tracking-tight">My Attendance Status</h2>
        <p className="text-indigo-200 text-xs mt-1">View your daily logs, check-in, and check-out times</p>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all duration-300 ${
          notification.type === 'error' 
            ? 'bg-rose-50 border-rose-100 text-rose-800' 
            : 'bg-emerald-50 border-emerald-100 text-emerald-800'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Main Employee View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Attendance Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Today's Attendance</span>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {employeeProfile ? `Hi, ${employeeProfile.firstName}!` : 'Welcome!'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Department: {employeeProfile?.department || 'N/A'}</p>
          </div>

          {/* Time Display */}
          <div className="bg-slate-50 p-6 rounded-xl text-center border border-slate-100 shadow-inner">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Local Time</span>
            <div className="text-3xl font-mono font-bold text-gray-900 tracking-tight">
              {format(time, 'hh:mm:ss a')}
            </div>
            <div className="text-xs text-indigo-600 font-semibold mt-1">
              {format(time, 'EEEE, d MMMM yyyy')}
            </div>
          </div>

          {/* Current Daily Status Indicators */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100/60">
              <span className="text-gray-500 font-medium">Status Today</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(currentStatus)}`}>
                {currentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100/60">
              <span className="text-gray-500 font-medium">Check-In Time</span>
              <span className="font-mono font-bold text-gray-800">{checkInTime}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-gray-500 font-medium">Check-Out Time</span>
              <span className="font-mono font-bold text-gray-800">{checkOutTime}</span>
            </div>
          </div>

          {/* Attendance terminal auto message */}
          <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl flex items-start gap-2.5">
            <Info size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-normal">
              Your attendance is recorded automatically. Log in to record your check-in time, and log out of the system to save your check-out time.
            </p>
          </div>
        </div>

        {/* Personal History Table Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Attendance History</h2>
              <p className="text-xs text-gray-500 mt-0.5">Logs and timesheets for employee {employeeProfile?.employeeId || ''}</p>
            </div>
            <button
              onClick={fetchEmployeeHistory}
              disabled={historyLoading}
              className="p-2 border border-gray-200 text-gray-650 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
              title="Refresh History"
            >
              <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {historyLoading || !employeeHistory ? (
            <div className="flex flex-col justify-center items-center py-20 flex-grow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600 font-medium mt-3">Loading history logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 -mb-6 flex-grow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-y border-gray-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/60">
                  {employeeHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-500 font-medium bg-gray-50/30">
                        No attendance history found. Check in to get started!
                      </td>
                    </tr>
                  ) : (
                    employeeHistory.map((rec) => (
                      <tr key={rec._id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{rec.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono font-medium">{rec.checkInTime || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono font-medium">{rec.checkOutTime || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {rec.location || 'Office'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;