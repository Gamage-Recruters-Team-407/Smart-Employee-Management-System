// <<<<<<< HEAD
// =======
// // <<<<<<< HEAD
// // import { useState, useEffect, useCallback, useMemo } from "react";
// // import { useNavigate, useSearchParams } from "react-router-dom";
// // import {
// //   Plus, Search, Download, Upload, RefreshCw, Loader2, Trash2,
// //   Users, AlertCircle, ChevronLeft, ChevronRight, BarChart3,
// //   LayoutGrid, LayoutList, X,
// // } from "lucide-react";

// // // ── Services ──────────────────────────────────────────────────────────────────
// // import {
// //   fetchEmployees,
// //   fetchEmployeeStats,
// //   fetchEmployeeStatsDetailed,
// //   deleteEmployee,
// //   bulkDeleteEmployees,
// //   updateEmployee,
// // } from "../services/employeeService";

// // // ── Components ────────────────────────────────────────────────────────────────
// // import EmployeeTable from "../components/EmployeeTable";
// // import EmployeeGrid from "../components/EmployeeGrid";
// // import AddEmployeeModal from "../components/AddEmployeeModal";
// // import DocumentModal from "../components/DocumentModal";
// // import AdvancedFilters, { EMPTY_FILTERS } from "../components/AdvancedFilters";
// // import AnalyticsPanel from "../components/AnalyticsPanel";
// // import CSVImportModal from "../components/CSVImportModal";

// // // ─── Constants ────────────────────────────────────────────────────────────────
// // const PAGE_SIZE = 10;

// // // ─── Stat Card ────────────────────────────────────────────────────────────────
// // const StatCard = ({ label, value, color, icon: Icon }) => (
// //   <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition">
// //     <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
// //       <Icon size={18} className="text-white" />
// //     </div>
// //     <div>
// //       <p className="text-xs text-gray-500 font-medium">{label}</p>
// //       <p className="text-xl font-bold text-gray-900">{value}</p>
// //     </div>
// //   </div>
// // );

// // // ═════════════════════════════════════════════════════════════════════════════
// // // MAIN PAGE COMPONENT
// // // ═════════════════════════════════════════════════════════════════════════════

// // const Employees = () => {
// //   const navigate = useNavigate();
// //   // ── URL-based state (Phase 2) ──────────────────────────────────────────────
// //   const [searchParams, setSearchParams] = useSearchParams();

// //   // Read initial state from URL
// //   const urlSearch      = searchParams.get("search") || "";
// //   const urlDepartments = searchParams.get("departments") || "";
// //   const urlDesignations = searchParams.get("designations") || "";
// //   const urlStatus      = searchParams.get("status") || "";
// //   const urlSalaryMin   = searchParams.get("salaryMin") || "";
// //   const urlSalaryMax   = searchParams.get("salaryMax") || "";
// //   const urlJoiningFrom = searchParams.get("joiningFrom") || "";
// //   const urlJoiningTo   = searchParams.get("joiningTo") || "";
// //   const urlSortField   = searchParams.get("sortField") || "createdAt";
// //   const urlSortDir     = searchParams.get("sortDir") || "desc";
// //   const urlPage        = parseInt(searchParams.get("page"), 10) || 1;
// //   const urlView        = searchParams.get("view") || "table";

// //   // ── Local UI state ─────────────────────────────────────────────────────────
// //   const [employees,    setEmployees]    = useState([]);
// //   const [loading,      setLoading]      = useState(true);
// //   const [error,        setError]        = useState("");

// //   // Stats
// //   const [stats,        setStats]        = useState({ total: 0, active: 0, inactive: 0, onLeave: 0, terminated: 0 });

// //   // Analytics
// //   const [showAnalytics, setShowAnalytics] = useState(false);
// //   const [analyticsData, setAnalyticsData] = useState(null);
// //   const [analyticsLoading, setAnalyticsLoading] = useState(false);

// //   // Pagination from server
// //   const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, totalCount: 0, totalPages: 1 });

// //   // Bulk selection
// //   const [selectedIds,  setSelectedIds]  = useState(new Set());
// //   const [bulkDeleting, setBulkDeleting] = useState(false);
// //   const [showBulkConfirm, setShowBulkConfirm] = useState(false);

// //   // Modals
// //   const [showAddModal, setShowAddModal] = useState(false);
// //   const [editTarget,   setEditTarget]   = useState(null);
// //   const [deleteTarget, setDeleteTarget] = useState(null);
// //   const [deleting,     setDeleting]     = useState(false);
// //   const [docTarget,    setDocTarget]    = useState(null);
// //   const [showCSVImport, setShowCSVImport] = useState(false);

// //   // Search text (local, debounced)
// //   const [searchInput, setSearchInput] = useState(urlSearch);

// //   // Toast
// //   const [toast, setToast] = useState("");
// //   const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

// //   // Advanced filters (derived from URL)
// //   const advancedFilters = useMemo(() => ({
// //     departments: urlDepartments ? urlDepartments.split(",") : [],
// //     designations: urlDesignations ? urlDesignations.split(",") : [],
// //     salaryMin: urlSalaryMin,
// //     salaryMax: urlSalaryMax,
// //     joiningFrom: urlJoiningFrom,
// //     joiningTo: urlJoiningTo,
// //     status: urlStatus,
// //   }), [urlDepartments, urlDesignations, urlSalaryMin, urlSalaryMax, urlJoiningFrom, urlJoiningTo, urlStatus]);

// //   // ── URL updater helper ─────────────────────────────────────────────────────
// //   const updateParams = useCallback((updates) => {
// //     setSearchParams((prev) => {
// //       const next = new URLSearchParams(prev);
// //       Object.entries(updates).forEach(([k, v]) => {
// //         if (v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)) {
// //           next.delete(k);
// //         } else {
// //           next.set(k, Array.isArray(v) ? v.join(",") : String(v));
// //         }
// //       });
// //       // Reset to page 1 on filter/sort changes (unless page itself is being set)
// //       if (!("page" in updates)) next.set("page", "1");
// //       return next;
// //     }, { replace: true });
// //   }, [setSearchParams]);

// //   // ── Fetch employees (server-side pagination) ───────────────────────────────
// //   const loadEmployees = useCallback(async () => {
// //     setLoading(true);
// //     setError("");
// //     try {
// //       const params = {
// //         page: urlPage,
// //         limit: PAGE_SIZE,
// //         sortField: urlSortField,
// //         sortDir: urlSortDir,
// //       };
// //       if (urlSearch.trim()) params.search = urlSearch.trim();
// //       if (urlDepartments) params.department = urlDepartments;
// //       if (urlDesignations) params.designation = urlDesignations;
// //       if (urlStatus) params.status = urlStatus;
// //       if (urlSalaryMin) params.salaryMin = urlSalaryMin;
// //       if (urlSalaryMax) params.salaryMax = urlSalaryMax;
// //       if (urlJoiningFrom) params.joiningFrom = urlJoiningFrom;
// //       if (urlJoiningTo) params.joiningTo = urlJoiningTo;

// //       const result = await fetchEmployees(params);
// //       setEmployees(result.data || []);
// //       setPagination(result.pagination || { page: 1, limit: PAGE_SIZE, totalCount: 0, totalPages: 1 });
// //       setSelectedIds(new Set());
// //     } catch (err) {
// //       setError(err.response?.data?.message || "Failed to load employees. Is the backend running?");
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [urlSearch, urlDepartments, urlDesignations, urlStatus, urlSalaryMin, urlSalaryMax, urlJoiningFrom, urlJoiningTo, urlSortField, urlSortDir, urlPage]);

// //   // ── Fetch stats ────────────────────────────────────────────────────────────
// //   const loadStats = useCallback(async () => {
// //     try {
// //       const result = await fetchEmployeeStats();
// //       setStats(result.data || { total: 0, active: 0, inactive: 0, onLeave: 0, terminated: 0 });
// //     } catch {
// //       // Non-critical — stat cards just show 0
// //     }
// //   }, []);

// //   // ── Load on URL change ─────────────────────────────────────────────────────
// //   useEffect(() => {
// //     loadEmployees();
// //   }, [loadEmployees]);

// //   useEffect(() => {
// //     loadStats();
// //   }, [loadStats]);

// //   // ── Debounce search input → URL ────────────────────────────────────────────
// //   useEffect(() => {
// //     const timer = setTimeout(() => {
// //       if (searchInput !== urlSearch) {
// //         updateParams({ search: searchInput });
// //       }
// //     }, 400);
// //     return () => clearTimeout(timer);
// //   }, [searchInput]);

// //   // ── Load analytics data on demand ──────────────────────────────────────────
// //   useEffect(() => {
// //     if (showAnalytics && !analyticsData) {
// //       setAnalyticsLoading(true);
// //       fetchEmployeeStatsDetailed()
// //         .then((res) => setAnalyticsData(res.data))
// //         .catch(() => {})
// //         .finally(() => setAnalyticsLoading(false));
// //     }
// //   }, [showAnalytics, analyticsData]);

// //   // ── Selection ──────────────────────────────────────────────────────────────
// //   const handleToggleSelect = (id) => {
// //     setSelectedIds((prev) => {
// //       const next = new Set(prev);
// //       next.has(id) ? next.delete(id) : next.add(id);
// //       return next;
// //     });
// //   };

// //   const handleSelectAll = () => {
// //     if (employees.every((e) => selectedIds.has(e._id))) {
// //       setSelectedIds(new Set());
// //     } else {
// //       setSelectedIds(new Set(employees.map((e) => e._id)));
// //     }
// //   };

// //   // ── Sort ───────────────────────────────────────────────────────────────────
// //   const handleSort = (field) => {
// //     const newDir = urlSortField === field && urlSortDir === "asc" ? "desc" : "asc";
// //     updateParams({ sortField: field, sortDir: newDir });
// //   };

// //   // ── Single delete ──────────────────────────────────────────────────────────
// //   const handleDeleteConfirm = async () => {
// //     if (!deleteTarget) return;
// //     setDeleting(true);
// //     setError("");
// //     try {
// //       await deleteEmployee(deleteTarget._id);
// //       setDeleteTarget(null);
// //       await loadEmployees();
// //       loadStats();
// //       showToast("Employee deleted.");
// //     } catch (err) {
// //       setError(err.response?.data?.message || "Failed to delete employee.");
// //     } finally {
// //       setDeleting(false);
// //     }
// //   };

// //   // ── Bulk delete ────────────────────────────────────────────────────────────
// //   const handleBulkDelete = async () => {
// //     setBulkDeleting(true);
// //     setError("");
// //     try {
// //       const ids = [...selectedIds];
// //       await bulkDeleteEmployees(ids);
// //       setShowBulkConfirm(false);
// //       setSelectedIds(new Set());
// //       await loadEmployees();
// //       loadStats();
// //       showToast(`${ids.length} employee${ids.length !== 1 ? "s" : ""} deleted.`);
// //     } catch (err) {
// //       setError(err.response?.data?.message || "Failed to bulk delete employees.");
// //     } finally {
// //       setBulkDeleting(false);
// //     }
// //   };

// //   // ── Modal handlers ─────────────────────────────────────────────────────────
// //   const handleEmployeeSaved = async (savedEmployee) => {
// //     const wasEditing = Boolean(editTarget);
// //     setShowAddModal(false);
// //     setEditTarget(null);
// //     setError("");
// //     await loadEmployees();
// //     loadStats();
// //     setAnalyticsData(null); // refresh analytics on next open
// //     showToast(wasEditing ? "Employee updated successfully." : "Employee created successfully.");
// //   };

// //   // ── Inline edit (Phase 5) ──────────────────────────────────────────────────
// //   const handleInlineUpdate = async (empId, field, value) => {
// //     try {
// //       await updateEmployee(empId, { [field]: value });
// //       // Optimistic update
// //       setEmployees((prev) =>
// //         prev.map((e) => (e._id === empId ? { ...e, [field]: value } : e))
// //       );
// //       loadStats();
// //       setAnalyticsData(null);
// //       showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
// //     } catch (err) {
// //       setError(err.response?.data?.message || `Failed to update ${field}.`);
// //     }
// //   };

// //   // ── Document modal handlers ────────────────────────────────────────────────
// //   const handleDocUpdate = (updatedEmployee) => {
// //     setDocTarget(updatedEmployee);
// //     setEmployees((prev) =>
// //       prev.map((e) => (e._id === updatedEmployee._id ? updatedEmployee : e))
// //     );
// //   };

// //   // ── CSV export ─────────────────────────────────────────────────────────────
// //   const handleExportCSV = () => {
// //     const headers = ["Employee ID", "First Name", "Last Name", "Email", "Phone", "Department", "Designation", "Salary", "Joining Date", "Status"];
// //     const rows = employees.map((e) => [
// //       e.employeeId, e.firstName, e.lastName, e.email, e.phone || "",
// //       e.department || "", e.designation || "", e.salary || 0,
// //       e.joiningDate ? new Date(e.joiningDate).toISOString().slice(0, 10) : "",
// //       e.status,
// //     ]);
// //     const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
// //     const blob = new Blob([csv], { type: "text/csv" });
// //     const url = URL.createObjectURL(blob);
// //     const a = document.createElement("a");
// //     a.href = url;
// //     a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
// //     a.click();
// //     URL.revokeObjectURL(url);
// //   };

// //   // ── Advanced filter change handler ─────────────────────────────────────────
// //   const handleFilterChange = (newFilters) => {
// //     updateParams({
// //       departments: newFilters.departments,
// //       designations: newFilters.designations,
// //       salaryMin: newFilters.salaryMin,
// //       salaryMax: newFilters.salaryMax,
// //       joiningFrom: newFilters.joiningFrom,
// //       joiningTo: newFilters.joiningTo,
// //       status: newFilters.status,
// //     });
// //   };

// //   const handleFilterClear = () => {
// //     updateParams({
// //       departments: "", designations: "", salaryMin: "", salaryMax: "",
// //       joiningFrom: "", joiningTo: "", status: "", search: "",
// //     });
// //     setSearchInput("");
// //   };

// //   // ── View mode toggle ───────────────────────────────────────────────────────
// //   const viewMode = urlView === "grid" ? "grid" : "table";
// //   const toggleView = (mode) => updateParams({ view: mode });

// //   // ── Navigation ─────────────────────────────────────────────────────────────
// //   const handleViewProfile = (emp) => navigate(`/employees/${emp._id}`);

// //   // ── Pagination range display ───────────────────────────────────────────────
// //   const rangeStart = pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
// //   const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.totalCount);

// //   // ═════════════════════════════════════════════════════════════════════════════
// //   // RENDER
// //   // ═════════════════════════════════════════════════════════════════════════════

// //   return (
// //     <div className="flex flex-col gap-6">
// //       {/* ── Header ──────────────────────────────────────────────────────────── */}
// //       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
// //           <p className="text-sm text-gray-500 mt-0.5">
// //             Manage your team — {pagination.totalCount} employee{pagination.totalCount !== 1 ? "s" : ""} total
// //           </p>
// //         </div>
// //         <div className="flex items-center gap-2 flex-wrap">
// //           {/* Import CSV */}
// //           <button
// //             onClick={() => setShowCSVImport(true)}
// //             className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
// //           >
// //             <Upload size={15} /> Import
// //           </button>

// //           {/* Export CSV */}
// //           <button
// //             onClick={handleExportCSV}
// //             className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
// //           >
// //             <Download size={15} /> Export
// //           </button>

// //           {/* Analytics toggle */}
// //           <button
// //             onClick={() => setShowAnalytics(!showAnalytics)}
// //             className={`px-3 py-2 text-sm font-medium rounded-lg border transition flex items-center gap-1.5 ${
// //               showAnalytics
// //                 ? "bg-indigo-50 border-indigo-200 text-indigo-700"
// //                 : "text-gray-600 border-gray-200 hover:bg-gray-50"
// //             }`}
// //           >
// //             <BarChart3 size={15} /> Analytics
// //           </button>

// //           {/* Add Employee */}
// //           <button
// //             onClick={() => { setEditTarget(null); setShowAddModal(true); }}
// //             className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
// //           >
// //             <Plus size={16} /> Add Employee
// //           </button>
// //         </div>
// //       </div>

// //       {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
// //       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
// //         <StatCard label="Total"      value={stats.total}      color="bg-indigo-500"  icon={Users} />
// //         <StatCard label="Active"     value={stats.active}     color="bg-emerald-500" icon={Users} />
// //         <StatCard label="On Leave"   value={stats.onLeave}    color="bg-amber-500"   icon={Users} />
// //         <StatCard label="Inactive"   value={stats.inactive}   color="bg-gray-400"    icon={Users} />
// //         <StatCard label="Terminated" value={stats.terminated}  color="bg-red-500"     icon={Users} />
// //       </div>

// //       {/* ── Analytics Panel ─────────────────────────────────────────────────── */}
// //       <AnalyticsPanel isOpen={showAnalytics} data={analyticsData} loading={analyticsLoading} />

// //       {/* ── Search + View Toggle ────────────────────────────────────────────── */}
// //       <div className="flex items-center gap-3">
// //         {/* Search */}
// //         <div className="relative flex-1 max-w-md">
// //           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
// //           <input
// //             type="text"
// //             placeholder="Search by name, email, or employee ID…"
// //             value={searchInput}
// //             onChange={(e) => setSearchInput(e.target.value)}
// //             className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition"
// //           />
// //           {searchInput && (
// //             <button
// //               onClick={() => { setSearchInput(""); updateParams({ search: "" }); }}
// //               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
// //             >
// //               <X size={14} />
// //             </button>
// //           )}
// //         </div>

// //         {/* View toggle */}
// //         <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
// //           <button
// //             onClick={() => toggleView("table")}
// //             className={`p-2.5 transition ${viewMode === "table" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
// //             title="Table view"
// //           >
// //             <LayoutList size={16} />
// //           </button>
// //           <button
// //             onClick={() => toggleView("grid")}
// //             className={`p-2.5 transition ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
// //             title="Grid view"
// //           >
// //             <LayoutGrid size={16} />
// //           </button>
// //         </div>

// //         {/* Refresh */}
// //         <button
// //           onClick={() => { loadEmployees(); loadStats(); setAnalyticsData(null); }}
// //           disabled={loading}
// //           className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
// //           title="Refresh"
// //         >
// //           <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
// //         </button>
// //       </div>

// //       {/* ── Advanced Filters ────────────────────────────────────────────────── */}
// //       <AdvancedFilters
// //         filters={advancedFilters}
// //         onChange={handleFilterChange}
// //         onClear={handleFilterClear}
// //       />

// //       {/* ── Bulk Actions Bar ────────────────────────────────────────────────── */}
// //       {selectedIds.size > 0 && (
// //         <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
// //           <span className="text-sm font-semibold text-indigo-700">
// //             {selectedIds.size} selected
// //           </span>
// //           <button
// //             onClick={() => setShowBulkConfirm(true)}
// //             className="ml-auto px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition flex items-center gap-1"
// //           >
// //             <Trash2 size={13} /> Delete Selected
// //           </button>
// //         </div>
// //       )}

// //       {/* ── Error Banner ────────────────────────────────────────────────────── */}
// //       {error && (
// //         <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
// //           <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
// //           <span className="flex-1">{error}</span>
// //           <button onClick={() => setError("")} className="flex-shrink-0 hover:text-red-900">
// //             <X size={14} />
// //           </button>
// //         </div>
// //       )}

// //       {/* ── Employee Table / Grid ───────────────────────────────────────────── */}
// //       {loading ? (
// //         <div className="flex flex-col items-center justify-center py-16">
// //           <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
// //           <p className="text-sm text-gray-500">Loading employees…</p>
// //         </div>
// //       ) : viewMode === "table" ? (
// //         <EmployeeTable
// //           employees={employees}
// //           sortField={urlSortField}
// //           sortDir={urlSortDir}
// //           onSort={handleSort}
// //           selectedIds={selectedIds}
// //           onToggleSelect={handleToggleSelect}
// //           onSelectAll={handleSelectAll}
// //           onEdit={(emp) => { setEditTarget(emp); setShowAddModal(true); }}
// //           onDelete={setDeleteTarget}
// //           onDocuments={setDocTarget}
// //           onViewProfile={handleViewProfile}
// //           onInlineUpdate={handleInlineUpdate}
// //         />
// //       ) : (
// //         <EmployeeGrid
// //           employees={employees}
// //           selectedIds={selectedIds}
// //           onToggleSelect={handleToggleSelect}
// //           onSelectAll={handleSelectAll}
// //           onEdit={(emp) => { setEditTarget(emp); setShowAddModal(true); }}
// //           onDelete={setDeleteTarget}
// //           onDocuments={setDocTarget}
// //           onViewProfile={handleViewProfile}
// //         />
// //       )}

// //       {/* ── Pagination ──────────────────────────────────────────────────────── */}
// //       {pagination.totalPages > 0 && (
// //         <div className="flex items-center justify-between px-1">
// //           <p className="text-sm text-gray-500">
// //             Showing <span className="font-semibold">{rangeStart}–{rangeEnd}</span> of{" "}
// //             <span className="font-semibold">{pagination.totalCount}</span>
// //           </p>
// //           <div className="flex items-center gap-1">
// //             <button
// //               onClick={() => updateParams({ page: urlPage - 1 })}
// //               disabled={urlPage <= 1}
// //               className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
// //             >
// //               <ChevronLeft size={16} />
// //             </button>
// //             {/* Page numbers */}
// //             {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
// //               let pageNum;
// //               if (pagination.totalPages <= 7) {
// //                 pageNum = i + 1;
// //               } else if (urlPage <= 4) {
// //                 pageNum = i + 1;
// //               } else if (urlPage >= pagination.totalPages - 3) {
// //                 pageNum = pagination.totalPages - 6 + i;
// //               } else {
// //                 pageNum = urlPage - 3 + i;
// //               }
// //               return (
// //                 <button
// //                   key={pageNum}
// //                   onClick={() => updateParams({ page: pageNum })}
// //                   className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
// //                     pageNum === urlPage
// //                       ? "bg-indigo-600 text-white shadow-sm"
// //                       : "text-gray-600 hover:bg-gray-100"
// //                   }`}
// //                 >
// //                   {pageNum}
// //                 </button>
// //               );
// //             })}
// //             <button
// //               onClick={() => updateParams({ page: urlPage + 1 })}
// //               disabled={urlPage >= pagination.totalPages}
// //               className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
// //             >
// //               <ChevronRight size={16} />
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       {/* ── Add/Edit Modal ──────────────────────────────────────────────────── */}
// //       <AddEmployeeModal
// //         isOpen={showAddModal || Boolean(editTarget)}
// //         onClose={() => { setShowAddModal(false); setEditTarget(null); }}
// //         onSuccess={handleEmployeeSaved}
// //         employee={editTarget}
// //       />

// //       {/* ── Document Modal ──────────────────────────────────────────────────── */}
// //       {docTarget && (
// //         <DocumentModal
// //           isOpen={Boolean(docTarget)}
// //           onClose={() => setDocTarget(null)}
// //           employee={docTarget}
// //           onUpdate={handleDocUpdate}
// //         />
// //       )}

// //       {/* ── CSV Import Modal ────────────────────────────────────────────────── */}
// //       <CSVImportModal
// //         isOpen={showCSVImport}
// //         onClose={() => setShowCSVImport(false)}
// //         onSuccess={() => { loadEmployees(); loadStats(); setAnalyticsData(null); showToast("CSV import complete!"); }}
// //       />

// //       {/* ── Single Delete Confirmation ──────────────────────────────────────── */}
// //       {deleteTarget && (
// //         <div
// //           className="fixed inset-0 z-50 flex items-center justify-center p-4"
// //           style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
// //           onClick={(e) => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}
// //         >
// //           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
// //             <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
// //               <Trash2 size={22} className="text-red-600" />
// //             </div>
// //             <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Employee</h3>
// //             <p className="text-sm text-gray-500 text-center mb-6">
// //               Are you sure you want to permanently delete{" "}
// //               <span className="font-semibold text-gray-800">
// //                 {deleteTarget.firstName} {deleteTarget.lastName}
// //               </span>? This action cannot be undone.
// //             </p>
// //             <div className="flex gap-3">
// //               <button
// //                 onClick={() => setDeleteTarget(null)}
// //                 disabled={deleting}
// //                 className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleDeleteConfirm}
// //                 disabled={deleting}
// //                 className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
// //               >
// //                 {deleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : "Yes, Delete"}
// //               </button>
// // =======
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
// // import React, { useState, useEffect, useCallback } from "react";
// // import { Link } from "react-router-dom";
// // import API from "../services/api";

// // const Employees = () => {
// //   const [employees, setEmployees] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [submitting, setSubmitting] = useState(false);
// //   const [formData, setFormData] = useState({
// //     employeeId: "",
// //     firstName: "",
// //     lastName: "",
// //     email: "",
// //     phone: "",
// //     department: "",
// //     designation: "",
// //     status: "Active",
// //   });

// //   const fetchEmployees = useCallback(async () => {
// <<<<<<< HEAD
// //   let isMounted = true;
  
// //   try {
// //     const response = await API.get("/employees");
    
// //     if (isMounted) {
// //       // 💡 සාමාන්‍යයෙන් Axios/API wrapper වල දත්ත තියෙන්නේ response.data ඇතුළේයි.
// //       // ඒ නිසා response.data එක හෝ response එක array එකක්ද කියා පරීක්ෂා කර state එකට දමන්න.
// //       const employeeList = response.data ? response.data : response;
// //       setEmployees(employeeList);
// //     }
// //   } catch (err) {
// //     console.error("Failed to load employees:", err);
// //   } finally {
// //     if (isMounted) {
// //       setLoading(false);
// //     }
// //   }

// //   return () => {
// //     isMounted = false;
// //   };
// // }, []);

// // useEffect(() => {
// //   fetchEmployees();
// // }, [fetchEmployees]); // 👈 useCallback එකක් තියෙන නිසා දැන් මෙතනට fetchEmployees දාන්න පුළුවන්, කිසිම අවුලක් වෙන්නේ නැහැ.

// //   // const fetchEmployees = useCallback(async () => {
// //   //   try {
// //   //     const data = await API.get("/employees");
// //   //     setEmployees(data);
// //   //   } catch (err) {
// //   //     console.error("Failed to load employees:", err);
// //   //   } finally {
// //   //     setLoading(false);
// //   //   }
// //   // }, []);

// //   // useEffect(() => {
// //   //   fetchEmployees();
// //   // }, []);
// =======
// //     try {
// //       const data = await API.get("/employees");
// //       setEmployees(data);
// //     } catch (err) {
// //       console.error("Failed to load employees:", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     fetchEmployees();
// //   }, [fetchEmployees]);
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5

// //   const handleChange = (e) => {
// //     const { name, value } = e.target;
// //     setFormData((prev) => ({ ...prev, [name]: value }));
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setSubmitting(true);
// //     try {
// //       const created = await API.post("/employees", formData);
// //       setEmployees((prev) => [...prev, created].sort((a, b) =>
// //         `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
// //       ));
// //       setFormData({
// //         employeeId: "",
// //         firstName: "",
// //         lastName: "",
// //         email: "",
// //         phone: "",
// //         department: "",
// //         designation: "",
// //         status: "Active",
// //       });
// //       setIsModalOpen(false);
// //     } catch (err) {
// //       alert(err.message || "Failed to add employee");
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   const closeModal = () => {
// //     setIsModalOpen(false);
// //     setFormData({
// //       employeeId: "",
// //       firstName: "",
// //       lastName: "",
// //       email: "",
// //       phone: "",
// //       department: "",
// //       designation: "",
// //       status: "Active",
// //     });
// //   };

// //   return (
// //     <div className="p-8">
// //       <div className="flex justify-between items-center mb-8">
// //         <h1 className="text-3xl font-bold">Employees</h1>
// //         <button
// //           onClick={() => setIsModalOpen(true)}
// //           className="bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700"
// //         >
// //           + Add Employee
// //         </button>
// //       </div>

// //       <div className="bg-white rounded-2xl shadow overflow-hidden">
// //         {loading ? (
// //           <p className="p-8 text-center text-gray-500">Loading employees...</p>
// //         ) : employees.length === 0 ? (
// //           <p className="p-8 text-center text-gray-500">
// //             No employees yet. Click &quot;+ Add Employee&quot; to add one.
// //           </p>
// //         ) : (
// //           <table className="w-full">
// //             <thead className="bg-gray-50">
// //               <tr>
// //                 <th className="px-6 py-4 text-left">Employee ID</th>
// //                 <th className="px-6 py-4 text-left">Name</th>
// //                 <th className="px-6 py-4 text-left">Department</th>
// //                 <th className="px-6 py-4 text-left">Position</th>
// //                 <th className="px-6 py-4 text-left">Status</th>
// //                 <th className="px-6 py-4 text-center">Tasks</th>
// //                 <th className="px-6 py-4 text-center">Actions</th>
// //               </tr>
// //             </thead>
// //             <tbody>
// //               {employees.map((emp) => (
// //                 <tr key={emp._id} className="border-t hover:bg-gray-50">
// //                   <td className="px-6 py-4">{emp.employeeId}</td>
// //                   <td className="px-6 py-4 font-medium">
// //                     {emp.firstName} {emp.lastName}
// //                   </td>
// //                   <td className="px-6 py-4">{emp.department || "—"}</td>
// //                   <td className="px-6 py-4">{emp.designation || "—"}</td>
// //                   <td className="px-6 py-4">
// //                     <span
// //                       className={`px-3 py-1 rounded-full text-sm ${
// //                         emp.status === "Active"
// //                           ? "bg-green-100 text-green-700"
// //                           : "bg-red-100 text-red-700"
// //                       }`}
// //                     >
// //                       {emp.status || "Active"}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 text-center">
// //                     <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
// //                       {emp.taskCount ?? 0}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 text-center">
// //                     <Link
// //                       to={`/employees/${emp._id}`}
// //                       className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
// //                     >
// //                       View Account
// //                     </Link>
// //                   </td>
// //                 </tr>
// //               ))}
// //             </tbody>
// //           </table>
// //         )}
// //       </div>

// //       {isModalOpen && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
// //           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
// //             <div className="p-8">
// //               <div className="flex justify-between items-center mb-6">
// //                 <h2 className="text-2xl font-semibold">Add Employee</h2>
// //                 <button
// //                   onClick={closeModal}
// //                   className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
// //                 >
// //                   ×
// //                 </button>
// //               </div>

// //               <form onSubmit={handleSubmit} className="space-y-4">
// //                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Employee ID
// //                     </label>
// //                     <input
// //                       name="employeeId"
// //                       value={formData.employeeId}
// //                       onChange={handleChange}
// //                       placeholder="Auto-generated if empty"
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Status
// //                     </label>
// //                     <select
// //                       name="status"
// //                       value={formData.status}
// //                       onChange={handleChange}
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     >
// //                       <option value="Active">Active</option>
// //                       <option value="Inactive">Inactive</option>
// //                     </select>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       First Name *
// //                     </label>
// //                     <input
// //                       name="firstName"
// //                       value={formData.firstName}
// //                       onChange={handleChange}
// //                       required
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Last Name *
// //                     </label>
// //                     <input
// //                       name="lastName"
// //                       value={formData.lastName}
// //                       onChange={handleChange}
// //                       required
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Email *
// //                     </label>
// //                     <input
// //                       type="email"
// //                       name="email"
// //                       value={formData.email}
// //                       onChange={handleChange}
// //                       required
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Phone
// //                     </label>
// //                     <input
// //                       name="phone"
// //                       value={formData.phone}
// //                       onChange={handleChange}
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Department
// //                     </label>
// //                     <input
// //                       name="department"
// //                       value={formData.department}
// //                       onChange={handleChange}
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700 mb-1">
// //                       Position
// //                     </label>
// //                     <input
// //                       name="designation"
// //                       value={formData.designation}
// //                       onChange={handleChange}
// //                       className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
// //                     />
// //                   </div>
// //                 </div>

// //                 <div className="flex gap-3 pt-4">
// //                   <button
// //                     type="button"
// //                     onClick={closeModal}
// //                     className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
// //                   >
// //                     Cancel
// //                   </button>
// //                   <button
// //                     type="submit"
// //                     disabled={submitting}
// //                     className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
// //                   >
// //                     {submitting ? "Saving..." : "Add Employee"}
// //                   </button>
// //                 </div>
// //               </form>
// <<<<<<< HEAD
// =======
// // >>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
// //             </div>
// //           </div>
// //         </div>
// //       )}
// <<<<<<< HEAD
// =======
// // <<<<<<< HEAD

// //       {/* ── Bulk Delete Confirmation ────────────────────────────────────────── */}
// //       {showBulkConfirm && (
// //         <div
// //           className="fixed inset-0 z-50 flex items-center justify-center p-4"
// //           style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
// //           onClick={(e) => e.target === e.currentTarget && !bulkDeleting && setShowBulkConfirm(false)}
// //         >
// //           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
// //             <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
// //               <Trash2 size={22} className="text-red-600" />
// //             </div>
// //             <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Bulk Delete</h3>
// //             <p className="text-sm text-gray-500 text-center mb-6">
// //               Delete <span className="font-semibold text-gray-800">{selectedIds.size}</span> selected
// //               employee{selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
// //             </p>
// //             <div className="flex gap-3">
// //               <button
// //                 onClick={() => setShowBulkConfirm(false)}
// //                 disabled={bulkDeleting}
// //                 className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleBulkDelete}
// //                 disabled={bulkDeleting}
// //                 className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
// //               >
// //                 {bulkDeleting ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : `Delete ${selectedIds.size}`}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* ── Toast ───────────────────────────────────────────────────────────── */}
// //       {toast && (
// //         <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in">
// //           <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
// //             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
// //           </svg>
// //           {toast}
// //           <button onClick={() => setToast("")} className="ml-2 text-gray-400 hover:text-white">
// //             <X size={14} />
// //           </button>
// //         </div>
// //       )}
// // =======
// // >>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
// //     </div>
// //   );
// // };

// // export default Employees;


// <<<<<<< HEAD
// import  { useState, useEffect, useCallback } from "react";
// import { Link } from "react-router-dom";
// import API from "../services/api";
// =======
// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import {
//   Plus,
//   Search,
//   Download,
//   Upload,
//   RefreshCw,
//   Loader2,
//   Trash2,
//   Users,
//   AlertCircle,
//   ChevronLeft,
//   ChevronRight,
//   BarChart3,
//   LayoutGrid,
//   LayoutList,
//   X,
// } from "lucide-react";

// import {
//   fetchEmployees,
//   fetchEmployeeStats,
//   fetchEmployeeStatsDetailed,
//   deleteEmployee,
//   bulkDeleteEmployees,
//   updateEmployee,
// } from "../services/employeeService";

// import EmployeeTable from "../components/EmployeeTable";
// import EmployeeGrid from "../components/EmployeeGrid";
// import AddEmployeeModal from "../components/AddEmployeeModal";
// import DocumentModal from "../components/DocumentModal";
// import AdvancedFilters from "../components/AdvancedFilters";
// import AnalyticsPanel from "../components/AnalyticsPanel";
// import CSVImportModal from "../components/CSVImportModal";

// const PAGE_SIZE = 10;

// const StatCard = ({ label, value, color, icon: Icon }) => (
//   <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition">
//     <div
//       className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}
//     >
//       <Icon size={18} className="text-white" />
//     </div>
//     <div>
//       <p className="text-xs text-gray-500 font-medium">{label}</p>
//       <p className="text-xl font-bold text-gray-900">{value}</p>
//     </div>
//   </div>
// );
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5

// const Employees = () => {
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();

//   const urlSearch = searchParams.get("search") || "";
//   const urlDepartments = searchParams.get("departments") || "";
//   const urlDesignations = searchParams.get("designations") || "";
//   const urlStatus = searchParams.get("status") || "";
//   const urlSalaryMin = searchParams.get("salaryMin") || "";
//   const urlSalaryMax = searchParams.get("salaryMax") || "";
//   const urlJoiningFrom = searchParams.get("joiningFrom") || "";
//   const urlJoiningTo = searchParams.get("joiningTo") || "";
//   const urlSortField = searchParams.get("sortField") || "createdAt";
//   const urlSortDir = searchParams.get("sortDir") || "desc";
//   const urlPage = parseInt(searchParams.get("page"), 10) || 1;
//   const urlView = searchParams.get("view") || "table";

//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     inactive: 0,
//     onLeave: 0,
//     terminated: 0,
//   });

// <<<<<<< HEAD
//   // 💡 නිවැරදි කරන ලද useCallback එක (මෙහි ඇතුළත cleanup functions නොමැත)
//   const fetchEmployees = useCallback(async (onSuccess) => {
//     try {
//       const response = await API.get("/employees");
//       const employeeList = response.data ? response.data : response;
      
//       // Callback එකක් හරහා පමණක් දත්ත එකතු කරමු
//       if (onSuccess) {
//         onSuccess(employeeList);
//       }
// =======
//   const [showAnalytics, setShowAnalytics] = useState(false);
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [analyticsLoading, setAnalyticsLoading] = useState(false);

//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: PAGE_SIZE,
//     totalCount: 0,
//     totalPages: 1,
//   });

//   const [selectedIds, setSelectedIds] = useState(new Set());
//   const [bulkDeleting, setBulkDeleting] = useState(false);
//   const [showBulkConfirm, setShowBulkConfirm] = useState(false);

//   const [showAddModal, setShowAddModal] = useState(false);
//   const [editTarget, setEditTarget] = useState(null);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [deleting, setDeleting] = useState(false);
//   const [docTarget, setDocTarget] = useState(null);
//   const [showCSVImport, setShowCSVImport] = useState(false);

//   const [searchInput, setSearchInput] = useState(urlSearch);
//   const [toast, setToast] = useState("");

//   const showToast = (msg) => {
//     setToast(msg);
//     setTimeout(() => setToast(""), 3500);
//   };

//   const advancedFilters = useMemo(
//     () => ({
//       departments: urlDepartments ? urlDepartments.split(",") : [],
//       designations: urlDesignations ? urlDesignations.split(",") : [],
//       salaryMin: urlSalaryMin,
//       salaryMax: urlSalaryMax,
//       joiningFrom: urlJoiningFrom,
//       joiningTo: urlJoiningTo,
//       status: urlStatus,
//     }),
//     [
//       urlDepartments,
//       urlDesignations,
//       urlSalaryMin,
//       urlSalaryMax,
//       urlJoiningFrom,
//       urlJoiningTo,
//       urlStatus,
//     ]
//   );

//   const updateParams = useCallback(
//     (updates) => {
//       setSearchParams(
//         (prev) => {
//           const next = new URLSearchParams(prev);

//           Object.entries(updates).forEach(([key, value]) => {
//             if (
//               value === "" ||
//               value === null ||
//               value === undefined ||
//               (Array.isArray(value) && value.length === 0)
//             ) {
//               next.delete(key);
//             } else {
//               next.set(key, Array.isArray(value) ? value.join(",") : String(value));
//             }
//           });

//           if (!("page" in updates)) {
//             next.set("page", "1");
//           }

//           return next;
//         },
//         { replace: true }
//       );
//     },
//     [setSearchParams]
//   );

//   const loadEmployees = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const params = {
//         page: urlPage,
//         limit: PAGE_SIZE,
//         sortField: urlSortField,
//         sortDir: urlSortDir,
//       };

//       if (urlSearch.trim()) params.search = urlSearch.trim();
//       if (urlDepartments) params.department = urlDepartments;
//       if (urlDesignations) params.designation = urlDesignations;
//       if (urlStatus) params.status = urlStatus;
//       if (urlSalaryMin) params.salaryMin = urlSalaryMin;
//       if (urlSalaryMax) params.salaryMax = urlSalaryMax;
//       if (urlJoiningFrom) params.joiningFrom = urlJoiningFrom;
//       if (urlJoiningTo) params.joiningTo = urlJoiningTo;

//       const result = await fetchEmployees(params);

//       setEmployees(result.data || []);
//       setPagination(
//         result.pagination || {
//           page: 1,
//           limit: PAGE_SIZE,
//           totalCount: 0,
//           totalPages: 1,
//         }
//       );

//       setSelectedIds(new Set());
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Failed to load employees. Is the backend running?"
//       );
//     } finally {
//       if (onSuccess) {
//         onSuccess(null, false); // loading false කිරීම සඳහා
//       }
//     }
//   }, [
//     urlSearch,
//     urlDepartments,
//     urlDesignations,
//     urlStatus,
//     urlSalaryMin,
//     urlSalaryMax,
//     urlJoiningFrom,
//     urlJoiningTo,
//     urlSortField,
//     urlSortDir,
//     urlPage,
//   ]);

//   const loadStats = useCallback(async () => {
//     try {
//       const result = await fetchEmployeeStats();

//       setStats(
//         result.data || {
//           total: 0,
//           active: 0,
//           inactive: 0,
//           onLeave: 0,
//           terminated: 0,
//         }
//       );
//     } catch {
//       // Non-critical
//     }
//   }, []);

//   // 💡 නිවැරදි කරන ලද useEffect එක (Cleanup එක අයිති විය යුත්තේ මෙතනටයි)
//   useEffect(() => {
// <<<<<<< HEAD
//     let isMounted = true;

//     // Loading එක මුලින්ම true කරමු
    

//     fetchEmployees((data, isData = true) => {
//       if (!isMounted) return;
      
//       if (isData && data) {
//         setEmployees(data);
//       } else {
//         setLoading(false);
//       }
//     });

//     // ✅ නියම Cleanup function එක තියෙන්න ඕනේ මෙන්න මෙතනයි!
//     return () => {
//       isMounted = false;
//     };
//   }, [fetchEmployees]);
// =======
//     loadEmployees();
//   }, [loadEmployees]);
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5

//   useEffect(() => {
//     loadStats();
//   }, [loadStats]);

// <<<<<<< HEAD
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       const response = await API.post("/employees", formData);
//       // Backend එකෙන් එන created object එක නිවැරදිව ගනිමු
//       const created = response.data ? response.data : response;

//       setEmployees((prev) => [...prev, created].sort((a, b) =>
//         `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
//       ));
      
//       setFormData({
//         employeeId: "",
//         firstName: "",
//         lastName: "",
//         email: "",
//         phone: "",
//         department: "",
//         designation: "",
//         status: "Active",
//       });
//       setIsModalOpen(false);
//     } catch (err) {
//       alert(err.message || "Failed to add employee");
//     } finally {
//       setSubmitting(false);
// =======
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       if (searchInput !== urlSearch) {
//         updateParams({ search: searchInput });
//       }
//     }, 400);

//     return () => clearTimeout(timer);
//   }, [searchInput, urlSearch, updateParams]);

//   useEffect(() => {
//     if (showAnalytics && !analyticsData) {
//       setAnalyticsLoading(true);

//       fetchEmployeeStatsDetailed()
//         .then((res) => setAnalyticsData(res.data))
//         .catch(() => {})
//         .finally(() => setAnalyticsLoading(false));
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     }
//   }, [showAnalytics, analyticsData]);

//   const handleToggleSelect = (id) => {
//     setSelectedIds((prev) => {
//       const next = new Set(prev);
//       next.has(id) ? next.delete(id) : next.add(id);
//       return next;
//     });
//   };

//   const handleSelectAll = () => {
//     if (employees.every((emp) => selectedIds.has(emp._id))) {
//       setSelectedIds(new Set());
//     } else {
//       setSelectedIds(new Set(employees.map((emp) => emp._id)));
//     }
//   };

//   const handleSort = (field) => {
//     const newDir =
//       urlSortField === field && urlSortDir === "asc" ? "desc" : "asc";

//     updateParams({
//       sortField: field,
//       sortDir: newDir,
//     });
//   };

//   const handleDeleteConfirm = async () => {
//     if (!deleteTarget) return;

//     setDeleting(true);
//     setError("");

//     try {
//       await deleteEmployee(deleteTarget._id);
//       setDeleteTarget(null);
//       await loadEmployees();
//       loadStats();
//       showToast("Employee deleted.");
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to delete employee.");
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleBulkDelete = async () => {
//     setBulkDeleting(true);
//     setError("");

//     try {
//       const ids = [...selectedIds];

//       await bulkDeleteEmployees(ids);

//       setShowBulkConfirm(false);
//       setSelectedIds(new Set());

//       await loadEmployees();
//       loadStats();

//       showToast(`${ids.length} employee${ids.length !== 1 ? "s" : ""} deleted.`);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to bulk delete employees.");
//     } finally {
//       setBulkDeleting(false);
//     }
//   };

//   const handleEmployeeSaved = async () => {
//     const wasEditing = Boolean(editTarget);

//     setShowAddModal(false);
//     setEditTarget(null);
//     setError("");

//     await loadEmployees();
//     loadStats();

//     setAnalyticsData(null);

//     showToast(
//       wasEditing
//         ? "Employee updated successfully."
//         : "Employee created successfully."
//     );
//   };

//   const handleInlineUpdate = async (empId, field, value) => {
//     try {
//       await updateEmployee(empId, { [field]: value });

//       setEmployees((prev) =>
//         prev.map((emp) =>
//           emp._id === empId ? { ...emp, [field]: value } : emp
//         )
//       );

//       loadStats();
//       setAnalyticsData(null);

//       showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
//     } catch (err) {
//       setError(err.response?.data?.message || `Failed to update ${field}.`);
//     }
//   };

//   const handleDocUpdate = (updatedEmployee) => {
//     setDocTarget(updatedEmployee);

//     setEmployees((prev) =>
//       prev.map((emp) =>
//         emp._id === updatedEmployee._id ? updatedEmployee : emp
//       )
//     );
//   };

//   const handleExportCSV = () => {
//     const headers = [
//       "Employee ID",
//       "First Name",
//       "Last Name",
//       "Email",
//       "Phone",
//       "Department",
//       "Designation",
//       "Salary",
//       "Joining Date",
//       "Status",
//     ];

//     const rows = employees.map((emp) => [
//       emp.employeeId,
//       emp.firstName,
//       emp.lastName,
//       emp.email,
//       emp.phone || "",
//       emp.department || "",
//       emp.designation || "",
//       emp.salary || 0,
//       emp.joiningDate
//         ? new Date(emp.joiningDate).toISOString().slice(0, 10)
//         : "",
//       emp.status,
//     ]);

//     const csv = [headers, ...rows]
//       .map((row) =>
//         row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
//       )
//       .join("\n");

//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);

//     const anchor = document.createElement("a");
//     anchor.href = url;
//     anchor.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
//     anchor.click();

//     URL.revokeObjectURL(url);
//   };

//   const handleFilterChange = (newFilters) => {
//     updateParams({
//       departments: newFilters.departments,
//       designations: newFilters.designations,
//       salaryMin: newFilters.salaryMin,
//       salaryMax: newFilters.salaryMax,
//       joiningFrom: newFilters.joiningFrom,
//       joiningTo: newFilters.joiningTo,
//       status: newFilters.status,
//     });
//   };

//   const handleFilterClear = () => {
//     updateParams({
//       departments: "",
//       designations: "",
//       salaryMin: "",
//       salaryMax: "",
//       joiningFrom: "",
//       joiningTo: "",
//       status: "",
//       search: "",
//     });

//     setSearchInput("");
//   };

//   const viewMode = urlView === "grid" ? "grid" : "table";

//   const toggleView = (mode) => {
//     updateParams({ view: mode });
//   };

//   const handleViewProfile = (employee) => {
//     navigate(`/employees/${employee._id}`);
//   };

//   const rangeStart =
//     pagination.totalCount === 0
//       ? 0
//       : (pagination.page - 1) * pagination.limit + 1;

//   const rangeEnd = Math.min(
//     pagination.page * pagination.limit,
//     pagination.totalCount
//   );

//   return (
//     <div className="flex flex-col gap-6">
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Manage your team — {pagination.totalCount} employee
//             {pagination.totalCount !== 1 ? "s" : ""} total
//           </p>
//         </div>

//         <div className="flex items-center gap-2 flex-wrap">
//           <button
//             onClick={() => setShowCSVImport(true)}
//             className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
//           >
//             <Upload size={15} /> Import
//           </button>

//           <button
//             onClick={handleExportCSV}
//             className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
//           >
//             <Download size={15} /> Export
//           </button>

//           <button
//             onClick={() => setShowAnalytics(!showAnalytics)}
//             className={`px-3 py-2 text-sm font-medium rounded-lg border transition flex items-center gap-1.5 ${
//               showAnalytics
//                 ? "bg-indigo-50 border-indigo-200 text-indigo-700"
//                 : "text-gray-600 border-gray-200 hover:bg-gray-50"
//             }`}
//           >
//             <BarChart3 size={15} /> Analytics
//           </button>

//           <button
//             onClick={() => {
//               setEditTarget(null);
//               setShowAddModal(true);
//             }}
//             className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
//           >
//             <Plus size={16} /> Add Employee
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
//         <StatCard label="Total" value={stats.total} color="bg-indigo-500" icon={Users} />
//         <StatCard label="Active" value={stats.active} color="bg-emerald-500" icon={Users} />
//         <StatCard label="On Leave" value={stats.onLeave} color="bg-amber-500" icon={Users} />
//         <StatCard label="Inactive" value={stats.inactive} color="bg-gray-400" icon={Users} />
//         <StatCard label="Terminated" value={stats.terminated} color="bg-red-500" icon={Users} />
//       </div>

//       <AnalyticsPanel
//         isOpen={showAnalytics}
//         data={analyticsData}
//         loading={analyticsLoading}
//       />

//       <div className="flex items-center gap-3">
//         <div className="relative flex-1 max-w-md">
//           <Search
//             size={16}
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
//           />

//           <input
//             type="text"
//             placeholder="Search by name, email, or employee ID…"
//             value={searchInput}
//             onChange={(e) => setSearchInput(e.target.value)}
//             className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition"
//           />

//           {searchInput && (
//             <button
//               onClick={() => {
//                 setSearchInput("");
//                 updateParams({ search: "" });
//               }}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//             >
//               <X size={14} />
//             </button>
//           )}
//         </div>

//         <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
//           <button
//             onClick={() => toggleView("table")}
//             className={`p-2.5 transition ${
//               viewMode === "table"
//                 ? "bg-indigo-50 text-indigo-600"
//                 : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
//             }`}
//             title="Table view"
//           >
//             <LayoutList size={16} />
//           </button>

//           <button
//             onClick={() => toggleView("grid")}
//             className={`p-2.5 transition ${
//               viewMode === "grid"
//                 ? "bg-indigo-50 text-indigo-600"
//                 : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
//             }`}
//             title="Grid view"
//           >
//             <LayoutGrid size={16} />
//           </button>
//         </div>

//         <button
//           onClick={() => {
//             loadEmployees();
//             loadStats();
//             setAnalyticsData(null);
//           }}
//           disabled={loading}
//           className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
//           title="Refresh"
//         >
//           <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//         </button>
//       </div>

//       <AdvancedFilters
//         filters={advancedFilters}
//         onChange={handleFilterChange}
//         onClear={handleFilterClear}
//       />

//       {selectedIds.size > 0 && (
//         <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
//           <span className="text-sm font-semibold text-indigo-700">
//             {selectedIds.size} selected
//           </span>

//           <button
//             onClick={() => setShowBulkConfirm(true)}
//             className="ml-auto px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition flex items-center gap-1"
//           >
//             <Trash2 size={13} /> Delete Selected
//           </button>
//         </div>
//       )}

//       {error && (
//         <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
//           <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
//           <span className="flex-1">{error}</span>

//           <button
//             onClick={() => setError("")}
//             className="flex-shrink-0 hover:text-red-900"
//           >
//             <X size={14} />
//           </button>
//         </div>
//       )}

//       {loading ? (
//         <div className="flex flex-col items-center justify-center py-16">
//           <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
//           <p className="text-sm text-gray-500">Loading employees…</p>
//         </div>
//       ) : viewMode === "table" ? (
//         <EmployeeTable
//           employees={employees}
//           sortField={urlSortField}
//           sortDir={urlSortDir}
//           onSort={handleSort}
//           selectedIds={selectedIds}
//           onToggleSelect={handleToggleSelect}
//           onSelectAll={handleSelectAll}
//           onEdit={(emp) => {
//             setEditTarget(emp);
//             setShowAddModal(true);
//           }}
//           onDelete={setDeleteTarget}
//           onDocuments={setDocTarget}
//           onViewProfile={handleViewProfile}
//           onInlineUpdate={handleInlineUpdate}
//         />
//       ) : (
//         <EmployeeGrid
//           employees={employees}
//           selectedIds={selectedIds}
//           onToggleSelect={handleToggleSelect}
//           onSelectAll={handleSelectAll}
//           onEdit={(emp) => {
//             setEditTarget(emp);
//             setShowAddModal(true);
//           }}
//           onDelete={setDeleteTarget}
//           onDocuments={setDocTarget}
//           onViewProfile={handleViewProfile}
//         />
//       )}

//       {pagination.totalPages > 0 && (
//         <div className="flex items-center justify-between px-1">
//           <p className="text-sm text-gray-500">
//             Showing <span className="font-semibold">{rangeStart}–{rangeEnd}</span>{" "}
//             of <span className="font-semibold">{pagination.totalCount}</span>
//           </p>

// <<<<<<< HEAD
//       {/* Modal Section */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
//             <div className="p-8">
//               <div className="flex justify-between items-center mb-6">
//                 <h2 className="text-2xl font-semibold">Add Employee</h2>
//                 <button
//                   onClick={closeModal}
//                   className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
//                 >
//                   ×
//                 </button>
//               </div>
// =======
//           <div className="flex items-center gap-1">
//             <button
//               onClick={() => updateParams({ page: urlPage - 1 })}
//               disabled={urlPage <= 1}
//               className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
//             >
//               <ChevronLeft size={16} />
//             </button>
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5

//             {Array.from(
//               { length: Math.min(pagination.totalPages, 7) },
//               (_, index) => {
//                 let pageNum;

//                 if (pagination.totalPages <= 7) {
//                   pageNum = index + 1;
//                 } else if (urlPage <= 4) {
//                   pageNum = index + 1;
//                 } else if (urlPage >= pagination.totalPages - 3) {
//                   pageNum = pagination.totalPages - 6 + index;
//                 } else {
//                   pageNum = urlPage - 3 + index;
//                 }

//                 return (
//                   <button
//                     key={pageNum}
//                     onClick={() => updateParams({ page: pageNum })}
//                     className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
//                       pageNum === urlPage
//                         ? "bg-indigo-600 text-white shadow-sm"
//                         : "text-gray-600 hover:bg-gray-100"
//                     }`}
//                   >
//                     {pageNum}
//                   </button>
//                 );
//               }
//             )}

//             <button
//               onClick={() => updateParams({ page: urlPage + 1 })}
//               disabled={urlPage >= pagination.totalPages}
//               className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
//             >
//               <ChevronRight size={16} />
//             </button>
//           </div>
//         </div>
//       )}

//       <AddEmployeeModal
//         isOpen={showAddModal || Boolean(editTarget)}
//         onClose={() => {
//           setShowAddModal(false);
//           setEditTarget(null);
//         }}
//         onSuccess={handleEmployeeSaved}
//         employee={editTarget}
//       />

//       {docTarget && (
//         <DocumentModal
//           isOpen={Boolean(docTarget)}
//           onClose={() => setDocTarget(null)}
//           employee={docTarget}
//           onUpdate={handleDocUpdate}
//         />
//       )}

//       <CSVImportModal
//         isOpen={showCSVImport}
//         onClose={() => setShowCSVImport(false)}
//         onSuccess={() => {
//           loadEmployees();
//           loadStats();
//           setAnalyticsData(null);
//           showToast("CSV import complete!");
//         }}
//       />

//       {deleteTarget && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           style={{
//             backgroundColor: "rgba(0,0,0,0.45)",
//             backdropFilter: "blur(4px)",
//           }}
//           onClick={(e) =>
//             e.target === e.currentTarget && !deleting && setDeleteTarget(null)
//           }
//         >
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
//             <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//               <Trash2 size={22} className="text-red-600" />
//             </div>

//             <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
//               Delete Employee
//             </h3>

//             <p className="text-sm text-gray-500 text-center mb-6">
//               Are you sure you want to permanently delete{" "}
//               <span className="font-semibold text-gray-800">
//                 {deleteTarget.firstName} {deleteTarget.lastName}
//               </span>
//               ? This action cannot be undone.
//             </p>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setDeleteTarget(null)}
//                 disabled={deleting}
//                 className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={handleDeleteConfirm}
//                 disabled={deleting}
//                 className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
//               >
//                 {deleting ? (
//                   <>
//                     <Loader2 size={14} className="animate-spin" />
//                     Deleting…
//                   </>
//                 ) : (
//                   "Yes, Delete"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showBulkConfirm && (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center p-4"
//           style={{
//             backgroundColor: "rgba(0,0,0,0.45)",
//             backdropFilter: "blur(4px)",
//           }}
//           onClick={(e) =>
//             e.target === e.currentTarget &&
//             !bulkDeleting &&
//             setShowBulkConfirm(false)
//           }
//         >
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
//             <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
//               <Trash2 size={22} className="text-red-600" />
//             </div>

//             <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
//               Bulk Delete
//             </h3>

//             <p className="text-sm text-gray-500 text-center mb-6">
//               Delete{" "}
//               <span className="font-semibold text-gray-800">
//                 {selectedIds.size}
//               </span>{" "}
//               selected employee{selectedIds.size !== 1 ? "s" : ""}? This action
//               cannot be undone.
//             </p>

//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowBulkConfirm(false)}
//                 disabled={bulkDeleting}
//                 className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={handleBulkDelete}
//                 disabled={bulkDeleting}
//                 className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
//               >
//                 {bulkDeleting ? (
//                   <>
//                     <Loader2 size={14} className="animate-spin" />
//                     Deleting…
//                   </>
//                 ) : (
//                   `Delete ${selectedIds.size}`
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {toast && (
//         <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in">
//           <svg
//             className="w-4 h-4 text-emerald-400 flex-shrink-0"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//             strokeWidth={2.5}
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               d="M5 13l4 4L19 7"
//             />
//           </svg>

//           {toast}

//           <button
//             onClick={() => setToast("")}
//             className="ml-2 text-gray-400 hover:text-white"
//           >
//             <X size={14} />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Employees;

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Download,
  Upload,
  RefreshCw,
  Loader2,
  Trash2,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  LayoutList,
  X,
} from "lucide-react";

// ─── SERVICES ────────────────────────────────────────────────────────────────
import {
  fetchEmployees,
  fetchEmployeeStats,
  fetchEmployeeStatsDetailed,
  deleteEmployee,
  bulkDeleteEmployees,
  updateEmployee,
} from "../services/employeeService";
import { notifyEmployeeProfileUpdated } from "../utils/employeeProfileEvents";

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
import EmployeeTable from "../components/EmployeeTable";
import EmployeeGrid from "../components/EmployeeGrid";
import AddEmployeeModal from "../components/AddEmployeeModal";
import DocumentModal from "../components/DocumentModal";
import AdvancedFilters from "../components/AdvancedFilters";
import AnalyticsPanel from "../components/AnalyticsPanel";
import CSVImportModal from "../components/CSVImportModal";

const PAGE_SIZE = 10;

// ─── STAT CARD COMPONENT ─────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const Employees = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-Based Filters Reading ──────────────────────────────────────────────
  const urlSearch = searchParams.get("search") || "";
  const urlDepartments = searchParams.get("departments") || "";
  const urlDesignations = searchParams.get("designations") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlSalaryMin = searchParams.get("salaryMin") || "";
  const urlSalaryMax = searchParams.get("salaryMax") || "";
  const urlJoiningFrom = searchParams.get("joiningFrom") || "";
  const urlJoiningTo = searchParams.get("joiningTo") || "";
  const urlSortField = searchParams.get("sortField") || "createdAt";
  const urlSortDir = searchParams.get("sortDir") || "desc";
  const urlPage = parseInt(searchParams.get("page"), 10) || 1;
  const urlView = searchParams.get("view") || "table";

  // ── Local UI States ────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    onLeave: 0,
    terminated: 0,
  });

  // Analytics States
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    totalCount: 0,
    totalPages: 1,
  });

  // Bulk Deletion States
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Modal Targets
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [docTarget, setDocTarget] = useState(null);
  const [showCSVImport, setShowCSVImport] = useState(false);

  const [searchInput, setSearchInput] = useState(urlSearch);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Memoized Advanced Filters
  const advancedFilters = useMemo(
    () => ({
      departments: urlDepartments ? urlDepartments.split(",") : [],
      designations: urlDesignations ? urlDesignations.split(",") : [],
      salaryMin: urlSalaryMin,
      salaryMax: urlSalaryMax,
      joiningFrom: urlJoiningFrom,
      joiningTo: urlJoiningTo,
      status: urlStatus,
    }),
    [urlDepartments, urlDesignations, urlSalaryMin, urlSalaryMax, urlJoiningFrom, urlJoiningTo, urlStatus]
  );

  // URL Parameter Updater
  const updateParams = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (
              value === "" ||
              value === null ||
              value === undefined ||
              (Array.isArray(value) && value.length === 0)
            ) {
              next.delete(key);
            } else {
              next.set(key, Array.isArray(value) ? value.join(",") : String(value));
            }
          });
          if (!("page" in updates)) {
            next.set("page", "1");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // ── Fetch Employees Logic ──────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: urlPage,
        limit: PAGE_SIZE,
        sortField: urlSortField,
        sortDir: urlSortDir,
      };

      if (urlSearch.trim()) params.search = urlSearch.trim();
      if (urlDepartments) params.department = urlDepartments;
      if (urlDesignations) params.designation = urlDesignations;
      if (urlStatus) params.status = urlStatus;
      if (urlSalaryMin) params.salaryMin = urlSalaryMin;
      if (urlSalaryMax) params.salaryMax = urlSalaryMax;
      if (urlJoiningFrom) params.joiningFrom = urlJoiningFrom;
      if (urlJoiningTo) params.joiningTo = urlJoiningTo;

      const result = await fetchEmployees(params);
      setEmployees(result.data || []);
      setPagination(
        result.pagination || {
          page: 1,
          limit: PAGE_SIZE,
          totalCount: 0,
          totalPages: 1,
        }
      );
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees. Is the backend running?");
    } {
      setLoading(false);
    }
  }, [
    urlSearch,
    urlDepartments,
    urlDesignations,
    urlStatus,
    urlSalaryMin,
    urlSalaryMax,
    urlJoiningFrom,
    urlJoiningTo,
    urlSortField,
    urlSortDir,
    urlPage,
  ]);

  const loadStats = useCallback(async () => {
    try {
      const result = await fetchEmployeeStats();
      setStats(
        result.data || {
          total: 0,
          active: 0,
          inactive: 0,
          onLeave: 0,
          terminated: 0,
        }
      );
    } catch {
      // Non-critical
    }
  }, []);

  // ─── 💡 FIX: එකිනෙකා හැප්පෙන EFFECTS වෙනුවට 100% ලූප්-ආරක්ෂිත බ්ලොක් එක ───
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      try {
        // Promise.allසඟින් Calls දෙකම එකම වෙලාවක පසුබිමෙන් පණ ගන්වයි
        await Promise.all([
          loadEmployees(),
          loadStats()
        ]);
      } catch (err) {
        console.error("Data initialization failed:", err);
      }
    };

    // 💡 setTimeout මඟින් ප්‍රධාන ලොගින්/රීඩිරෙක්ට් Render Cycle එක ඉවර වනකන් පොඩ්ඩක් ඉවසයි
    const timer = setTimeout(() => {
      if (isMounted) {
        initializeData();
      }
    }, 0); 

    // CLEANUP FUNCTION: Strict Mode එකෙන් Component එක Unmount කළහොත් කෝල්ස් නවත්වයි
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [loadEmployees, loadStats]); // ✅ දැන් Render Cycles එකිනෙක ගැටෙන්නේ නැත! පිරිසිදුයි!

  // Sync state on URL changes
  // useEffect(() => {
  //   loadEmployees();
  // }, [loadEmployees]);

  // useEffect(() => {
  //   loadStats();
  // }, [loadStats]);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateParams({ search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateParams]);

  // ─── 💡 FIX: ඇනලිටික්ස් අනන්ත ලූපය 100% ක් වළක්වන පිරිසිදු EFFECT එක ───
  useEffect(() => {
    // 💡 1. බටන් එක ක්ලික් කරලා නැත්නම් මෙතනින්ම හැරිලා යන්න
    if (!showAnalytics) return;

    let isMounted = true;

    const loadAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await fetchEmployeeStatsDetailed();
        
        if (isMounted) {
          // 💡 2. functional update එකක් පාවිච්චි කිරීමෙන් 'analyticsData' dependency එක අවශ්‍ය වෙන්නේ නැත
          setAnalyticsData(res.data || res); 
        }
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        if (isMounted) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();

    // CLEANUP FUNCTION: Strict Mode double-invoke එක පාලනය කරයි
    return () => {
      isMounted = false;
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAnalytics]); // ✅ Dependency එක ලෙස 'showAnalytics' පමණක් තැබීමෙන් අනන්ත ලූපය සදහටම නතර වේ!

  // Lazy load detailed analytics
  // useEffect(() => {
  //   if (showAnalytics && !analyticsData) {
  //     setAnalyticsLoading(true);
  //     fetchEmployeeStatsDetailed()
  //       .then((res) => setAnalyticsData(res.data))
  //       .catch(() => {})
  //       .finally(() => setAnalyticsLoading(false));
  //   }
  // }, [showAnalytics, analyticsData]);

  // ── Event Handlers ─────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (employees.every((emp) => selectedIds.has(emp._id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map((emp) => emp._id)));
    }
  };

  const handleSort = (field) => {
    const newDir = urlSortField === field && urlSortDir === "asc" ? "desc" : "asc";
    updateParams({ sortField: field, sortDir: newDir });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await deleteEmployee(deleteTarget._id);
      setDeleteTarget(null);
      await loadEmployees();
      loadStats();
      showToast("Employee deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete employee.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setError("");
    try {
      const ids = [...selectedIds];
      await bulkDeleteEmployees(ids);
      setShowBulkConfirm(false);
      setSelectedIds(new Set());
      await loadEmployees();
      loadStats();
      showToast(`${ids.length} employee${ids.length !== 1 ? "s" : ""} deleted.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to bulk delete employees.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleEmployeeSaved = async () => {
    const wasEditing = Boolean(editTarget);
    setShowAddModal(false);
    setEditTarget(null);
    setError("");
    await loadEmployees();
    loadStats();
    setAnalyticsData(null);
    showToast(wasEditing ? "Employee updated successfully." : "Employee created successfully.");
  };

  const handleInlineUpdate = async (empId, field, value) => {
    try {
      const result = await updateEmployee(empId, { [field]: value });
      const updated = result?.data;
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === empId ? (updated ? { ...emp, ...updated } : { ...emp, [field]: value }) : emp
        )
      );
      loadStats();
      setAnalyticsData(null);
      showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update ${field}.`);
    }
  };

  const handleDocUpdate = (updatedEmployee) => {
    setDocTarget(updatedEmployee);
    setEmployees((prev) =>
      prev.map((emp) => (emp._id === updatedEmployee._id ? updatedEmployee : emp))
    );
    notifyEmployeeProfileUpdated(updatedEmployee);
  };

  const handleExportCSV = () => {
    const headers = ["Employee ID", "First Name", "Last Name", "Email", "Phone", "Department", "Designation", "Salary", "Joining Date", "Status"];
    const rows = employees.map((emp) => [
      emp.employeeId,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.phone || "",
      emp.department || "",
      emp.designation || "",
      emp.salary || 0,
      emp.joiningDate ? new Date(emp.joiningDate).toISOString().slice(0, 10) : "",
      emp.status,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFilterChange = (newFilters) => {
    updateParams({
      departments: newFilters.departments,
      designations: newFilters.designations,
      salaryMin: newFilters.salaryMin,
      salaryMax: newFilters.salaryMax,
      joiningFrom: newFilters.joiningFrom,
      joiningTo: newFilters.joiningTo,
      status: newFilters.status,
    });
  };

  const handleFilterClear = () => {
    updateParams({
      departments: "", designations: "", salaryMin: "", salaryMax: "",
      joiningFrom: "", joiningTo: "", status: "", search: "",
    });
    setSearchInput("");
  };

  const viewMode = urlView === "grid" ? "grid" : "table";
  const toggleView = (mode) => updateParams({ view: mode });
  const handleViewProfile = (employee) => navigate(`/employees/${employee._id}`);

  const rangeStart = pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const rangeEnd = Math.min(pagination.page * pagination.limit, pagination.totalCount);

  // ─── RENDER METHOD ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Upper Dashboard Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your team — {pagination.totalCount} employee{pagination.totalCount !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCSVImport(true)}
            className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <Upload size={15} /> Import
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
          >
            <Download size={15} /> Export
          </button>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition flex items-center gap-1.5 ${
              showAnalytics ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <BarChart3 size={15} /> Analytics
          </button>

          <button
            onClick={() => { setEditTarget(null); setShowAddModal(true); }}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} color="bg-indigo-500" icon={Users} />
        <StatCard label="Active" value={stats.active} color="bg-emerald-500" icon={Users} />
        <StatCard label="On Leave" value={stats.onLeave} color="bg-amber-500" icon={Users} />
        <StatCard label="Inactive" value={stats.inactive} color="bg-gray-400" icon={Users} />
        <StatCard label="Terminated" value={stats.terminated} color="bg-red-500" icon={Users} />
      </div>

      {/* Analytics Draw */}
      <AnalyticsPanel isOpen={showAnalytics} data={analyticsData} loading={analyticsLoading} />

      {/* Search Bar and Layout Toggles */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or employee ID…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); updateParams({ search: "" }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleView("table")}
            className={`p-2.5 transition ${viewMode === "table" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
            title="Table view"
          >
            <LayoutList size={16} />
          </button>
          <button
            onClick={() => toggleView("grid")}
            className={`p-2.5 transition ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
            title="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        <button
          onClick={() => { loadEmployees(); loadStats(); setAnalyticsData(null); }}
          disabled={loading}
          className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <AdvancedFilters filters={advancedFilters} onChange={handleFilterChange} onClear={handleFilterClear} />

      {/* Bulk Delete Trigger Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <span className="text-sm font-semibold text-indigo-700">{selectedIds.size} selected</span>
          <button
            onClick={() => setShowBulkConfirm(true)}
            className="ml-auto px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition flex items-center gap-1"
          >
            <Trash2 size={13} /> Delete Selected
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="flex-shrink-0 hover:text-red-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Layout Delivery */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading employees…</p>
        </div>
      ) : viewMode === "table" ? (
        <EmployeeTable
          employees={employees}
          sortField={urlSortField}
          sortDir={urlSortDir}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onEdit={(emp) => { setEditTarget(emp); setShowAddModal(true); }}
          onDelete={setDeleteTarget}
          onDocuments={setDocTarget}
          onViewProfile={handleViewProfile}
          onInlineUpdate={handleInlineUpdate}
        />
      ) : (
        <EmployeeGrid
          employees={employees}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onEdit={(emp) => { setEditTarget(emp); setShowAddModal(true); }}
          onDelete={setDeleteTarget}
          onDocuments={setDocTarget}
          onViewProfile={handleViewProfile}
        />
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold">{rangeStart}–{rangeEnd}</span> of{" "}
            <span className="font-semibold">{pagination.totalCount}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => updateParams({ page: urlPage - 1 })}
              disabled={urlPage <= 1}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, index) => {
              let pageNum;
              if (pagination.totalPages <= 7) {
                pageNum = index + 1;
              } else if (urlPage <= 4) {
                pageNum = index + 1;
              } else if (urlPage >= pagination.totalPages - 3) {
                pageNum = pagination.totalPages - 6 + index;
              } else {
                pageNum = urlPage - 3 + index;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => updateParams({ page: pageNum })}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                    pageNum === urlPage ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => updateParams({ page: urlPage + 1 })}
              disabled={urlPage >= pagination.totalPages}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals Mounting */}
      <AddEmployeeModal
        isOpen={showAddModal || Boolean(editTarget)}
        onClose={() => { setShowAddModal(false); setEditTarget(null); }}
        onSuccess={handleEmployeeSaved}
        employee={editTarget}
      />

      {docTarget && (
        <DocumentModal
          isOpen={Boolean(docTarget)}
          onClose={() => setDocTarget(null)}
          employee={docTarget}
          onUpdate={handleDocUpdate}
        />
      )}

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={() => { loadEmployees(); loadStats(); setAnalyticsData(null); showToast("CSV import complete!"); }}
      />

      {/* Confirms Container */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && !deleting && setDeleteTarget(null)}
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
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && !bulkDeleting && setShowBulkConfirm(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Bulk Delete</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete <span className="font-semibold text-gray-800">{selectedIds.size}</span> selected employee{selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
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
                {bulkDeleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : `Delete ${selectedIds.size}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Message */}
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
    </div>
  );
};

export default Employees;