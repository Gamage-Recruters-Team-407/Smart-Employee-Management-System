import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, Filter, Plus, Trash2, RefreshCw,
  ChevronDown, Building2, Briefcase, AlertCircle,
  Loader2, X, Download, CheckSquare,
} from "lucide-react";
import {
  fetchEmployees,
  deleteEmployee,
  bulkDeleteEmployees,
} from "../services/employeeService";
import AddEmployeeModal from "../components/AddEmployeeModal";
import DocumentModal from "../components/DocumentModal";
import EmployeeTable from "../components/EmployeeTable";

const PAGE_SIZE = 10;

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  </div>
);

// ─── CSV Export ───────────────────────────────────────────────────────────────
const exportToCSV = (employees) => {
  const headers = [
    "Employee ID", "First Name", "Last Name", "Email", "Phone",
    "Department", "Designation", "Salary", "Joining Date", "Status", "Address",
  ];
  const rows = employees.map((e) => [
    e.employeeId, e.firstName, e.lastName, e.email, e.phone || "",
    e.department || "", e.designation || "", e.salary ?? "",
    e.joiningDate ? new Date(e.joiningDate).toLocaleDateString("en-US") : "",
    e.status, e.address || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Employees = () => {
  const navigate = useNavigate();
  const [employees,    setEmployees]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  // Search & filter
  const [search,       setSearch]       = useState("");
  const [department,   setDepartment]   = useState("");
  const [designation,  setDesignation]  = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters,  setShowFilters]  = useState(false);

  // Sorting
  const [sortField,    setSortField]    = useState("createdAt");
  const [sortDir,      setSortDir]      = useState("desc");

  // Pagination
  const [page,         setPage]         = useState(1);

  // Bulk selection
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [docTarget,    setDocTarget]    = useState(null);

  // Toast
  const [toast, setToast] = useState("");
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (search.trim())      params.search      = search.trim();
      if (department)         params.department   = department;
      if (designation)        params.designation  = designation;
      if (statusFilter)       params.status       = statusFilter;
      const result = await fetchEmployees(params);
      setEmployees(result.data || []);
      setPage(1);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [search, department, designation, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(loadEmployees, 350);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  // ── Sort + Paginate (client-side) ──────────────────────────────────────────
  const sortedEmployees = useMemo(() => {
    const arr = [...employees];
    arr.sort((a, b) => {
      let va = a[sortField] ?? "";
      let vb = b[sortField] ?? "";
      if (sortField === "joiningDate" || sortField === "createdAt") {
        va = new Date(va).getTime() || 0;
        vb = new Date(vb).getTime() || 0;
      } else if (sortField === "salary") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [employees, sortField, sortDir]);

  const totalPages   = Math.max(1, Math.ceil(sortedEmployees.length / PAGE_SIZE));
  const pagedEmployees = sortedEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  // ── Bulk selection helpers ─────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (pagedEmployees.every((e) => selectedIds.has(e._id))) {
      // deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedEmployees.forEach((e) => next.delete(e._id));
        return next;
      });
    } else {
      // select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedEmployees.forEach((e) => next.add(e._id));
        return next;
      });
    }
  };

  // ── Single delete ──────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget._id);
      setDeleteTarget(null);
      await loadEmployees();
      showToast("Employee deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete employee.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = [...selectedIds];
      await bulkDeleteEmployees(ids);
      setShowBulkConfirm(false);
      setSelectedIds(new Set());
      await loadEmployees();
      showToast(`${ids.length} employee${ids.length !== 1 ? "s" : ""} deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bulk delete employees.");
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleEmployeeSaved = async () => {
    const wasEditing = Boolean(editTarget);
    setShowAddModal(false);
    setEditTarget(null);
    await loadEmployees();
    showToast(wasEditing ? "Employee updated successfully." : "Employee created successfully.");
  };

  const openAddModal  = () => { setEditTarget(null); setShowAddModal(true); };
  const openEditModal = (emp) => { setEditTarget(emp); setShowAddModal(true); };

  const handleDocUpdate = (updatedEmployee, action = "updated") => {
    setEmployees((prev) =>
      prev.map((e) => (e._id === updatedEmployee._id ? updatedEmployee : e))
    );
    setDocTarget(updatedEmployee);
    if (action === "upload") showToast("Document uploaded successfully.");
    if (action === "delete") showToast("Document deleted.");
  };

  const clearFilters = () => {
    setSearch(""); setDepartment(""); setDesignation(""); setStatusFilter("");
  };

  const hasActiveFilters = search || department || designation || statusFilter;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount     = employees.filter((e) => e.status === "Active").length;
  const onLeaveCount    = employees.filter((e) => e.status === "On Leave").length;
  const inactiveCount   = employees.filter((e) => e.status === "Inactive").length;
  const terminatedCount = employees.filter((e) => e.status === "Terminated").length;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
          <button onClick={() => setToast("")} className="ml-2 text-gray-400 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your workforce — {employees.length} record{employees.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(sortedEmployees)}
            disabled={employees.length === 0}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Export to CSV"
          >
            <Download size={15} />
            Export CSV
          </button>
          <button
            onClick={loadEmployees}
            className="p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total"      value={employees.length} color="bg-indigo-500"  icon={Users} />
        <StatCard label="Active"     value={activeCount}      color="bg-emerald-500" icon={Users} />
        <StatCard label="On Leave"   value={onLeaveCount}     color="bg-amber-500"   icon={Users} />
        <StatCard label="Inactive"   value={inactiveCount}    color="bg-gray-400"    icon={Users} />
        <StatCard label="Terminated" value={terminatedCount}  color="bg-red-500"     icon={Users} />
      </div>

      {/* ── Bulk Actions Bar ────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 px-5 py-3 bg-indigo-600 text-white rounded-xl shadow-md">
          <CheckSquare size={18} />
          <span className="text-sm font-semibold">
            {selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-xs font-medium text-indigo-200 hover:text-white border border-indigo-400 rounded-lg transition"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
            >
              <Trash2 size={13} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Search + Filters ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex gap-3">
          {/* Search */}
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
              showFilters || department || designation || statusFilter
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Filter size={15} />
            Filters
            {(department || designation || statusFilter) && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                {(department ? 1 : 0) + (designation ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100">
            {/* Department */}
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

            {/* Designation */}
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

            {/* Status */}
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition"
              >
                <option value="">All Statuses</option>
                {["Active","Inactive","On Leave","Terminated"].map(
                  (s) => <option key={s} value={s}>{s}</option>
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* ── Employee Table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
            <span className="text-sm">Loading employees…</span>
          </div>
        )}

        {/* Empty */}
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
              <button onClick={clearFilters} className="text-sm text-indigo-600 font-medium hover:underline">
                Clear filters
              </button>
            ) : (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus size={14} /> Add Employee
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && employees.length > 0 && (
          <EmployeeTable
            employees={pagedEmployees}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onEdit={openEditModal}
            onDelete={(emp) => setDeleteTarget(emp)}
            onDocuments={(emp) => setDocTarget(emp)}
            onViewProfile={(emp) => navigate(`/employees/${emp._id}`)}
          />
        )}

        {/* Pagination footer */}
        {!loading && employees.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Showing {Math.min((page - 1) * PAGE_SIZE + 1, sortedEmployees.length)}–
              {Math.min(page * PAGE_SIZE, sortedEmployees.length)} of {sortedEmployees.length} employee
              {sortedEmployees.length !== 1 ? "s" : ""}
              {hasActiveFilters ? " (filtered)" : ""}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && arr[idx - 1] !== p - 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "…" ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-xs">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-8 h-8 text-xs font-semibold rounded-lg transition ${
                        item === page
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      <AddEmployeeModal
        key={editTarget?._id || "new-employee"}
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditTarget(null); }}
        onSuccess={handleEmployeeSaved}
        employee={editTarget}
      />

      {/* ── Document Modal ──────────────────────────────────────────────────── */}
      <DocumentModal
        isOpen={!!docTarget}
        onClose={() => setDocTarget(null)}
        employee={docTarget}
        onUpdate={handleDocUpdate}
      />

      {/* ── Single Delete Confirmation ──────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Employee</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-800">
                {deleteTarget.firstName} {deleteTarget.lastName}
              </span>? This action cannot be undone.
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
                {deleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation ────────────────────────────────────────── */}
      {showBulkConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Bulk Delete</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Permanently delete{" "}
              <span className="font-semibold text-gray-800">{selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkConfirm(false)}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
              >
                {bulkDeleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : `Delete ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
