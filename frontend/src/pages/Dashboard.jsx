<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState, useEffect, useCallback, useRef } from "react";
>>>>>>> 9d9b9c3690d5abbe7a053542999e5c43569f92a4
import { Outlet, useNavigate, Link } from "react-router-dom";
import { Menu, X, LogOut, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import BreakNotification from "../components/common/BreakNotification";
import { useAuth } from "../context/AuthContext";
import { useEmployeeProfile } from "../hooks/useEmployeeProfile";
<<<<<<< HEAD
import useAttendanceSocket from "../hooks/useAttendanceSocket"; 

=======
import API from "../services/api";
>>>>>>> 9d9b9c3690d5abbe7a053542999e5c43569f92a4

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { employee } = useEmployeeProfile({
    enabled: user?.role === "Employee",
  });

<<<<<<< HEAD
  // Keep a stable reference to prevent the socket hook from re-running unnecessarily
  const [socketUser, setSocketUser] = useState(null);

  useEffect(() => {
    const target = user?.role === "Employee" ? employee : user;
    if (target && !socketUser) {
      setSocketUser(target);
    }
  }, [user, employee, socketUser]);

  useAttendanceSocket(socketUser);
=======
  // ─── ATTENDANCE STATE ──────────────────────────────────────────────────────
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState(null);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState(null);
  const [attendanceStatusText, setAttendanceStatusText] = useState(null);

  // ─── REFS ──────────────────────────────────────────────────────────────────
  const isMountedRef = useRef(true);
  const fetchAttendanceRef = useRef(null);

  // Check if user is Employee (not Admin or HR)
  const isEmployee = user?.role === "Employee";
  const isAdminOrHR = user?.role === "Admin" || user?.role === "HR";
>>>>>>> 9d9b9c3690d5abbe7a053542999e5c43569f92a4

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

  // ─── PROFILE PICTURE ──────────────────────────────────────────────────────
  const profilePicture = employee?.profilePicture || null;

  // ─── FETCH TODAY'S ATTENDANCE ──────────────────────────────────────────────
  const fetchTodayAttendance = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await API.get("/attendance/today");
      const data = response.data?.data || response.data || {};
      
      console.log('📋 Attendance data:', data);
      
      if (data && data.status) {
        setAttendanceStatus(data);
        const hasCheckedIn = !!data.checkInTime;
        setIsAttendanceMarked(hasCheckedIn);
        setAttendanceTime(data.checkInTime || null);
        setAttendanceStatusText(data.status || null);
        
        console.log(`✅ Attendance status: ${hasCheckedIn ? 'Marked' : 'Not marked'}`);
        console.log(`   Status: ${data.status || 'N/A'}, Time: ${data.checkInTime || 'N/A'}`);
      } else {
        setIsAttendanceMarked(false);
        setAttendanceTime(null);
        setAttendanceStatusText(null);
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
      setIsAttendanceMarked(false);
    }
  }, []);

  // Store ref to fetchAttendance for use in effects
  useEffect(() => {
    fetchAttendanceRef.current = fetchTodayAttendance;
  }, [fetchTodayAttendance]);

  // ─── CHECK LOGIN TIME RESTRICTIONS ────────────────────────────────────────
  const canLogin = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    const loginStart = 8 * 60 + 30;
    const loginEnd = 17 * 60 + 30;

    return timeInMinutes >= loginStart && timeInMinutes <= loginEnd;
  };

  // ─── GET TIME STATUS ──────────────────────────────────────────────────────
  const getTimeStatus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    if (timeInMinutes < 8 * 60 + 30) {
      return { status: "before", message: "Working hours start at 8:30 AM" };
    } else if (timeInMinutes > 17 * 60 + 30) {
      return { status: "after", message: "Working hours ended at 5:30 PM" };
    } else if (timeInMinutes <= 9 * 60 + 30) {
      return { status: "on-time", message: "✅ On time" };
    } else {
      return { status: "late", message: "⚠️ Late" };
    }
  };

  // ─── ATTENDANCE MARK FUNCTION ──────────────────────────────────────────────
  const markAttendance = async () => {
    if (!isEmployee) {
      setAttendanceMessage({ 
        type: "error", 
        text: "Attendance marking is only available for Employees." 
      });
      return;
    }

    if (!user?.email) {
      setAttendanceMessage({ type: "error", text: "Please login first" });
      return;
    }

    if (isAttendanceMarked) {
      setAttendanceMessage({ 
        type: "warning", 
        text: `✅ Attendance already marked at ${attendanceTime || 'N/A'} (${attendanceStatusText || 'Present'})` 
      });
      return;
    }

    setAttendanceLoading(true);
    setAttendanceMessage(null);

    try {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      const startTime = 8 * 60 + 30;
      const endTime = 17 * 60 + 30;
      
      if (timeInMinutes < startTime || timeInMinutes > endTime) {
        setAttendanceMessage({ 
          type: "error", 
          text: `⏰ Attendance can only be marked between 8:30 AM and 5:30 PM. Current time: ${now.toLocaleTimeString()}` 
        });
        setAttendanceLoading(false);
        return;
      }

      const onTimeLimit = 9 * 60 + 30;
      const isOnTime = timeInMinutes <= onTimeLimit;
      const statusText = isOnTime ? "Present" : "Late";

      const response = await API.post("/attendance/mark", {
        employeeId: user._id || storedUser._id,
        email: user.email || storedUser.email,
        date: new Date().toISOString().split("T")[0],
      });

      const data = response.data || response;
      
      if (data.success || data.status) {
        setAttendanceStatus(data);
        setIsAttendanceMarked(true);
        setAttendanceTime(data.checkInTime || now.toLocaleTimeString());
        setAttendanceStatusText(data.status || statusText);
        
        setAttendanceMessage({
          type: data.status === "Late" ? "warning" : "success",
          text: `${data.status === "Late" ? "⚠️" : "✅"} Attendance marked: ${data.status || statusText} at ${data.checkInTime || now.toLocaleTimeString()}`,
        });
        fetchTodayAttendance();
      } else {
        setAttendanceMessage({
          type: "error",
          text: data.message || "Failed to mark attendance",
        });
      }
    } catch (error) {
      console.error("Attendance marking error:", error);
      
      if (error.response?.data?.message?.includes("already")) {
        setIsAttendanceMarked(true);
        setAttendanceMessage({
          type: "warning",
          text: `✅ Attendance already marked at ${attendanceTime || 'N/A'} (${attendanceStatusText || 'Present'})`,
        });
        fetchTodayAttendance();
      } else {
        setAttendanceMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to mark attendance",
        });
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ─── CHECK IF LOGOUT REQUIRED ──────────────────────────────────────────────
  const shouldLogout = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    const logoutTime = 17 * 60 + 30;
    return timeInMinutes > logoutTime;
  };

  // ─── AUTO LOGOUT HANDLER ──────────────────────────────────────────────────
  const handleAutoLogout = useCallback(async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.error("Auto logout failed:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("attendanceId");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  }, [logout, navigate]);

  // ─── TICKING CLOCK EFFECT ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      if (shouldLogout() && isLoggedIn && !isAdminOrHR) {
        handleAutoLogout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedIn, isAdminOrHR, handleAutoLogout]);

  // ─── EFFECT: FETCH ATTENDANCE ON MOUNT ─────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    
    const timerId = setTimeout(() => {
      if (isMountedRef.current && fetchAttendanceRef.current) {
        fetchAttendanceRef.current();
      }
    }, 0);
    
    return () => {
      clearTimeout(timerId);
      isMountedRef.current = false;
    };
  }, []);

  // ─── EFFECT: REFETCH WHEN LOGIN STATE CHANGES ─────────────────────────────
  useEffect(() => {
    if (isLoggedIn && fetchAttendanceRef.current) {
      const timerId = setTimeout(() => {
        if (isMountedRef.current && fetchAttendanceRef.current) {
          fetchAttendanceRef.current();
        }
      }, 0);
      
      return () => clearTimeout(timerId);
    }
  }, [isLoggedIn]);

  // ─── LOGOUT HANDLER ────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("attendanceId");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  };

  // ─── GET ATTENDANCE STATUS COLOR ───────────────────────────────────────────
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    if (status === "Present") return "bg-green-100 text-green-700 border border-green-200";
    if (status === "Late") return "bg-red-100 text-red-700 border border-red-200";
    if (status === "Half-Day") return "bg-orange-100 text-orange-700 border border-orange-200";
    return "bg-gray-100 text-gray-600";
  };

  // ─── GET STATUS ICON ──────────────────────────────────────────────────────
  const getStatusIcon = (status) => {
    if (!status) return null;
    if (status === "Present") return "✅";
    if (status === "Late") return "⚠️";
    return "📌";
  };

  // ─── RENDER ATTENDANCE SECTION ────────────────────────────────────────────────
  const renderAttendanceSection = () => {
    if (!isEmployee) return null;

    const timeStatus = getTimeStatus();
    const loginAllowed = canLogin();
    const logoutRequired = shouldLogout();

    if (logoutRequired) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center min-w-[200px]">
          <AlertCircle className="text-red-600 mx-auto mb-2" size={24} />
          <p className="text-red-700 font-semibold text-sm">Working hours ended</p>
          <p className="text-red-600 text-xs">Please log out</p>
        </div>
      );
    }

    const isLate = attendanceStatusText === "Late";

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm min-w-[250px]">
        <div className="flex items-center justify-between gap-3">
          <div className="hidden sm:block">
            <h4 className="text-sm font-semibold text-gray-700">Attendance</h4>
            
            {/* ─── SHOW ATTENDANCE STATUS IF MARKED ────────────────────────── */}
            {isAttendanceMarked ? (
              <div className="mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-800">
                    {attendanceStatusText || "Present"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusColor(attendanceStatusText)}`}>
                    {isLate ? "⚠️ Late" : "✅ On Time"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={12} className="text-gray-400" />
                  Marked at {attendanceTime || 'N/A'}
                </p>
                {isLate && (
                  <p className="text-xs text-red-600 mt-0.5 font-medium">
                    ⚠️ You were late! (After 9:30 AM)
                  </p>
                )}
                {!isLate && attendanceStatusText === "Present" && (
                  <p className="text-xs text-green-600 mt-0.5">
                    ✓ On time attendance recorded
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500">Mark daily</p>
                {timeStatus.status === 'on-time' && (
                  <p className="text-xs text-green-600">✅ On time</p>
                )}
                {timeStatus.status === 'late' && (
                  <p className="text-xs text-red-600">⚠️ Late</p>
                )}
              </div>
            )}
          </div>
          
          {/* ─── SHOW STATUS OR MARK BUTTON ────────────────────────────────── */}
          {isAttendanceMarked ? (
            <div className="text-right min-w-[120px]">
              <div className={`flex items-center gap-2 justify-end px-3 py-1.5 rounded-xl text-sm font-medium ${
                isLate ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <span>{getStatusIcon(attendanceStatusText)}</span>
                <span>{isLate ? 'Late' : 'Present'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                🕐 {attendanceTime || 'N/A'}
              </p>
              {isLate && (
                <p className="text-xs text-red-500 mt-0.5 font-medium">
                  ⚠️ After 9:30 AM
                </p>
              )}
              {attendanceStatus?.checkOutTime && (
                <p className="text-xs text-gray-500">Out at {attendanceStatus.checkOutTime}</p>
              )}
            </div>
          ) : (
            <button
              onClick={markAttendance}
              disabled={attendanceLoading || !loginAllowed}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                !loginAllowed 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <CheckCircle size={16} />
              {attendanceLoading ? "Marking..." : "Mark Attendance"}
            </button>
          )}
        </div>

        {attendanceMessage && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            attendanceMessage.type === "success" ? "bg-green-50 text-green-700" :
            attendanceMessage.type === "warning" ? "bg-amber-50 text-amber-700" :
            "bg-red-50 text-red-700"
          }`}>
            {attendanceMessage.text}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ─── HEADER / NAVBAR SECTION ──────────────────────────────────────── */}
        <header className="bg-white shadow-sm z-10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <>
                {/* ─── USER PROFILE SECTION ──────────────────────────────────── */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg select-none ring-2 ring-indigo-100 flex-shrink-0">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <p className="font-medium text-gray-800 text-sm">{userName}</p>
                    <p className="text-xs text-gray-500">{userRole}</p>
                    {attendanceId && isEmployee && (
                      <p className="text-xs text-gray-400">ID: {attendanceId}</p>
                    )}
                  </div>
                </div>

                {/* ─── ATTENDANCE MARK BUTTON - Only for Employees ────────────── */}
                {isEmployee && (
                  <div className="hidden lg:block">
                    {renderAttendanceSection()}
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 sm:px-3 py-2 rounded-lg transition"
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

        {/* ─── MOBILE ATTENDANCE SECTION - Only for Employees ────────────────── */}
        {isEmployee && (
          <div className="lg:hidden px-4 py-2 bg-gray-50 border-b border-gray-200">
            {renderAttendanceSection()}
          </div>
        )}

        {/* ─── MAIN CONTENT AREA ────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* ─── BREAK NOTIFICATION COMPONENT ────────────────────────────────────── */}
      <BreakNotification />
    </div>
  );
};

export default Dashboard;