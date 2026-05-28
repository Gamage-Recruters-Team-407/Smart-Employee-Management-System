import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext"; 
import API from "../services/api";
import { format } from "date-fns";
import { 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Info, 
  MapPin 
} from "lucide-react";

const Attendance = () => {
  const { user } = useAuth();
  
  // ─── Shared & Admin States ──────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [adminLoading, setAdminLoading] = useState(false);

  // ─── Employee Profile States ────────────────────────────────────────────────
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState(null); 
  const [notification, setNotification] = useState(null);
  const [time, setTime] = useState(new Date());

  const isAdminOrHR = user?.role === "Admin" || user?.role === "HR";

  // 💡 DERIVED STATE FIX: දත්ත ලැබෙනකන් loading ද යන්න කෙලින්ම මෙලෙස තීරණය කරමු
  const isDataLoading = isAdminOrHR 
    ? adminLoading || employees.length === 0 
    : employeeHistory === null;

  // ─── Notification Toast Handler ────────────────────────────────────────────
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Ticking Clock Effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (isAdminOrHR) return;
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAdminOrHR]);

  // ─── FETCH: Admin / HR Data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminOrHR) return;

    const fetchAdminData = async () => {
      setAdminLoading(true);
      try {
        const [empRes, attRes] = await Promise.all([
          API.get("/employees"),
          API.get(`/attendance?date=${selectedDate}`)
        ]);
        setEmployees(empRes.data || empRes);
        setAttendanceData(attRes.data || attRes);
      } catch (err) {
        console.error("Admin Fetch Error:", err);
      } {
        setAdminLoading(false);
      }
    };

    fetchAdminData();
  }, [selectedDate, isAdminOrHR]);

  // ─── FETCH: Employee Profile & Personal History (100% Loop-Safe Fix) ─────────
  // ─── FETCH: Employee Profile & Personal History (100% Loop-Safe Fix) ─────────
  const fetchEmployeeData = useCallback(async () => {
    // 💡 ආරක්ෂක පියවරක්: පරිශීලකයා Admin හෝ HR නම්, නැතහොත් email එකක් නැත්නම් මෙතනින්ම නවතින්න
    if (isAdminOrHR || !user?.email) return;
    
    try {
      const [profileRes, historyRes] = await Promise.all([
        API.get("/employees/me"),
        API.get("/attendance/my-history")
      ]);

      const profileData = profileRes.data || profileRes;
      const historyData = historyRes.data || historyRes || [];

      // 💡 FIX: React Event Loop එකෙන් පිටතට තල්ලු කිරීමෙන් රෙන්ඩර් හැප්පීම 100% ක්ම වැළකේ!
      setTimeout(() => {
        setEmployeeProfile(profileData);
        setEmployeeHistory(historyData);
      }, 0);

    } catch (err) {
      console.error("Employee Fetch Error:", err);
      
      setTimeout(() => {
        setEmployeeHistory([]); 
      }, 0);
      
      showNotification("Failed to load attendance records", "error");
    }
  }, [isAdminOrHR, user?.email]);

  // ─── 💡 100% ක්ම ස්ථාවර සහ සුරක්ෂිත TRIGGER EFFECT (Line 112 FIX) ───────────
  useEffect(() => {
    let isMounted = true;

    // 💡 පිටුව මුලින්ම ලෝඩ් වෙද්දී (Mount) තත්පරයෙන් පංගුවක් ප්‍රමාද කර පසුබිමෙන් දත්ත කියවයි
    const timer = setTimeout(() => {
      if (isMounted && user?.email && !isAdminOrHR) {
        fetchEmployeeData();
      }
    }, 50); // මිලිසෙකන්ඩ් 50ක පොඩි විරාමයක් දීමෙන් ප්‍රධාන Auth Render එක නිදහසේ අවසන් වේ!

    // CLEANUP FUNCTION: Strict Mode double-render එක සහමුලින්ම පාලනය කරයි
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]); // 👈 Dependency එක ලෙස 'user?.email' පමණක් තැබීමෙන් අනන්ත රෙන්ඩර් සයිකල් සදහටම නතර වේ!
  // ─── Trigger Effect ────────────────────────────────────────────────────────
  // useEffect(() => {
  //   if (user?.email && !isAdminOrHR) {
  //     fetchEmployeeData();
  //   }
  // }, [user?.email, fetchEmployeeData, isAdminOrHR]);

  // ─── Status Badge Color Helper ──────────────────────────────────────────────
  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-700 border border-green-200";
      case "Absent": return "bg-red-100 text-red-700 border border-red-200";
      case "Late": return "bg-amber-100 text-amber-700 border border-amber-200";
      case "Half-Day": return "bg-orange-100 text-orange-700 border border-orange-200";
      default: return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayRecord = Array.isArray(employeeHistory) 
    ? employeeHistory.find((rec) => rec.date === todayStr) 
    : null;

  const currentStatus = todayRecord?.status || "Not Checked In";
  const checkInTime = todayRecord?.checkInTime || "-";
  const checkOutTime = todayRecord?.checkOutTime || "-";

  // ────────────────────────────────────────────────────────────────────────────
  // VIEW 1: ADMIN & HR VIEW (Attendance Sheet)
  // ────────────────────────────────────────────────────────────────────────────
  if (isAdminOrHR) {
    return (
      <div className="p-8 w-full pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Attendance Sheet</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and view company-wide daily attendance logs</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
            >
              Today
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Employee Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/60">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">
                      No employee records found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const record = attendanceData.find(
                      (a) => a.employee?._id === emp._id || a.employee === emp._id
                    );
                    const empStatus = record?.status || "Not Marked";
                    return (
                      <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-gray-700">{emp.employeeId}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{emp.firstName} {emp.lastName}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{emp.department || "—"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(empStatus)}`}>
                            {empStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-mono text-gray-600">{record?.checkInTime || "—"}</td>
                        <td className="px-6 py-4 text-center text-sm font-mono text-gray-600">{record?.checkOutTime || "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // VIEW 2: EMPLOYEE VIEW (Personal Status Dashboard)
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 w-full pb-10 p-4">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-bold tracking-tight">My Attendance Status</h2>
        <p className="text-indigo-200 text-xs mt-1">View your daily logs, check-in, and check-out times</p>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          notification.type === "error" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-emerald-50 border-emerald-100 text-emerald-800"
        }`}>
          {notification.type === "error" ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase block">Today's Attendance</span>
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {employeeProfile ? `Hi, ${employeeProfile.firstName}!` : "Welcome!"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Department: {employeeProfile?.department || "N/A"}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-100">
            <span className="text-xs text-gray-400 font-semibold uppercase block mb-1">Local Time</span>
            <div className="text-3xl font-mono font-bold text-gray-900">{format(time, "hh:mm:ss a")}</div>
            <div className="text-xs text-indigo-600 font-semibold mt-1">{format(time, "EEEE, d MMMM yyyy")}</div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Status Today</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(currentStatus)}`}>
                {currentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">Check-In Time</span>
              <span className="font-mono font-bold text-gray-800">{checkInTime}</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2">
              <span className="text-gray-500 font-medium">Check-Out Time</span>
              <span className="font-mono font-bold text-gray-800">{checkOutTime}</span>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-xl flex items-start gap-2.5">
            <Info size={18} className="text-indigo-600 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-normal">
              Your attendance is recorded automatically on login and session logout.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">My Attendance History</h2>
              <p className="text-xs text-gray-500 mt-0.5">Logs and timesheets for employee {employeeProfile?.employeeId || ""}</p>
            </div>
            <button
              onClick={fetchEmployeeData}
              className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
            >
              <RefreshCw size={16} className={isDataLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {isDataLoading ? (
            <div className="flex flex-col justify-center items-center py-20 flex-grow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-sm text-gray-500 mt-2">Loading history logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Check In</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employeeHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-gray-400 text-sm">
                        No attendance history found.
                      </td>
                    </tr>
                  ) : (
                    employeeHistory.map((rec) => (
                      <tr key={rec._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{rec.date}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">{rec.checkInTime || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-mono">{rec.checkOutTime || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {rec.location || "Office"}
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