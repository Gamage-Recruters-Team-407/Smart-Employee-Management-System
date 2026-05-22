import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  Building2,
  Briefcase,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  X,
  Paperclip,
} from "lucide-react";
import { fetchEmployees, deleteEmployee } from "../services/employeeService";
import AddEmployeeModal from "../components/AddEmployeeModal";
import DocumentModal from "../components/DocumentModal";

// ─── Status badge colours ────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive: "bg-gray-100 text-gray-600 border border-gray-200",
  "On Leave": "bg-amber-100 text-amber-700 border border-amber-200",
  Terminated: "bg-red-100 text-red-700 border border-red-200",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      STATUS_STYLES[status] || STATUS_STYLES.Inactive
    }`}
  >
    {status === "Active" ? <UserCheck size={11} /> : <UserX size={11} />}
    {status}
  </span>
);

// ─── Avatar ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500",
  "bg-orange-500","bg-teal-500","bg-cyan-500","bg-sky-500",
];

const Avatar = ({ name, index }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div
      className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
      <Users size={18} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & filter state
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // { _id, name }
  const [deleting, setDeleting] = useState(false);

  // Documents modal state
  const [docTarget, setDocTarget] = useState(null); // full employee object

  // Toast notification
  const [toast, setToast] = useState(""); // non-empty string = visible
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // ── Fetch employees from backend ─────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (department) params.department = department;
      if (designation) params.designation = designation;

      const result = await fetchEmployees(params);
      setEmployees(result.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load employees. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  }, [search, department, designation]);

  // Debounced auto-fetch on filter change
  useEffect(() => {
    const timer = setTimeout(loadEmployees, 350);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const onLeaveCount = employees.filter((e) => e.status === "On Leave").length;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddSuccess = (newEmployee) => {
    setShowAddModal(false);
    setEmployees((prev) => [newEmployee, ...prev]);
  };

  // Sync employee list after a document upload or delete
  const handleDocUpdate = (updatedEmployee, action = "updated") => {
    setEmployees((prev) =>
      prev.map((e) => (e._id === updatedEmployee._id ? updatedEmployee : e))
    );
    setDocTarget(updatedEmployee);
    if (action === "upload") showToast("Document uploaded successfully.");
    if (action === "delete") showToast("Document deleted.");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget._id);
      setEmployees((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete employee.");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDepartment("");
    setDesignation("");
  };

  const hasActiveFilters = search || department || designation;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Toast notification ─────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
          <button onClick={() => setToast("")} className="ml-2 text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your workforce — {employees.length} record{employees.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadEmployees}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard label="Total Employees" value={employees.length} color="bg-indigo-500" />
        <StatCard label="Active" value={activeCount} color="bg-emerald-500" />
        <StatCard label="On Leave" value={onLeaveCount} color="bg-amber-500" />
      </div>

      {/* ── Search + Filters bar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition ${
              showFilters || department || designation
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Filter size={15} />
            Filters
            {(department || designation) && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                {(department ? 1 : 0) + (designation ? 1 : 0)}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Expandable filter dropdowns */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition"
              >
                <option value="">All Departments</option>
                {["Engineering","HR","Finance","Marketing","Sales","Operations","IT","Design","Legal","Support"].map(
                  (d) => <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div className="relative">
              <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition"
              >
                <option value="">All Designations</option>
                {["Software Engineer","Senior Engineer","Tech Lead","Manager","Senior Manager","Director","VP","HR Executive","Analyst","Designer","Intern"].map(
                  (d) => <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Employees Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Employee ID</span>
          <span>Name</span>
          <span>Email</span>
          <span>Department</span>
          <span>Status</span>
          <span className="text-center">Actions</span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
            <span className="text-sm">Loading employees…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && employees.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <Users size={28} className="text-indigo-400" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">
              {hasActiveFilters ? "No employees match your filters" : "No employees yet"}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {hasActiveFilters
                ? "Try adjusting the search or filter criteria."
                : "Get started by adding your first employee."}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 font-medium hover:underline"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={14} /> Add Employee
              </button>
            )}
          </div>
        )}

        {/* Employee rows */}
        {!loading && employees.length > 0 && (
          <div className="divide-y divide-gray-50">
            {employees.map((emp, idx) => (
              <div
                key={emp._id}
                className="grid grid-cols-[1fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-indigo-50/30 transition group"
              >
                {/* Employee ID */}
                <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                  {emp.employeeId}
                </span>

                {/* Name with avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} index={idx} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{emp.designation || "—"}</p>
                  </div>
                </div>

                {/* Email */}
                <span className="text-sm text-gray-600 truncate">{emp.email}</span>

                {/* Department */}
                <span className="text-sm text-gray-700 truncate">{emp.department || "—"}</span>

                {/* Status */}
                <StatusBadge status={emp.status} />

                {/* Actions — always visible so users can discover them */}
                <div className="flex items-center gap-1">
                  {/* Upload Document */}
                  <button
                    onClick={() => setDocTarget(emp)}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition text-xs font-semibold border border-indigo-100"
                    title="Upload / manage documents"
                  >
                    <Paperclip size={13} />
                    <span className="hidden sm:inline">Docs</span>
                    {emp.documents?.length > 0 && (
                      <span className="w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {emp.documents.length}
                      </span>
                    )}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() =>
                      setDeleteTarget({
                        _id: emp._id,
                        name: `${emp.firstName} ${emp.lastName}`,
                      })
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                    title="Delete employee"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table footer */}
        {!loading && employees.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
            Showing {employees.length} employee{employees.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " (filtered)" : ""}
          </div>
        )}
      </div>

      {/* ── Add Employee Modal ─────────────────────────────────────────────── */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* ── Document Modal ────────────────────────────────────────────────── */}
      <DocumentModal
        isOpen={!!docTarget}
        onClose={() => setDocTarget(null)}
        employee={docTarget}
        onUpdate={handleDocUpdate}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
              Delete Employee
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-800">{deleteTarget.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;