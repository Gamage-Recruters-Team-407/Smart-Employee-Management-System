import {
  Mail, Phone, Pencil, Trash2, FileText, Eye,
  DollarSign, Calendar, Building2, Briefcase,
  UserCheck, UserX, Clock, AlertTriangle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-orange-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
];

const STATUS_CONFIG = {
  Active:     { icon: UserCheck, bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Inactive:   { icon: UserX,    bg: "bg-gray-50",    text: "text-gray-600",    dot: "bg-gray-400" },
  "On Leave": { icon: Clock,    bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  Terminated: { icon: AlertTriangle, bg: "bg-red-50", text: "text-red-700",     dot: "bg-red-500" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSalary = (val) => {
  if (val === undefined || val === null) return "—";
  return `$${Number(val).toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, empId, profilePhoto, size = "large" }) => {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colorIndex = empId ? empId.charCodeAt(empId.length - 1) % AVATAR_COLORS.length : 0;
  const color = AVATAR_COLORS[colorIndex];
  const base = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
  const sizeClass = size === "large" ? "w-16 h-16 text-lg" : "w-10 h-10 text-sm";

  if (profilePhoto) {
    return (
      <div className={`relative ${sizeClass} flex-shrink-0`}>
        <img
          src={profilePhoto.startsWith("http") ? profilePhoto : `${base}/${profilePhoto}`}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border-3 border-white shadow-md`}
          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
        />
        <div className={`${sizeClass} rounded-full ${color} items-center justify-center text-white font-bold absolute inset-0`} style={{ display: "none" }}>
          {initials}
        </div>
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full ${color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
      {initials}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};

// ─── Employee Card ────────────────────────────────────────────────────────────
const EmployeeCard = ({
  employee, isSelected, onToggleSelect, onEdit, onDelete, onDocuments, onViewDetails,
}) => {
  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <div
      className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group ${
        isSelected ? "border-indigo-400 ring-2 ring-indigo-200" : "border-gray-100"
      }`}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 right-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(employee._id)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm"
        />
      </div>

      {/* Card body */}
      <div className="w-full text-left p-5 pb-3">
        {/* Avatar + basic info */}
        <div className="flex items-start gap-4">
          <Avatar name={fullName} empId={employee._id} profilePhoto={employee.profilePhoto} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition">
              {fullName}
            </h3>
            <p className="text-xs text-gray-500 truncate">{employee.designation || "—"}</p>
            <span className="inline-block mt-1.5 text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {employee.employeeId}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{employee.department || "—"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <DollarSign size={11} className="text-gray-400 flex-shrink-0" />
            <span>{formatSalary(employee.salary)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail size={11} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={11} className="text-gray-400 flex-shrink-0" />
            <span>{formatDate(employee.joiningDate)}</span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-3">
          <StatusBadge status={employee.status} />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-end gap-1 px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
        <button
          onClick={(e) => { e.stopPropagation(); onDocuments(employee); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 transition"
          title="Documents"
        >
          <FileText size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails(employee); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 transition"
          title="View Details"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(employee); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-100 transition"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(employee); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 transition"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * EmployeeGrid
 * Card/grid view alternative to EmployeeTable.
 * Same props interface for easy swapping.
 *
 * Props:
 *   employees     : array
 *   selectedIds   : Set<string>
 *   onToggleSelect: (id) => void
 *   onSelectAll   : () => void
 *   onEdit        : (employee) => void
 *   onDelete      : (employee) => void
 *   onDocuments   : (employee) => void
 *   onViewProfile : (employee) => void
 */
const EmployeeGrid = ({
  employees, selectedIds, onToggleSelect, onSelectAll,
  onEdit, onDelete, onDocuments, onViewDetails,
}) => {
  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase size={24} className="text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No employees found.</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  const allSelected = employees.length > 0 && employees.every((e) => selectedIds.has(e._id));
  const someSelected = employees.some((e) => selectedIds.has(e._id)) && !allSelected;

  return (
    <div>
      {/* Select all row */}
      <div className="flex items-center gap-3 px-1 mb-4">
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected; }}
            onChange={onSelectAll}
            className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          Select all on this page
        </label>
        {selectedIds.size > 0 && (
          <span className="text-xs text-indigo-600 font-medium">{selectedIds.size} selected</span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {employees.map((emp) => (
          <EmployeeCard
            key={emp._id}
            employee={emp}
            isSelected={selectedIds.has(emp._id)}
            onToggleSelect={onToggleSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            onDocuments={onDocuments}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default EmployeeGrid;
