import React, { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ListTodo,
  BookOpen,
  Briefcase,
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

  const [date, setDate] = useState(getLocalDateString());
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States for submission status modal
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subModalTab, setSubModalTab] = useState("submitted"); // "submitted" | "not_submitted"
  const [subModalSearch, setSubModalSearch] = useState("");

  const openSubmissionModal = async () => {
    setIsSubModalOpen(true);
    setEmployeesLoading(true);
    try {
      const res = await API.get("/employees?limit=1000");
      const data = res?.data?.data || res?.data || [];
      // Filter out terminated or inactive profiles to keep current workforce list
      setAllEmployees(data.filter(emp => emp.status !== "Terminated" && emp.status !== "Inactive"));
    } catch (err) {
      console.error("Failed to load employees for submissions modal:", err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // ── Fetch Daily Reports for the selected Date ──────────────────────────────
  const fetchReports = useCallback(async (targetDate) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.get("/daily-reports/all", { params: { date: targetDate } });
      const data = res?.data ?? res;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load daily reports:", err);
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to load daily reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(date);
  }, [date, fetchReports]);

  // ── Navigation functions ────────────────────────────────────────────────────
  const handlePrevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setDate(getLocalDateString());
  };

  const handleRefresh = () => {
    fetchReports(date);
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

  // ── Filtered Reports list ───────────────────────────────────────────────────
  const filteredReports = reports.filter((r) => {
    const empDetails = r.employeeId || {};
    const nameMatch =
      r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${empDetails.firstName || ""} ${empDetails.lastName || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      empDetails.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

    const deptMatch = selectedDept
      ? r.teamPosition === selectedDept || empDetails.department === selectedDept
      : true;

    return nameMatch && deptMatch;
  });

  const openDetailsModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedReport(null);
    setIsModalOpen(false);
  };

  // Partition employees into submitted and not-submitted lists
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

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Daily Progress Reports</h1>
          <p className="text-gray-500 mt-1">
            Review employee daily submissions, tracked work hours, and task updates.
          </p>
        </div>

        {/* Date Controller & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
            <button
              onClick={handlePrevDay}
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
              onClick={handleNextDay}
              className="p-2.5 hover:bg-gray-50 transition border-l border-gray-200 text-gray-600"
              title="Next Day"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl transition shadow-sm"
          >
            Today
          </button>

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
          onClick={openSubmissionModal}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition duration-200"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Total Submissions
          </p>
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
            Pending Tasks
          </p>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
              <ListTodo size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-600">{pendingTasksCount}</p>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by employee name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Filter size={18} className="text-gray-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full md:w-56 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Report Cards / List View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <RefreshCw size={40} className="text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Loading daily reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
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
          {filteredReports.map((report) => {
            const emp = report.employeeId || {};
            const displayName =
              report.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Unknown Employee";
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
