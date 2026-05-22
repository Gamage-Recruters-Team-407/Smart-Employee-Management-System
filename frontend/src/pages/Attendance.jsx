import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { format } from 'date-fns';
import AttendanceTable from '../components/AttendanceTable';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Calendar, 
  RefreshCw,
  Info,
  LogIn,
  LogOut,
  MapPin
} from 'lucide-react';

const Attendance = () => {
  const [viewMode, setViewMode] = useState('employee'); // default to 'employee'
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
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

  // Fetch Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesLoading(true);
      try {
        const res = await API.get('/employees');
        setEmployees(res.data);
        if (res.data.length > 0) {
          setSelectedEmployeeId(res.data[0].employeeId);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
        showNotification('Failed to fetch employee list', 'error');
      } finally {
        setEmployeesLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch Attendance for selected date
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/attendance?date=${selectedDate}`);
      setAttendanceData(res.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      showNotification('Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  // Fetch Employee History
  const fetchEmployeeHistory = async () => {
    if (!selectedEmployeeId) return;
    setHistoryLoading(true);
    try {
      const res = await API.get(`/attendance/employee/${selectedEmployeeId}`);
      setEmployeeHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      showNotification('Failed to load employee history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeHistory();
  }, [selectedEmployeeId]);

  const markAttendance = async (employeeId, status) => {
    try {
      // Determine default check-in time based on status
      let checkInTime = null;
      if (status === 'Present') {
        checkInTime = '09:00';
      } else if (status === 'Late') {
        checkInTime = '09:30';
      }

      await API.post('/attendance', {
        employee: employeeId,
        date: selectedDate,
        status: status,
        checkInTime: checkInTime,
        checkOutTime: status === 'Present' || status === 'Late' ? '17:00' : null
      });

      showNotification(`Successfully marked as ${status}`);

      // Refresh attendance lists
      fetchAttendance();
      fetchEmployeeHistory();
    } catch (error) {
      console.error("Error marking attendance:", error);
      showNotification('Failed to mark attendance', 'error');
    }
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await API.post('/attendance/check-in', {
        employeeId: selectedEmployeeId,
        location: 'Office'
      });
      showNotification('Checked in successfully!');
      fetchAttendance();
      fetchEmployeeHistory();
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Failed to check in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await API.post('/attendance/check-out', {
        employeeId: selectedEmployeeId
      });
      showNotification('Checked out successfully!');
      fetchAttendance();
      fetchEmployeeHistory();
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Failed to check out', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics based on fetched employees and daily records
  const getStats = () => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let halfDay = 0;

    employees.forEach((emp) => {
      const record = attendanceData.find(
        (a) => a.employee?._id === emp._id || a.employee?.employeeId === emp.employeeId
      );
      if (record) {
        if (record.status === "Present") present++;
        else if (record.status === "Absent") absent++;
        else if (record.status === "Late") late++;
        else if (record.status === "Half-Day") halfDay++;
      }
    });

    const total = employees.length;
    const marked = present + absent + late + halfDay;
    const pending = total - marked;

    return { total, present, absent, late, halfDay, pending };
  };

  const stats = getStats();

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

  // Get selected employee object
  const activeEmployee = employees.find(emp => emp.employeeId === selectedEmployeeId);

  // Get selected employee's record for today from their history
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = employeeHistory.find(
    (rec) => rec.date === todayStr
  );
  
  const currentStatus = todayRecord?.status || 'Not Checked In';
  const checkInTime = todayRecord?.checkInTime || '-';
  const checkOutTime = todayRecord?.checkOutTime || '-';

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Role and Testing Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-indigo-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Smart Attendance Portal</h2>
          <p className="text-indigo-200 text-xs mt-1">Simulate employee actions or manage daily attendance logs</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-indigo-950/40 p-1 rounded-xl border border-indigo-700/50">
            <button
              onClick={() => setViewMode('employee')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'employee' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-indigo-300 hover:text-white'
              }`}
            >
              Employee View
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'admin' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-indigo-300 hover:text-white'
              }`}
            >
              Admin View
            </button>
          </div>

          {viewMode === 'employee' && employees.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-200 font-semibold">Test As:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="bg-indigo-800 border border-indigo-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                {employees.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
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

      {/* ==================== EMPLOYEE VIEW ==================== */}
      {viewMode === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check-In/Out Dashboard Card */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Smart Attendance Terminal</span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">
                {activeEmployee ? `Hi, ${activeEmployee.firstName}!` : 'Welcome!'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">Department: {activeEmployee?.department || 'N/A'}</p>
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

            {/* Check-In/Out Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCheckIn}
                disabled={todayRecord?.checkInTime || loading}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all ${
                  todayRecord?.checkInTime
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                }`}
              >
                <LogIn size={20} />
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!todayRecord?.checkInTime || todayRecord?.checkOutTime || loading}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-bold text-xs shadow-sm active:scale-95 transition-all ${
                  !todayRecord?.checkInTime || todayRecord?.checkOutTime
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
              >
                <LogOut size={20} />
                Check Out
              </button>
            </div>
          </div>

          {/* Personal History Table Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">My Attendance History</h2>
                <p className="text-xs text-gray-500 mt-0.5">Logs and timesheets for employee {selectedEmployeeId}</p>
              </div>
              <button
                onClick={fetchEmployeeHistory}
                disabled={historyLoading}
                className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                title="Refresh History"
              >
                <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {historyLoading ? (
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
      )}

      {/* ==================== ADMIN VIEW ==================== */}
      {viewMode === 'admin' && (
        <>
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Attendance Board</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track daily employee check-ins and shifts</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Calendar size={16} />
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium text-gray-700 shadow-inner"
                />
              </div>
              
              <button
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-100 active:scale-95 transition-all text-sm font-semibold"
              >
                Today
              </button>

              <button
                onClick={fetchAttendance}
                disabled={loading}
                className="p-2 border border-gray-200 text-gray-650 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                title="Refresh Attendance"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Total Employees */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Total Staff</span>
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                <p className="text-xs text-gray-500 mt-1">Registered employees</p>
              </div>
            </div>

            {/* Present */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Present</span>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <CheckCircle size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.present}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% attendance rate
                </p>
              </div>
            </div>

            {/* Late */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Late Arrivals</span>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.late}</h3>
                <p className="text-xs text-amber-600 font-medium mt-1">Requires follow-up</p>
              </div>
            </div>

            {/* Absent */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Absent</span>
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <XCircle size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.absent}</h3>
                <p className="text-xs text-rose-600 font-medium mt-1">Unmarked leave/sick</p>
              </div>
            </div>

            {/* Not Marked */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Not Marked</span>
                <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
                  <Info size={18} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
                <p className="text-xs text-gray-500 mt-1">Awaiting updates</p>
              </div>
            </div>
          </div>

          {/* Main Attendance Table */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Daily Roster</h2>
              <span className="text-xs text-gray-400">Date: {selectedDate}</span>
            </div>
            <AttendanceTable 
              employees={employees}
              attendanceData={attendanceData}
              markAttendance={markAttendance}
              loading={loading || employeesLoading}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;