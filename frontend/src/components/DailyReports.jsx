import React, { useState, useEffect, useCallback, useMemo } from "react";
import API from "../services/api";
import {
  Calendar,
  Search,
  Filter,
  Clock,
  User,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ListTodo,
  BookOpen,
  Briefcase,
  ArrowLeft,
  CalendarDays,
  Layers,
} from "lucide-react";

const DEPARTMENTS = [
  "Frontend Developer",
  "Backend Developer",
  "Team Lead",
  "Assistant Team Lead",
  "BA",
  "Quality Assurance",
  "IT",
  "Fullstack",
  "PM",
];

const DailyReports = () => {
  const getLocalDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  // Helper to calculate Saturday to Friday cycle for any reference date
  const getLastSaturdayToFridayRange = (refDateStr) => {
    if (!refDateStr) refDateStr = getLocalDateString();
    const [year, month, day] = refDateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat
    // Saturday is 6 -> daysSinceSaturday = 0
    // Sunday is 0 -> daysSinceSaturday = 1
    // Friday is 5 -> daysSinceSaturday = 6
    const daysSinceSaturday = (dayOfWeek + 1) % 7;

    const start = new Date(year, month - 1, day - daysSinceSaturday);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

    const toYMD = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dt = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${dt}`;
    };

    return {
      startDate: toYMD(start),
      endDate: toYMD(end),
      startLabel: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      endLabel: end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  };

  const [date, setDate] = useState(getLocalDateString());
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "7days" | "all"
  const [selectedEmployeeForReports, setSelectedEmployeeForReports] = useState(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination for daily reports & drill-down reports
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  // Pagination for employee cards (in 7days / all mode)
  const [empPage, setEmpPage] = useState(1);
  const [empLimit, setEmpLimit] = useState(8);

  // All employees list
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  // States for submission status modal (for daily view)
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalTab, setSubModalTab] = useState("submitted"); // "submitted" | "not_submitted"
  const [subModalSearch, setSubModalSearch] = useState("");

  // ── Pre-fetch all active employees on mount ──────────────────────────────────
  const fetchAllEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    try {
      const res = await API.get("/employees?limit=1000");
      const data = res?.data?.data || res?.data || [];
      setAllEmployees(
        data.filter((emp) => emp.status !== "Terminated" && emp.status !== "Inactive")
      );
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEmployees();
  }, [fetchAllEmployees]);

  const openSubmissionModal = () => {
    if (allEmployees.length === 0) {
      fetchAllEmployees();
    }
    setIsSubModalOpen(true);
  };

  // ── Fetch Reports based on viewMode ─────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      let params = {};
      if (viewMode === "daily") {
        params = { date };
      } else if (viewMode === "7days") {
        const { startDate, endDate } = getLastSaturdayToFridayRange(date);
        params = { startDate, endDate };
      } else if (viewMode === "all") {
        params = { all: true };
      }

      const res = await API.get("/daily-reports/all", { params });
      const data = res?.data ?? res;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load daily reports:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [viewMode, date]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Date Navigation functions ───────────────────────────────────────────────
  const handlePrev = () => {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (viewMode === "7days") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    setDate(`${y}-${m}-${dt}`);
  };

  const handleNext = () => {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (viewMode === "7days") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    setDate(`${y}-${m}-${dt}`);
  };

  const handleToday = () => {
    setViewMode("daily");
    setDate(getLocalDateString());
    setSelectedEmployeeForReports(null);
  };

  const handle7Days = () => {
    setViewMode("7days");
    setSelectedEmployeeForReports(null);
  };

  const handleAll = () => {
    setViewMode("all");
    setSelectedEmployeeForReports(null);
  };

  const handleRefresh = () => {
    fetchReports();
    if (allEmployees.length === 0) {
      fetchAllEmployees();
    }
  };

  let totalTasksCount = 0;
  let completedTasksCount = 0;
  let inProgressTasksCount = 0;
  let pendingTasksCount = 0;

  reports.forEach((r) => {
    if (r.tasks && Array.isArray(r.tasks)) {
      r.tasks.forEach((t) => {
        totalTasksCount++;
        if (t.status === "Completed") completedTasksCount++;
        else if (t.status === "In Progress") inProgressTasksCount++;
        else pendingTasksCount++;
      });
    }
  });

  // ── Employee Stats Map for 7 Days / All views ──────────────────────────────
  const employeeStatsMap = useMemo(() => {
    const map = new Map();
    reports.forEach((r) => {
      const rEmpId = r.employeeId?._id || r.employeeId;
      const idStr =
        typeof rEmpId === "object"
          ? rEmpId?._id?.toString() || rEmpId?.toString()
          : rEmpId?.toString();
      if (!idStr) return;
      if (!map.has(idStr)) {
        map.set(idStr, {
          reports: [],
          completedTasks: 0,
          totalTasks: 0,
        });
      }
      const stat = map.get(idStr);
      stat.reports.push(r);
      if (r.tasks && Array.isArray(r.tasks)) {
        stat.totalTasks += r.tasks.length;
        stat.completedTasks += r.tasks.filter((t) => t.status === "Completed").length;
      }
    });
    return map;
  }, [reports]);

  // ── Available department / team position options ────────────────────────────
  const filterDepartmentOptions = useMemo(() => {
    const set = new Set(DEPARTMENTS);
    allEmployees.forEach((emp) => {
      if (emp.department && emp.department.trim()) {
        set.add(emp.department.trim());
      }
    });
    reports.forEach((r) => {
      if (r.teamPosition && r.teamPosition.trim()) {
        set.add(r.teamPosition.trim());
      }
    });
    return Array.from(set).sort();
  }, [allEmployees, reports]);

  // Helper to match an employee against selected department/position
  const doesEmployeeMatchDept = useCallback(
    (emp, targetDept) => {
      if (!targetDept) return true;
      const target = targetDept.toLowerCase().trim();

      // 1. Direct employee department match
      if (emp.department && emp.department.toLowerCase().trim() === target) {
        return true;
      }
      // 2. Direct employee designation match
      if (emp.designation && emp.designation.toLowerCase().trim() === target) {
        return true;
      }
      // 3. Match against teamPosition on any submitted report
      const empIdStr = emp._id?.toString();
      const empReports = employeeStatsMap.get(empIdStr)?.reports || [];
      if (
        empReports.some(
          (r) => r.teamPosition && r.teamPosition.toLowerCase().trim() === target
        )
      ) {
        return true;
      }
      return false;
    },
    [employeeStatsMap]
  );

  // ── Filtered Employees for 7 Days / All cards ───────────────────────────────
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allEmployees.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const empId = (emp.employeeId || "").toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || empId.includes(q) || email.includes(q);
      const matchesDept = doesEmployeeMatchDept(emp, selectedDept);
      return matchesSearch && matchesDept;
    });
  }, [allEmployees, searchQuery, selectedDept, doesEmployeeMatchDept]);

  // Reset pagination on filter or view mode changes
  useEffect(() => {
    setPage(1);
    setEmpPage(1);
  }, [date, viewMode, searchQuery, selectedDept, selectedEmployeeForReports]);

  // ── Reports for Selected Employee (Drill-Down) ──────────────────────────────
  const selectedEmployeeReports = useMemo(() => {
    if (!selectedEmployeeForReports) return [];
    const empIdStr = selectedEmployeeForReports._id?.toString();
    const list = reports.filter((r) => {
      const rEmpId = r.employeeId?._id || r.employeeId;
      const rEmpIdStr =
        typeof rEmpId === "object"
          ? rEmpId?._id?.toString() || rEmpId?.toString()
          : rEmpId?.toString();
      return rEmpIdStr === empIdStr;
    });
    // Sort by date descending
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedEmployeeForReports, reports]);

  // Filtered Daily Reports list (Daily View)
  const filteredDailyReports = useMemo(() => {
    return reports.filter((r) => {
      const empDetails = r.employeeId || {};
      const nameMatch =
        !searchQuery ||
        r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${empDetails.firstName || ""} ${empDetails.lastName || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        empDetails.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

      const targetDept = selectedDept.toLowerCase().trim();
      const deptMatch = !selectedDept
        ? true
        : (r.teamPosition && r.teamPosition.toLowerCase().trim() === targetDept) ||
          (empDetails.department && empDetails.department.toLowerCase().trim() === targetDept) ||
          (empDetails.designation && empDetails.designation.toLowerCase().trim() === targetDept);

      return nameMatch && deptMatch;
    });
  }, [reports, searchQuery, selectedDept]);

  // Pagination for Daily Reports
  const totalCount = filteredDailyReports.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedDailyReports = filteredDailyReports.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  // Pagination for Selected Employee Reports
  const totalEmpReportsCount = selectedEmployeeReports.length;
  const totalEmpReportsPages = Math.max(1, Math.ceil(totalEmpReportsCount / limit));
  const currentEmpReportPage = Math.min(page, totalEmpReportsPages);
  const paginatedEmployeeReports = selectedEmployeeReports.slice(
    (currentEmpReportPage - 1) * limit,
    currentEmpReportPage * limit
  );

  // Pagination for Employee Cards Grid (7 Days / All View)
  const totalEmpCount = filteredEmployees.length;
  const totalEmpPages = Math.max(1, Math.ceil(totalEmpCount / empLimit));
  const currentEmpPage = Math.min(empPage, totalEmpPages);
  const paginatedEmployees = filteredEmployees.slice(
    (currentEmpPage - 1) * empLimit,
    currentEmpPage * empLimit
  );

  const openDetailsModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedReport(null);
    setIsModalOpen(false);
  };

  // Partition employees into submitted and not-submitted lists (for Daily View Submission Modal)
  const submittedEmployees = [];
  const notSubmittedEmployees = [];

  allEmployees.forEach((emp) => {
    const empIdStr = emp._id?.toString();
    const matchingReport = reports.find((r) => {
      const rEmpId = r.employeeId?._id || r.employeeId;
      const rEmpIdStr = typeof rEmpId === "object" ? rEmpId?._id || rEmpId : rEmpId;
      return rEmpIdStr?.toString() === empIdStr;
    });

    if (matchingReport) {
      submittedEmployees.push({ ...emp, report: matchingReport });
    } else {
      notSubmittedEmployees.push(emp);
    }
  });

  const filterBySearch = (list) => {
    if (!subModalSearch) return list;
    const q = subModalSearch.toLowerCase();
    return list.filter((emp) => {
      const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
      const empId = (emp.employeeId || "").toLowerCase();
      return fullName.includes(q) || empId.includes(q);
    });
  };

  const displaySubmitted = filterBySearch(submittedEmployees);
  const displayNotSubmitted = filterBySearch(notSubmittedEmployees);

  const weekRange = getLastSaturdayToFridayRange(date);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-800">Daily Progress Reports</h1>
            {viewMode === "7days" && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                7 Days View
              </span>
            )}
            {viewMode === "all" && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                All History View
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {viewMode === "daily" &&
              "Review employee daily submissions, tracked work hours, and task updates."}
            {viewMode === "7days" &&
              `Weekly submissions from ${weekRange.startLabel} to ${weekRange.endLabel} (Saturday to Friday).`}
            {viewMode === "all" &&
              "Review all submitted historical progress reports across all employees."}
          </p>
        </div>

        {/* Date Controller & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Navigation Control */}
          {viewMode === "daily" ? (
            <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={handlePrev}
                className="p-2.5 hover:bg-gray-50 transition border-r border-gray-200 text-gray-600"
                title="Previous Day"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <Calendar size={16} className="text-indigo-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-medium text-sm text-gray-800 focus:outline-none border-none cursor-pointer"
                />
              </div>
              <button
                onClick={handleNext}
                className="p-2.5 hover:bg-gray-50 transition border-l border-gray-200 text-gray-600"
                title="Next Day"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : viewMode === "7days" ? (
            <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={handlePrev}
                className="p-2.5 hover:bg-gray-50 transition border-r border-gray-200 text-gray-600"
                title="Previous Week (Sat - Fri)"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <CalendarDays size={16} className="text-indigo-600" />
                <span className="font-semibold text-xs sm:text-sm text-gray-800">
                  {weekRange.startLabel} – {weekRange.endLabel}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                  Sat-Fri
                </span>
              </div>
              <button
                onClick={handleNext}
                className="p-2.5 hover:bg-gray-50 transition border-l border-gray-200 text-gray-600"
                title="Next Week (Sat - Fri)"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-sm px-3.5 py-2 gap-2 text-sm text-gray-700 font-medium">
              <Layers size={16} className="text-indigo-600" />
              <span>All Historical Records</span>
            </div>
          )}

          {/* Today Button */}
          <button
            onClick={handleToday}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition shadow-sm ${
              viewMode === "daily"
                ? "bg-indigo-600 text-white shadow-indigo-200"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
            }`}
          >
            Today
          </button>

          {/* 7 Days Button (Right Side of Today) */}
          <button
            onClick={handle7Days}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition shadow-sm ${
              viewMode === "7days"
                ? "bg-indigo-600 text-white shadow-indigo-200"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
            }`}
          >
            7 Days
          </button>

          {/* All Button (Right Side of 7 Days) */}
          <button
            onClick={handleAll}
            className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition shadow-sm ${
              viewMode === "all"
                ? "bg-indigo-600 text-white shadow-indigo-200"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
            }`}
          >
            All
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition bg-white text-gray-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={viewMode === "daily" ? openSubmissionModal : undefined}
          className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-4 ${
            viewMode === "daily"
              ? "cursor-pointer hover:border-indigo-300 hover:shadow-md transition duration-200"
              : ""
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {viewMode === "daily"
                ? "Total Submissions"
                : viewMode === "7days"
                ? "7-Day Reports"
                : "Total Reports"}
            </p>
            {viewMode === "daily" && (
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">
                Click to view
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <User size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Completed Tasks
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
            <p className="text-2xl font-bold text-green-700">{completedTasksCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Tasks In Progress
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <RefreshCw size={20} />
            </div>
            <p className="text-2xl font-bold text-blue-700">{inProgressTasksCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {viewMode === "daily" ? "Pending Tasks" : "Active Workforce"}
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
              {viewMode === "daily" ? <ListTodo size={20} /> : <User size={20} />}
            </div>
            <p className="text-2xl font-bold text-gray-600">
              {viewMode === "daily" ? pendingTasksCount : allEmployees.length}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters (hidden when drill-down employee is active) */}
      {!selectedEmployeeForReports && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={
                viewMode === "daily"
                  ? "Search by employee name or ID..."
                  : "Search employee cards by name or ID..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <Filter size={18} className="text-gray-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full md:w-56 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition cursor-pointer"
            >
              <option value="">All Departments & Roles</option>
              {filterDepartmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 1: DAILY VIEW (Existing single day report cards)               */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {viewMode === "daily" && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw size={40} className="text-indigo-600 animate-spin" />
              <p className="text-gray-500 font-medium animate-pulse">Loading daily reports...</p>
            </div>
          ) : filteredDailyReports.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Daily Reports Found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {reports.length === 0
                  ? `No employees have submitted progress reports for ${date}.`
                  : "Try adjusting your search queries or department filters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedDailyReports.map((report) => {
                const emp = report.employeeId || {};
                const displayName =
                  report.fullName ||
                  `${emp.firstName || ""} ${emp.lastName || ""}`.trim() ||
                  "Unknown Employee";
                const displayDept = report.teamPosition || emp.department || "No Department";
                const displayId = emp.employeeId ? `ID: ${emp.employeeId}` : "MOCK/NO-ID";

                return (
                  <div
                    key={report._id}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                            {displayName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-base leading-tight">
                              {displayName}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">{displayId}</p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg">
                          {displayDept}
                        </span>
                      </div>

                      {/* Logged hours */}
                      <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Clock size={16} className="text-indigo-500" />
                          <span className="font-medium">
                            {report.startTime} - {report.endTime}
                          </span>
                        </div>
                        {report.totalHours && (
                          <div className="text-xs font-bold text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                            {report.totalHours} worked
                          </div>
                        )}
                      </div>

                      {/* Tasks Section */}
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          <span>Tasks List</span>
                          <span>Status</span>
                        </div>
                        {report.tasks && report.tasks.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {report.tasks.map((task, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center gap-4 py-1.5 border-b border-gray-50 last:border-0 text-sm"
                              >
                                <span className="text-gray-600 line-clamp-1">
                                  {task.description}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs font-semibold rounded-md border shrink-0 ${
                                    task.status === "Completed"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : task.status === "In Progress"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-gray-50 text-gray-600 border-gray-200"
                                  }`}
                                >
                                  {task.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No specific tasks reported (worked on miscellaneous assignments).
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer action */}
                    <button
                      onClick={() => openDetailsModal(report)}
                      className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-xl transition"
                    >
                      <FileText size={16} />
                      View Full Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls for Daily Reports */}
          {!loading && totalCount > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  Showing{" "}
                  <strong className="text-gray-800 font-semibold">
                    {(currentPage - 1) * limit + 1}
                    –{Math.min(currentPage * limit, totalCount)}
                  </strong>{" "}
                  of <strong className="text-gray-800 font-semibold">{totalCount}</strong> reports
                </span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={currentPage <= 1}
                    title="First Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                    title="Previous Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, currentPage - 2);
                      let end = Math.min(totalPages, currentPage + 2);

                      if (currentPage <= 3) {
                        start = 1;
                        end = Math.min(totalPages, maxVisible);
                      } else if (currentPage >= totalPages - 2) {
                        start = Math.max(1, totalPages - maxVisible + 1);
                        end = totalPages;
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      return pages.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
                            p === currentPage
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    title="Next Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    title="Last Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 2: 7 DAYS & ALL - EMPLOYEE CARDS GRID                          */}
      {/* (When viewMode !== "daily" and no employee is currently selected)       */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {viewMode !== "daily" && !selectedEmployeeForReports && (
        <>
          {loading || employeesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw size={40} className="text-indigo-600 animate-spin" />
              <p className="text-gray-500 font-medium animate-pulse">
                Loading employee cards & {viewMode === "7days" ? "7 days" : "all"} submission data...
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <User size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Employees Found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                No active employees matched your search query or department filter.
              </p>
            </div>
          ) : (
            <>
              {/* Employee Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {paginatedEmployees.map((emp) => {
                  const empIdStr = emp._id?.toString();
                  const empStats = employeeStatsMap.get(empIdStr) || {
                    reports: [],
                    completedTasks: 0,
                    totalTasks: 0,
                  };
                  const subCount = empStats.reports.length;

                  return (
                    <div
                      key={emp._id}
                      onClick={() => {
                        setSelectedEmployeeForReports(emp);
                        setPage(1);
                      }}
                      className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer p-5 flex flex-col justify-between group hover:-translate-y-0.5"
                    >
                      <div>
                        {/* Top Profile Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
                              {(emp.firstName || "E").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-800 text-sm truncate group-hover:text-indigo-600 transition">
                                {emp.firstName} {emp.lastName}
                              </h3>
                              <p className="text-xs text-gray-400 font-medium">
                                ID: {emp.employeeId || "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Department / Position Badge */}
                        <div className="mb-3">
                          <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100/60 text-indigo-700 text-xs font-semibold rounded-lg truncate max-w-full">
                            {emp.department ||
                              empStats.reports[0]?.teamPosition ||
                              emp.designation ||
                              "General"}
                          </span>
                        </div>

                        {/* Submission & Performance Stats */}
                        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                          <div>
                            <span className="text-gray-400 block text-[11px] mb-0.5 font-medium">
                              Submissions
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                subCount > 0 ? "text-indigo-700" : "text-gray-400"
                              }`}
                            >
                              {subCount}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                {viewMode === "7days" ? "/ 7 days" : "reports"}
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[11px] mb-0.5 font-medium">
                              Tasks Done
                            </span>
                            <span className="text-sm font-bold text-green-700">
                              {empStats.completedTasks}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                / {empStats.totalTasks}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                        <span>
                          {subCount > 0 ? "Click to view reports" : "No submitted reports"}
                        </span>
                        <ChevronRight
                          size={16}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for Employee Cards */}
              {totalEmpCount > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>
                      Showing{" "}
                      <strong className="text-gray-800 font-semibold">
                        {(currentEmpPage - 1) * empLimit + 1}
                        –{Math.min(currentEmpPage * empLimit, totalEmpCount)}
                      </strong>{" "}
                      of <strong className="text-gray-800 font-semibold">{totalEmpCount}</strong> employees
                    </span>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-1.5">
                      <span>Per page:</span>
                      <select
                        value={empLimit}
                        onChange={(e) => {
                          setEmpLimit(Number(e.target.value));
                          setEmpPage(1);
                        }}
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                      >
                        <option value={4}>4</option>
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                      </select>
                    </div>
                  </div>

                  {totalEmpPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEmpPage(1)}
                        disabled={currentEmpPage <= 1}
                        title="First Page"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronsLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmpPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentEmpPage <= 1}
                        title="Previous Page"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {(() => {
                          const pages = [];
                          const maxVisible = 5;
                          let start = Math.max(1, currentEmpPage - 2);
                          let end = Math.min(totalEmpPages, currentEmpPage + 2);

                          if (currentEmpPage <= 3) {
                            start = 1;
                            end = Math.min(totalEmpPages, maxVisible);
                          } else if (currentEmpPage >= totalEmpPages - 2) {
                            start = Math.max(1, totalEmpPages - maxVisible + 1);
                            end = totalEmpPages;
                          }

                          for (let i = start; i <= end; i++) {
                            pages.push(i);
                          }

                          return pages.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setEmpPage(p)}
                              className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
                                p === currentEmpPage
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {p}
                            </button>
                          ));
                        })()}
                      </div>

                      <button
                        type="button"
                        onClick={() => setEmpPage((prev) => Math.min(totalEmpPages, prev + 1))}
                        disabled={currentEmpPage >= totalEmpPages}
                        title="Next Page"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmpPage(totalEmpPages)}
                        disabled={currentEmpPage >= totalEmpPages}
                        title="Last Page"
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* VIEW MODE 3: DRILL-DOWN VIEW (Selected employee's submitted reports)    */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {viewMode !== "daily" && selectedEmployeeForReports && (
        <div className="space-y-6">
          {/* Back Button & Employee Profile Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <button
              onClick={() => setSelectedEmployeeForReports(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 mb-5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition shadow-sm"
            >
              <ArrowLeft size={15} />
              Back to All Employees
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-2xl shadow-sm">
                  {(selectedEmployeeForReports.firstName || "E").charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedEmployeeForReports.firstName} {selectedEmployeeForReports.lastName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                    <span>ID: {selectedEmployeeForReports.employeeId || "—"}</span>
                    <span>•</span>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded-md border border-indigo-100">
                      {selectedEmployeeForReports.department ||
                        selectedEmployeeReports[0]?.teamPosition ||
                        selectedEmployeeForReports.designation ||
                        "No Department"}
                    </span>
                    <span>•</span>
                    <span>{selectedEmployeeForReports.email || "No email"}</span>
                  </div>
                </div>
              </div>

              {/* Summary Stats Badges */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex-1 md:flex-initial px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                  <span className="text-[11px] text-gray-500 block font-medium">
                    {viewMode === "7days" ? "7-Day Reports" : "All Reports"}
                  </span>
                  <span className="text-lg font-bold text-indigo-700">
                    {selectedEmployeeReports.length}{" "}
                    <span className="text-xs font-normal text-gray-600">
                      {viewMode === "7days" ? "/ 7 days" : "submitted"}
                    </span>
                  </span>
                </div>
                <div className="flex-1 md:flex-initial px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl text-center">
                  <span className="text-[11px] text-gray-500 block font-medium">
                    Tasks Completed
                  </span>
                  <span className="text-lg font-bold text-green-700">
                    {selectedEmployeeReports.reduce(
                      (acc, r) =>
                        acc + (r.tasks?.filter((t) => t.status === "Completed").length || 0),
                      0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* List of Reports for the selected employee */}
          {selectedEmployeeReports.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Submitted Reports</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                {selectedEmployeeForReports.firstName} {selectedEmployeeForReports.lastName} has
                not submitted any progress reports for{" "}
                {viewMode === "7days"
                  ? `the week of ${weekRange.startLabel} – ${weekRange.endLabel}`
                  : "all time"}
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedEmployeeReports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Header with Date Badge */}
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        <h3 className="font-bold text-gray-800 text-base leading-tight">
                          {report.date}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg">
                        {report.teamPosition || selectedEmployeeForReports.department}
                      </span>
                    </div>

                    {/* Logged hours */}
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock size={16} className="text-indigo-500" />
                        <span className="font-medium">
                          {report.startTime} - {report.endTime}
                        </span>
                      </div>
                      {report.totalHours && (
                        <div className="text-xs font-bold text-indigo-700 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                          {report.totalHours} worked
                        </div>
                      )}
                    </div>

                    {/* Tasks Section */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                        <span>Tasks List ({report.tasks?.length || 0})</span>
                        <span>Status</span>
                      </div>
                      {report.tasks && report.tasks.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {report.tasks.map((task, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center gap-4 py-1.5 border-b border-gray-50 last:border-0 text-sm"
                            >
                              <span className="text-gray-600 line-clamp-1">{task.description}</span>
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-md border shrink-0 ${
                                  task.status === "Completed"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : task.status === "In Progress"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No specific tasks reported.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer action */}
                  <button
                    onClick={() => openDetailsModal(report)}
                    className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 border border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50 text-indigo-600 text-sm font-semibold rounded-xl transition"
                  >
                    <FileText size={16} />
                    View Full Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls for Selected Employee's Reports */}
          {totalEmpReportsCount > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  Showing{" "}
                  <strong className="text-gray-800 font-semibold">
                    {(currentEmpReportPage - 1) * limit + 1}
                    –{Math.min(currentEmpReportPage * limit, totalEmpReportsCount)}
                  </strong>{" "}
                  of <strong className="text-gray-800 font-semibold">{totalEmpReportsCount}</strong> reports
                </span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
                  >
                    <option value={4}>4</option>
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              {totalEmpReportsPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={currentEmpReportPage <= 1}
                    title="First Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentEmpReportPage <= 1}
                    title="Previous Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let start = Math.max(1, currentEmpReportPage - 2);
                      let end = Math.min(totalEmpReportsPages, currentEmpReportPage + 2);

                      if (currentEmpReportPage <= 3) {
                        start = 1;
                        end = Math.min(totalEmpReportsPages, maxVisible);
                      } else if (currentEmpReportPage >= totalEmpReportsPages - 2) {
                        start = Math.max(1, totalEmpReportsPages - maxVisible + 1);
                        end = totalEmpReportsPages;
                      }

                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      return pages.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
                            p === currentEmpReportPage
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalEmpReportsPages, prev + 1))}
                    disabled={currentEmpReportPage >= totalEmpReportsPages}
                    title="Next Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(totalEmpReportsPages)}
                    disabled={currentEmpReportPage >= totalEmpReportsPages}
                    title="Last Page"
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Details Dialog Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center font-bold text-indigo-700 text-lg">
                  {(selectedReport.fullName || selectedReport.employeeId?.firstName || "U").charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 leading-tight">
                    {selectedReport.fullName ||
                      `${selectedReport.employeeId?.firstName || ""} ${
                        selectedReport.employeeId?.lastName || ""
                      }`.trim()}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedReport.teamPosition || selectedReport.employeeId?.department} • Date:{" "}
                    {selectedReport.date}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Working Hours Banner */}
              <div className="flex items-center gap-6 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Clock className="text-indigo-600" size={20} />
                  <span className="font-semibold text-gray-700">Daily Timing:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedReport.startTime} - {selectedReport.endTime}
                  </span>
                </div>
                {selectedReport.totalHours && (
                  <div className="text-sm font-bold text-indigo-600 bg-indigo-100/70 px-3 py-1 rounded-xl">
                    {selectedReport.totalHours} log duration
                  </div>
                )}
              </div>

              {/* Task Progress */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                  <ListTodo className="text-indigo-600" size={18} />
                  Tasks Worked On
                </h3>
                {selectedReport.tasks && selectedReport.tasks.length > 0 ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                    {selectedReport.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 text-sm hover:bg-gray-50 transition"
                      >
                        <span className="text-gray-700 font-medium">{task.description}</span>
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-md border shrink-0 ${
                            task.status === "Completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : task.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-xl">
                    No task breakdown provided.
                  </p>
                )}
              </div>

              {/* Text Fields details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircle className="text-amber-500" size={16} />
                    Challenges & Issues
                  </h4>
                  <div className="text-sm text-gray-600 bg-amber-50/20 border border-amber-100/50 rounded-xl p-3.5 min-h-[80px]">
                    {selectedReport.challengesIssues || "No challenges or roadblocks reported today."}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="text-indigo-500" size={16} />
                    Dependencies & Assistance
                  </h4>
                  <div className="text-sm text-gray-600 bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-3.5 min-h-[80px]">
                    {selectedReport.dependenciesAssistance || "No dependencies or help required."}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Briefcase className="text-blue-500" size={16} />
                    Tomorrow's Plan
                  </h4>
                  <div className="text-sm text-gray-600 bg-blue-50/20 border border-blue-100/50 rounded-xl p-3.5 min-h-[80px]">
                    {selectedReport.plannedTasksTomorrow || "No planned tasks specified."}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="text-gray-500" size={16} />
                    Additional Notes
                  </h4>
                  <div className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3.5 min-h-[80px]">
                    {selectedReport.additionalNotes || "No additional comments."}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Status List Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Submission Summary</h2>
                <p className="text-xs text-gray-400 mt-1">Date: {date}</p>
              </div>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setSubModalTab("submitted")}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${
                  subModalTab === "submitted"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Submitted ({submittedEmployees.length})
              </button>
              <button
                onClick={() => setSubModalTab("not_submitted")}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${
                  subModalTab === "not_submitted"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Not Submitted ({notSubmittedEmployees.length})
              </button>
            </div>

            {/* Search filter inside modal */}
            <div className="p-4 border-b border-gray-50 bg-gray-50/50">
              <input
                type="text"
                placeholder="Search by name or employee ID..."
                value={subModalSearch}
                onChange={(e) => setSubModalSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            {/* List Body */}
            <div className="overflow-y-auto max-h-[50vh] p-6">
              {employeesLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw size={24} className="text-indigo-600 animate-spin mb-2" />
                  <p className="text-sm text-gray-500">Loading employees...</p>
                </div>
              ) : subModalTab === "submitted" ? (
                displaySubmitted.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">No matching submissions.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead>
                        <tr className="text-xs uppercase text-gray-400 font-semibold border-b border-gray-100">
                          <th className="pb-3 pr-2">Employee ID</th>
                          <th className="pb-3 px-2">Name</th>
                          <th className="pb-3 px-2">Department</th>
                          <th className="pb-3 px-2">Total Hours</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displaySubmitted.map((emp) => (
                          <tr key={emp._id} className="hover:bg-gray-50/30 transition">
                            <td className="py-3 pr-2 font-medium text-gray-900">{emp.employeeId || "—"}</td>
                            <td className="py-3 px-2 font-semibold text-gray-800">{emp.firstName} {emp.lastName}</td>
                            <td className="py-3 px-2 text-gray-500">{emp.department || "—"}</td>
                            <td className="py-3 px-2 text-indigo-600 font-semibold">{emp.report.totalHours || "—"}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setIsSubModalOpen(false);
                                  openDetailsModal(emp.report);
                                }}
                                className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg transition"
                              >
                                View Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                displayNotSubmitted.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">All active employees have submitted!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead>
                        <tr className="text-xs uppercase text-gray-400 font-semibold border-b border-gray-100">
                          <th className="pb-3 pr-2">Employee ID</th>
                          <th className="pb-3 px-2">Name</th>
                          <th className="pb-3 px-2">Department</th>
                          <th className="pb-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {displayNotSubmitted.map((emp) => (
                          <tr key={emp._id} className="hover:bg-gray-50/30 transition">
                            <td className="py-3 pr-2 font-medium text-gray-900">{emp.employeeId || "—"}</td>
                            <td className="py-3 px-2 font-semibold text-gray-800">{emp.firstName} {emp.lastName}</td>
                            <td className="py-3 px-2 text-gray-500">{emp.department || "—"}</td>
                            <td className="py-3 text-right">
                              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                                emp.status === "On Leave"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : "bg-red-50 border-red-200 text-red-700"
                              }`}>
                                {emp.status === "On Leave" ? "On Leave" : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReports;
