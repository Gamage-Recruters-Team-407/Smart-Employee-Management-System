import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Wifi, WifiOff, Coffee, Utensils, Moon, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import API from "../../services/api";
import { io } from "socket.io-client";
import { getSocketConfig } from "../../utils/socketConfig";

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminAttendanceTable = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, selectedDate]);

  // ─── WEBSOCKET SETUP ──────────────────────────────────────────────────────
  useEffect(() => {
    setWsConnected(true);

    const handleAttendanceUpdate = (e) => {
      const data = e.detail;
      if (!data) return;
      try {
        console.log("Received attendance-update in AdminAttendanceTable:", data);
        setAttendanceRecords(prev =>
          prev.map(record => {
            const isMatch =
              (data.employeeId && record.employeeId === data.employeeId) ||
              (data.employeeId && record._id === data.employeeId) ||
              (data.employeeObjId && (record._id === data.employeeObjId || record._id === `att_${data.employeeObjId}` || record.employeeId === data.employeeObjId)) ||
              (data.employeeId && String(record.employeeId).toLowerCase() === String(data.employeeId).toLowerCase());

            if (isMatch) {
              return {
                ...record,
                onlineStatus: data.onlineStatus !== undefined ? data.onlineStatus : record.onlineStatus,
                breakType: data.breakType !== undefined ? data.breakType : record.breakType,
                status: data.status !== undefined ? data.status : record.status,
                checkInTime: data.checkInTime !== undefined ? data.checkInTime : record.checkInTime,
                checkOutTime: data.checkOutTime !== undefined ? data.checkOutTime : record.checkOutTime
              };
            }
            return record;
          })
        );
      } catch (err) {
        console.error("Socket message error:", err);
      }
    };

    window.addEventListener("socket-attendance-update", handleAttendanceUpdate);

    return () => {
      window.removeEventListener("socket-attendance-update", handleAttendanceUpdate);
    };
  }, []);

  // ─── FETCH ATTENDANCE RECORDS ────────────────────────────────────────────
  const fetchAttendanceRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching admin summary for date:', selectedDate);

      const response = await API.get(`/attendance/admin/summary?date=${selectedDate}`);

      // Extract data from response
      const data = response.data?.data || response.data || [];

      if (Array.isArray(data)) {
        setAttendanceRecords(data);
      } else {
        console.warn('Unexpected response format:', data);
        setAttendanceRecords([]);
        setError('Received invalid data format from server');
      }

      console.log(`✅ Loaded ${data.length} attendance records`);

    } catch (error) {
      console.error("Failed to fetch attendance records:", error);

      // Get error message from response
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'Failed to load attendance data';

      setError(errorMessage);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // ─── EFFECT: FETCH ON MOUNT AND POLL ─────────────────────────────────────
  useEffect(() => {
    // Initial fetch
    const timerId = setTimeout(() => {
      fetchAttendanceRecords();
    }, 0);

    // Refresh every 180 seconds (3 minutes)
    const interval = setInterval(() => {
      fetchAttendanceRecords();
    }, 180000);

    return () => {
      clearTimeout(timerId);
      clearInterval(interval);
    };
  }, [fetchAttendanceRecords]);

  // ─── BREAK HELPERS ────────────────────────────────────────────────────────
  const isOnBreakfast = (r) => r?.onlineStatus === "Breakfast" || r?.breakType === "breakfast";
  const isOnLunch = (r) => r?.onlineStatus === "Lunch" || r?.breakType === "lunch";
  const isOnTea = (r) => r?.onlineStatus === "Tea Time" || r?.onlineStatus === "Tea" || r?.breakType === "tea";
  const isOnAnyBreak = (r) => isOnBreakfast(r) || isOnLunch(r) || isOnTea(r);

  // ─── GET STATUS BADGE ─────────────────────────────────────────────────────
  const getStatusBadge = (status, onlineStatus, breakType) => {
    if (breakType || ['Breakfast', 'Lunch', 'Tea Time', 'Tea'].includes(onlineStatus)) {
      return {
        label: 'Offline',
        className: 'bg-gray-100 text-gray-600 border border-gray-200',
        icon: <WifiOff size={12} className="text-gray-400" />
      };
    }
    if (onlineStatus === 'Online') {
      return {
        label: 'Online',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        icon: <Wifi size={12} className="text-emerald-500" />
      };
    }
    return {
      label: 'Offline',
      className: 'bg-gray-100 text-gray-600 border border-gray-200',
      icon: <WifiOff size={12} className="text-gray-400" />
    };
  };

  const getBreakLabel = (breakType, onlineStatus) => {
    if (breakType === 'breakfast' || onlineStatus === 'Breakfast') return '🍳 Breakfast';
    if (breakType === 'lunch' || onlineStatus === 'Lunch') return '🍽️ Lunch';
    if (breakType === 'tea' || onlineStatus === 'Tea Time' || onlineStatus === 'Tea') return '☕ Tea Time';
    return '—';
  };

  // ─── GET ATTENDANCE STATUS COLOR ─────────────────────────────────────────
  const getAttendanceStatusColor = (status) => {
    const colors = {
      "Present": "bg-green-100 text-green-700 border border-green-200",
      "Late": "bg-amber-100 text-amber-700 border border-amber-200",
      "Absent": "bg-gray-100 text-gray-600 border border-gray-200",
      "Half-Day": "bg-orange-100 text-orange-700 border border-orange-200",
      "Not Marked": "bg-gray-50 text-gray-400 border border-gray-200"
    };
    return colors[status] || "bg-gray-100 text-gray-600";
  };

  // ─── FILTER RECORDS ──────────────────────────────────────────────────────
  const getFilteredRecords = () => {
    let records = attendanceRecords;

    // Apply status filter
    if (filter !== "all") {
      if (filter === "online") {
        records = records.filter(r => r.onlineStatus === "Online" && !isOnAnyBreak(r));
      } else if (filter === "breakfast") {
        records = records.filter(r => isOnBreakfast(r));
      } else if (filter === "lunch") {
        records = records.filter(r => isOnLunch(r));
      } else if (filter === "tea") {
        records = records.filter(r => isOnTea(r));
      } else if (filter === "offline") {
        records = records.filter(r => (r.onlineStatus === "Offline" || !r.onlineStatus) && !isOnAnyBreak(r));
      }
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(r =>
        r.employeeName?.toLowerCase().includes(term) ||
        r.employeeId?.toLowerCase().includes(term) ||
        r.department?.toLowerCase().includes(term)
      );
    }

    return records;
  };

  const filteredRecords = getFilteredRecords();
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // ─── STATS ──────────────────────────────────────────────────────────────
  const stats = {
    total: attendanceRecords.length,
    online: attendanceRecords.filter(r => r.onlineStatus === "Online" && !isOnAnyBreak(r)).length,
    breakfast: attendanceRecords.filter(r => isOnBreakfast(r)).length,
    lunch: attendanceRecords.filter(r => isOnLunch(r)).length,
    tea: attendanceRecords.filter(r => isOnTea(r)).length,
    offline: attendanceRecords.filter(r => (r.onlineStatus === "Offline" || !r.onlineStatus) && !isOnAnyBreak(r)).length,
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  if (loading && attendanceRecords.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 text-sm">Loading attendance records...</span>
      </div>
    );
  }

  if (error && attendanceRecords.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Data</h3>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={fetchAttendanceRecords}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ─── HEADER ───────────────────────────────────────────────────────── */}
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">Attendance Summary</h3>
            {wsConnected && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live updates active
              </span>
            )}
            {!wsConnected && (
              <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400" />
                Offline mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchAttendanceRecords}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ─── STATS ROW ──────────────────────────────────────────────────── */}
        {attendanceRecords.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter("online")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter === "online"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
              >
                <Wifi size={12} /> Online ({stats.online})
              </button>
              <button
                onClick={() => setFilter("breakfast")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter === "breakfast"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
              >
                <Coffee size={12} /> Breakfast ({stats.breakfast})
              </button>
              <button
                onClick={() => setFilter("lunch")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter === "lunch"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                  }`}
              >
                <Utensils size={12} /> Lunch ({stats.lunch})
              </button>
              <button
                onClick={() => setFilter("tea")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter === "tea"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
              >
                <Moon size={12} /> Tea ({stats.tea})
              </button>
              <button
                onClick={() => setFilter("offline")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${filter === "offline"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                <WifiOff size={12} /> Offline ({stats.offline})
              </button>
            </div>
          </div>
        )}

        {/* ─── SEARCH ────────────────────────────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ─── TABLE ────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Attendance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Break</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {loading ? 'Loading...' : 'No attendance records found for this date'}
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => {
                const statusBadge = getStatusBadge(
                  record.status,
                  record.onlineStatus,
                  record.breakType
                );
                const attendanceStatusColor = getAttendanceStatusColor(record.status);
                const breakLabel = getBreakLabel(record.breakType, record.onlineStatus);

                return (
                  <tr key={record._id || record.employeeId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{record.employeeName || record.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{record.employeeId || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.department || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${attendanceStatusColor}`}>
                        {record.status || "Absent"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.className}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
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
      {filteredRecords.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
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
            </select>
            <span>entries</span>
          </div>

          <div>
            Showing <span className="font-semibold text-gray-800">{Math.min(filteredRecords.length, (currentPage - 1) * rowsPerPage + 1)}</span> to{" "}
            <span className="font-semibold text-gray-800">{Math.min(filteredRecords.length, currentPage * rowsPerPage)}</span> of{" "}
            <span className="font-semibold text-gray-800">{filteredRecords.length}</span> entries
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
    </div>
  );
};

export default AdminAttendanceTable;