import { useState } from "react";
import {
  UserCheck, UserX, Pencil, Trash2, Paperclip, ShieldAlert,
  ChevronUp, ChevronDown, ChevronsUpDown, Clock, Loader2, User, Shield, Briefcase, Eye
} from "lucide-react";

// ─── Constants & Badges ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive: "bg-gray-100 text-gray-600 border border-gray-200",
  "On Leave": "bg-amber-100 text-amber-700 border border-amber-200",
  Terminated: "bg-red-100 text-red-700 border border-red-200",
};

const ROLE_STYLES = {
  Admin: "bg-purple-100 text-purple-700 border border-purple-200",
  HR: "bg-pink-100 text-pink-700 border border-pink-200",
  Manager: "bg-blue-100 text-blue-700 border border-blue-200",
  Employee: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Inactive}`}>
    {status === "Active" ? <UserCheck size={11} /> : <UserX size={11} />}
    {status}
  </span>
);

const RoleBadge = ({ role }) => {
  const getIcon = () => {
    switch (role) {
      case "Admin": return <ShieldAlert size={11} />;
      case "Manager": return <Shield size={11} />;
      case "HR": return <Briefcase size={11} />;
      default: return <User size={11} />;
    }
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[role] || ROLE_STYLES.Employee}`}>
      {getIcon()}
      {role || "Employee"}
    </span>
  );
};

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-rose-500",
  "bg-orange-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
];

const Avatar = ({ name, empId, profilePhoto }) => {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colorIndex = empId ? empId.charCodeAt(empId.length - 1) % AVATAR_COLORS.length : 0;
  const color = AVATAR_COLORS[colorIndex];

  if (profilePhoto) {
    const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
    return (
      <div className="relative w-9 h-9 flex-shrink-0">
        <img
          src={`${base}/${profilePhoto}`}
          alt={name}
          className="w-9 h-9 rounded-full object-cover border-2 border-gray-100 shadow-sm"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "flex";
          }}
        />
        <div className={`w-9 h-9 rounded-full ${color} items-center justify-center text-white text-sm font-bold absolute inset-0`} style={{ display: "none" }}>
          {initials}
        </div>
      </div>
    );
  }
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={13} className="text-gray-300 ml-1" />;
  return sortDir === "asc"
    ? <ChevronUp size={13} className="text-indigo-500 ml-1" />
    : <ChevronDown size={13} className="text-indigo-500 ml-1" />;
};

// ─── Updated Grid Columns Configuration ───────────────────────────────────────
// Added 100px explicit allocation for the Role badge component column
const TABLE_GRID =
  "grid-cols-[36px_130px_minmax(160px,1fr)_minmax(180px,1fr)_120px_100px_110px_110px_1fr]";

const COLUMNS = [
  { key: null,          label: "" },
  { key: "employeeId",  label: "Employee ID" },
  { key: "firstName",   label: "Name" },
  { key: "email",       label: "Email" },
  { key: "department",  label: "Department" },
  { key: "role",        label: "Role" }, // <-- New Column
  { key: "joiningDate", label: "Joined" },
  { key: "status",      label: "Status" },
  { key: null,          label: "Actions" },
];

const EmployeeTable = ({
  employees,
  sortField,
  sortDir,
  onSort,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onDocuments,
  onViewProfile,
  onViewDetails,
  onInlineUpdate,
}) => {
  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e._id));
  const someSelected = employees.some((e) => selectedIds.has(e._id));

  const [editingCell, setEditingCell] = useState(null);
  const [inlineSaving, setInlineSaving] = useState(null);

  const DEPARTMENTS = [
    "Engineering", "HR", "Finance", "Marketing", "Sales",
    "Operations", "IT", "Design", "Legal", "Support",
  ];
  const STATUSES = ["Active", "Inactive", "On Leave", "Terminated"];
  const ROLES = ["Admin", "HR", "Manager", "Employee"]; // Optional if inline editing roles

  const handleInlineCommit = async (empId, field, value) => {
    const key = `${empId}-${field}`;
    setInlineSaving(key);
    if (onInlineUpdate) await onInlineUpdate(empId, field, value);
    setEditingCell(null);
    setInlineSaving(null);
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1020px]"> {/* Increased slightly to hold structural column safely */}
        {/* Table Header */}
        <div className={`grid ${TABLE_GRID} gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider`}>
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {COLUMNS.slice(1).map((col) =>
            col.key ? (
              <button
                key={col.key}
                onClick={() => onSort(col.key)}
                className="flex items-center text-left uppercase tracking-wider font-semibold text-gray-500 hover:text-indigo-600 transition text-xs"
              >
                {col.label}
                <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
              </button>
            ) : (
              <span key={col.label} className="text-left">{col.label}</span>
            )
          )}
        </div>

        {/* Rows Container */}
        <div className="divide-y divide-gray-50">
          {employees.map((emp) => {
            const isSelected = selectedIds.has(emp._id);
            const fullName = `${emp.firstName} ${emp.lastName}`;

            return (
              <div
                key={emp._id}
                className={`grid ${TABLE_GRID} gap-3 items-center px-5 py-3.5 transition group ${isSelected ? "bg-indigo-50/60" : "hover:bg-indigo-50/20"}`}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(emp._id)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* ID */}
                <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                  {emp.employeeId}
                </span>

                {/* Name + Avatar */}
                <button onClick={() => onViewProfile(emp)} className="flex items-center gap-3 min-w-0 text-left group/name">
                  <Avatar name={fullName} empId={emp._id} profilePhoto={emp.profilePhoto} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover/name:text-indigo-600 transition">
                      {fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{emp.designation || "—"}</p>
                  </div>
                </button>

                {/* Email */}
                <span className="text-sm text-gray-600 truncate">{emp.email}</span>

                {/* Department */}
                {editingCell?.empId === emp._id && editingCell?.field === "department" ? (
                  <select
                    autoFocus
                    defaultValue={emp.department || ""}
                    onChange={(e) => handleInlineCommit(emp._id, "department", e.target.value)}
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => e.key === "Escape" && setEditingCell(null)}
                    className="text-sm border border-indigo-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">—</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <button
                    onClick={() => onInlineUpdate && setEditingCell({ empId: emp._id, field: "department" })}
                    className={`text-sm text-gray-700 truncate text-left ${onInlineUpdate ? "hover:text-indigo-600 hover:underline cursor-pointer" : ""}`}
                    title={onInlineUpdate ? "Click to edit" : undefined}
                  >
                    {inlineSaving === `${emp._id}-department` ? <Loader2 size={14} className="animate-spin text-indigo-500" /> : (emp.department || "—")}
                  </button>
                )}

                {/* ─── ROLE DISPLAY ─── */}
                <div className="flex justify-start">
                  {/* If you want inline role modification, you can switch this to a select identical to the department one above */}
                  <RoleBadge role={emp.role} />
                </div>

                {/* Joined Date */}
                <span className="text-xs text-gray-500">{formatDate(emp.joiningDate)}</span>

                {/* Status */}
                {editingCell?.empId === emp._id && editingCell?.field === "status" ? (
                  <select
                    autoFocus
                    defaultValue={emp.status}
                    onChange={(e) => handleInlineCommit(emp._id, "status", e.target.value)}
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => e.key === "Escape" && setEditingCell(null)}
                    className="text-sm border border-indigo-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <button
                    onClick={() => onInlineUpdate && setEditingCell({ empId: emp._id, field: "status" })}
                    className="flex justify-start"
                    title={onInlineUpdate ? "Click to edit" : undefined}
                  >
                    {inlineSaving === `${emp._id}-status` ? <Loader2 size={14} className="animate-spin text-indigo-500" /> : <StatusBadge status={emp.status} />}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-start gap-1.5">
                  <button
                    onClick={() => onDocuments(emp)}
                    className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition text-xs font-semibold border border-indigo-100"
                  >
                    <Paperclip size={13} />
                    <span>Docs</span>
                    {emp.documents?.length > 0 && (
                      <span className="w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {emp.documents.length}
                      </span>
                    )}
                  </button>

                  <button onClick={() => onViewDetails(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="View Details">
                    <Eye size={15} />
                  </button>

                  <button onClick={() => onEdit(emp)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit">
                    <Pencil size={15} />
                  </button>

                  <button onClick={() => onDelete(emp)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;