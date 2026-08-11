import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import {
  Calendar,
  Search,
  Clock,
  RefreshCw,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ListTodo,
  BookOpen,
  Briefcase,
  Edit3,
  Filter,
} from "lucide-react";

const MyDailyReportsHistory = ({ onSelectDateForEdit }) => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalHoursLogged: "0h",
    completedTasksCount: 0,
    inProgressTasksCount: 0,
    pendingTasksCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickRange, setQuickRange] = useState("all");

  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await API.get("/daily-reports/my-history", { params });
      const data = res?.data ?? res;

      setReports(Array.isArray(data.reports) ? data.reports : []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load report history:", err);
      setErrorMsg(
        err?.response?.data?.message || err?.message || "Failed to load report history."
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleQuickRange = (range) => {
    setQuickRange(range);
    const today = new Date();
    if (range === "7days") {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (range === "30days") {
      const past30 = new Date();
      past30.setDate(today.getDate() - 30);
      setStartDate(past30.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedReport(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">My Daily Reports History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Review your previously submitted progress reports, logged hours, and task updates.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition bg-white text-gray-700 shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh History
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Reports
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalReports}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Logged Hours
          </p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {stats.totalHoursLogged || "0h"}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Tasks Completed
          </p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.completedTasksCount}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            In Progress / Pending
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats.inProgressTasksCount + stats.pendingTasksCount}
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search tasks, challenges, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
          />
        </div>

        {/* Date Presets & Date Inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-medium text-gray-600">
            <button
              onClick={() => handleQuickRange("all")}
              className={`px-3 py-1.5 rounded-lg transition ${
                quickRange === "all" ? "bg-white text-gray-900 shadow-sm font-semibold" : "hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleQuickRange("7days")}
              className={`px-3 py-1.5 rounded-lg transition ${
                quickRange === "7days" ? "bg-white text-gray-900 shadow-sm font-semibold" : "hover:text-gray-900"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleQuickRange("30days")}
              className={`px-3 py-1.5 rounded-lg transition ${
                quickRange === "30days" ? "bg-white text-gray-900 shadow-sm font-semibold" : "hover:text-gray-900"
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-600">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setQuickRange("custom");
              }}
              className="bg-transparent focus:outline-none text-xs"
            />
            <span>-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setQuickRange("custom");
              }}
              className="bg-transparent focus:outline-none text-xs"
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <RefreshCw size={36} className="text-indigo-600 animate-spin" />
          <p className="text-gray-500 text-sm animate-pulse font-medium">
            Fetching your past daily reports...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
            <BookOpen size={26} />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">No Past Reports Found</h3>
          <p className="text-gray-500 text-xs max-w-sm mx-auto">
            {startDate || endDate || searchQuery
              ? "No reports match your current filters or date selection."
              : "You haven't submitted any daily progress reports yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Date + Hours */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-600" />
                      <span className="font-bold text-gray-800 text-base">
                        {report.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Position: <span className="font-medium text-gray-600">{report.teamPosition}</span>
                    </p>
                  </div>

                  <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg shrink-0">
                    {report.totalHours ? `${report.totalHours} logged` : "Submitted"}
                  </span>
                </div>

                {/* Timing Badge */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5 mb-3 text-xs text-gray-600">
                  <Clock size={14} className="text-indigo-500 shrink-0" />
                  <span>
                    Logged Timing: <strong className="text-gray-800">{report.startTime} - {report.endTime}</strong>
                  </span>
                </div>

                {/* Tasks Summary */}
                <div className="space-y-1.5 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Tasks ({report.tasks?.length || 0})
                  </p>
                  {report.tasks && report.tasks.length > 0 ? (
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {report.tasks.map((task, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center gap-2 text-xs py-1 border-b border-gray-50 last:border-0"
                        >
                          <span className="text-gray-700 truncate">{task.description}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border shrink-0 ${
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
                    <p className="text-xs text-gray-400 italic">No task items detailed.</p>
                  )}
                </div>

                {/* Indicators */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {report.challengesIssues && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertCircle size={12} /> Roadblock noted
                    </span>
                  )}
                  {report.plannedTasksTomorrow && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      <Briefcase size={12} /> Tomorrow planned
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <button
                  onClick={() => openModal(report)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-indigo-100 hover:bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-xl transition"
                >
                  <FileText size={14} /> Full Details
                </button>
                {onSelectDateForEdit && (
                  <button
                    onClick={() => onSelectDateForEdit(report.date)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
                    title="Load & Edit Report for this date"
                  >
                    <Edit3 size={14} /> Edit Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-start gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Daily Report Details
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Date: <strong className="text-indigo-600">{selectedReport.date}</strong> • Position: {selectedReport.teamPosition}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock size={18} className="text-indigo-600" />
                  <span className="font-semibold">{selectedReport.startTime} - {selectedReport.endTime}</span>
                </div>
                {selectedReport.totalHours && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                    {selectedReport.totalHours} worked
                  </span>
                )}
              </div>

              {/* Tasks */}
              <div>
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-2">
                  <ListTodo className="text-indigo-600" size={16} />
                  Tasks Worked On
                </h4>
                {selectedReport.tasks && selectedReport.tasks.length > 0 ? (
                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
                    {selectedReport.tasks.map((t, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 text-xs">
                        <span className="text-gray-700 font-medium">{t.description}</span>
                        <span
                          className={`px-2 py-0.5 font-bold rounded border shrink-0 ${
                            t.status === "Completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : t.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl">
                    No task breakdown supplied.
                  </p>
                )}
              </div>

              {/* Detailed Text Sections */}
              <div className="space-y-3 pt-1">
                <div>
                  <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                    <AlertCircle className="text-amber-500" size={14} /> Challenges & Issues
                  </h5>
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {selectedReport.challengesIssues || "None reported."}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                    <HelpCircle className="text-indigo-500" size={14} /> Dependencies & Assistance
                  </h5>
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {selectedReport.dependenciesAssistance || "None reported."}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                    <Briefcase className="text-blue-500" size={14} /> Planned for Tomorrow
                  </h5>
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {selectedReport.plannedTasksTomorrow || "None specified."}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                    <FileText className="text-gray-500" size={14} /> Additional Notes
                  </h5>
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {selectedReport.additionalNotes || "None."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              {onSelectDateForEdit ? (
                <button
                  onClick={() => {
                    const dateToEdit = selectedReport.date;
                    closeModal();
                    onSelectDateForEdit(dateToEdit);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Edit3 size={14} /> Edit This Report
                </button>
              ) : <div />}
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-xs rounded-xl transition"
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

export default MyDailyReportsHistory;
