import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { format } from "date-fns";
import { 
  AlertCircle, 
  RefreshCw, 
  Download,
  Wifi,
  WifiOff,
  Coffee,
  Utensils,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

const Attendance = () => {
  const { user } = useAuth();
  
  // ─── Shared & Admin States ──────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const totalPages = Math.ceil(employees.length / rowsPerPage);
  const paginatedEmployees = employees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const isAdminOrHR = user?.role === "Admin" || user?.role === "HR";
  const isEmployee = user?.role === "Employee";

  // ─── FETCH: Admin / HR Data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAdminOrHR) return;

    const fetchAdminData = async () => {
      setAdminLoading(true);
      setError(null);
      
      try {
        console.log('📡 Fetching admin data for date:', selectedDate);
        
        // Fetch employees
        const empRes = await API.get("/employees?limit=1000");
        const employeesData = empRes.data?.data || empRes.data || [];
        setEmployees(employeesData);
        
        // Fetch attendance for the selected date
        try {
          const attRes = await API.get(`/attendance/admin/summary?date=${selectedDate}`);
          const attendanceData = attRes.data?.data || attRes.data || [];
          setAttendanceData(attendanceData);
        } catch (attErr) {
          console.warn('⚠️ Could not fetch attendance data:', attErr.message);
          setAttendanceData([]);
        }
        
        if (employeesData.length === 0) {
          setError('No employees found in the system.');
        }
      } catch (err) {
        console.error("Admin Fetch Error:", err);
        setError(err.response?.data?.message || 'Failed to load attendance data');
        setEmployees([]);
        setAttendanceData([]);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminData();
  }, [selectedDate, isAdminOrHR]);

  // ─── STATUS BADGE COLOR ──────────────────────────────────────────────────
  const getStatusColor = (status) => {
    switch (status) {
      case "Present": return "bg-green-100 text-green-700 border border-green-200";
      case "Absent": return "bg-red-100 text-red-700 border border-red-200";
      case "Late": return "bg-amber-100 text-amber-700 border border-amber-200";
      case "Half-Day": return "bg-orange-100 text-orange-700 border border-orange-200";
      case "Online": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Offline": return "bg-gray-100 text-gray-600 border border-gray-200";
      default: return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  // ─── ONLINE STATUS BADGE ──────────────────────────────────────────────────
  const getOnlineStatusBadge = (onlineStatus, breakType) => {
    if (breakType || ['Breakfast', 'Lunch', 'Tea Time', 'Tea'].includes(onlineStatus)) {
      return {
        label: 'Offline',
        icon: <WifiOff size={14} className="text-gray-400" />,
        className: 'bg-gray-100 text-gray-600 border border-gray-200'
      };
    }
    if (onlineStatus === 'Online') {
      return {
        label: 'Online',
        icon: <Wifi size={14} className="text-emerald-500" />,
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      };
    }
    return {
      label: 'Offline',
      icon: <WifiOff size={14} className="text-gray-400" />,
      className: 'bg-gray-100 text-gray-600 border border-gray-200'
    };
  };

  // ─── GET BREAK LABEL ──────────────────────────────────────────────────────
  const getBreakLabel = (breakType, onlineStatus) => {
    if (breakType === 'breakfast' || onlineStatus === 'Breakfast') return '🍳 Breakfast';
    if (breakType === 'lunch' || onlineStatus === 'Lunch') return '🍽️ Lunch';
    if (breakType === 'tea' || onlineStatus === 'Tea Time' || onlineStatus === 'Tea') return '☕ Tea Time';
    return '—';
  };

  // ─── EXPORT CSV ──────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (employees.length === 0) return;

    const headers = ["Employee ID", "Employee Name", "Department", "Status", "Check In", "Check Out", "Online Status", "Break"];

    const rows = employees.map((emp) => {
      const record = attendanceData.find(
        (a) => a.employee?._id === emp._id || a.employee === emp._id
      );
      const empStatus = record?.status || "Not Marked";
      const checkIn = record?.checkInTime || "—";
      const checkOut = record?.checkOutTime || "—";
      const fullName = `${emp.firstName} ${emp.lastName}`;
      const department = emp.department || "—";
      const onlineStatus = record?.onlineStatus || "Offline";
      const breakType = record?.breakType ? getBreakLabel(record.breakType) : "—";

      return [
        emp.employeeId,
        fullName,
        department,
        empStatus,
        checkIn,
        checkOut,
        onlineStatus,
        breakType
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Sheet_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── EMPLOYEE VIEW ──────────────────────────────────────────────────────────
  if (isEmployee) {
    return (
      <div className="p-8 w-full pb-10">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-amber-800 mb-2">🔒 Access Restricted</h2>
          <p className="text-amber-700">
            Attendance management is only available for Admin and HR users.
          </p>
          <p className="text-sm text-amber-600 mt-2">
            Please contact HR for any attendance-related inquiries.
          </p>
        </div>
      </div>
    );
  }

  // ─── ADMIN / HR VIEW ────────────────────────────────────────────────────────
  if (!isAdminOrHR) {
    return null;
  }

  return (
    <div className="p-8 w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Attendance Sheet</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and view company-wide daily attendance logs</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
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
          <button
            onClick={handleExportCSV}
            disabled={employees.length === 0 || adminLoading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            title="Export attendance sheet as CSV"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setSelectedDate(format(new Date(), "yyyy-MM-dd"));
              // Trigger refresh
              const fetchData = async () => {
                setAdminLoading(true);
                try {
                  const attRes = await API.get(`/attendance/admin/summary?date=${selectedDate}`);
                  setAttendanceData(attRes.data?.data || attRes.data || []);
                } catch (err) {
                  console.error('Refresh error:', err);
                } finally {
                  setAdminLoading(false);
                }
              };
              fetchData();
            }}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            title="Refresh data"
          >
            <RefreshCw size={18} className={adminLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        {adminLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 font-medium">Loading attendance data...</span>
          </div>
        ) : (
          <>
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
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Online Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Break</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/60">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center text-gray-400 text-sm">
                        No employee records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => {
                      const record = attendanceData.find(
                        (a) => a.employee?._id === emp._id || a.employee === emp._id || a.employeeId === emp.employeeId
                      );
                      const empStatus = record?.status || "Not Marked";
                      const onlineStatus = record?.onlineStatus || "Offline";
                      const breakType = record?.breakType || null;
                      const statusBadge = getOnlineStatusBadge(onlineStatus, breakType);
                      const breakLabel = getBreakLabel(breakType, onlineStatus);
                      
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
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge.className}`}>
                              {statusBadge.icon}
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {breakLabel}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* ─── PAGINATION CONTROLS ────────────────────────────────────────── */}
            {employees.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>

                <div>
                  Showing <span className="font-semibold text-gray-800">{Math.min(employees.length, (currentPage - 1) * rowsPerPage + 1)}</span> to{" "}
                  <span className="font-semibold text-gray-800">{Math.min(employees.length, currentPage * rowsPerPage)}</span> of{" "}
                  <span className="font-semibold text-gray-800">{employees.length}</span> entries
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="px-3 py-1 font-medium text-gray-700">
                    Page {currentPage} of {totalPages || 1}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Attendance;