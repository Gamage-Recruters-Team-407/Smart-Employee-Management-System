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
  Info
} from 'lucide-react';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [notification, setNotification] = useState(null);

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

      // Refresh attendance list
      const res = await API.get(`/attendance?date=${selectedDate}`);
      setAttendanceData(res.data);
    } catch (error) {
      console.error("Error marking attendance:", error);
      showNotification('Failed to mark attendance', 'error');
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

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance Tracker</h1>
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
            className="p-2 border border-gray-200 text-gray-605 rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
            title="Refresh Attendance"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
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
    </div>
  );
};

export default Attendance;