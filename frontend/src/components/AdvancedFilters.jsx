import { useState, useMemo } from "react";
import {
  Filter, X, ChevronDown, ChevronUp, DollarSign, Calendar,
  Building2, Briefcase, CheckSquare, Square, RotateCcw,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Engineering", "HR", "Finance", "Marketing", "Sales",
  "Operations", "IT", "Design", "Legal", "Support",
];
const DESIGNATIONS = [
  "Software Engineer", "Senior Engineer", "Tech Lead", "Manager",
  "Senior Manager", "Director", "VP", "HR Executive", "Analyst",
  "Designer", "Intern",
];
const STATUSES = ["Active", "Inactive", "On Leave", "Terminated"];

const EMPTY_FILTERS = {
  departments: [],
  designations: [],
  salaryMin: "",
  salaryMax: "",
  joiningFrom: "",
  joiningTo: "",
  status: "",
};

// ─── Multi-Select Checkbox Group ──────────────────────────────────────────────
const CheckboxGroup = ({ label, icon: Icon, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const allSelected = selected.length === options.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggleAll = () => {
    onChange(allSelected ? [] : [...options]);
  };

  const toggle = (val) => {
    onChange(
      selected.includes(val)
        ? selected.filter((s) => s !== val)
        : [...selected, val]
    );
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left text-sm font-semibold text-gray-700 hover:text-indigo-600 transition"
      >
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label}
        {selected.length > 0 && (
          <span className="ml-auto mr-2 px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full">
            {selected.length}
          </span>
        )}
        {open ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
      </button>
      {open && (
        <div className="pl-1 space-y-1 max-h-48 overflow-y-auto">
          {/* Select / Clear All */}
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 w-full text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-1"
          >
            {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
            {allSelected ? "Clear All" : "Select All"}
          </button>
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Active Filter Chips ──────────────────────────────────────────────────────
const FilterChip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
    {label}
    <button
      onClick={onRemove}
      className="ml-0.5 hover:text-red-600 transition"
      aria-label={`Remove ${label} filter`}
    >
      <X size={12} />
    </button>
  </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * AdvancedFilters
 * Multi-select departments/designations, salary range, date range, status.
 *
 * Props:
 *   filters   : { departments, designations, salaryMin, salaryMax, joiningFrom, joiningTo, status }
 *   onChange   : (newFilters) => void
 *   onClear    : () => void
 */
const AdvancedFilters = ({ filters, onChange, onClear }) => {
  const [expanded, setExpanded] = useState(false);

  const update = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  // Count active filters
  const activeCount = useMemo(() => {
    let c = 0;
    if (filters.departments.length) c++;
    if (filters.designations.length) c++;
    if (filters.salaryMin || filters.salaryMax) c++;
    if (filters.joiningFrom || filters.joiningTo) c++;
    if (filters.status) c++;
    return c;
  }, [filters]);

  // Build chip list
  const chips = useMemo(() => {
    const arr = [];
    filters.departments.forEach((d) =>
      arr.push({ key: `dept-${d}`, label: d, remove: () => update("departments", filters.departments.filter((x) => x !== d)) })
    );
    filters.designations.forEach((d) =>
      arr.push({ key: `desig-${d}`, label: d, remove: () => update("designations", filters.designations.filter((x) => x !== d)) })
    );
    if (filters.salaryMin) arr.push({ key: "salMin", label: `Salary ≥ $${Number(filters.salaryMin).toLocaleString()}`, remove: () => update("salaryMin", "") });
    if (filters.salaryMax) arr.push({ key: "salMax", label: `Salary ≤ $${Number(filters.salaryMax).toLocaleString()}`, remove: () => update("salaryMax", "") });
    if (filters.joiningFrom) arr.push({ key: "jFrom", label: `From ${filters.joiningFrom}`, remove: () => update("joiningFrom", "") });
    if (filters.joiningTo) arr.push({ key: "jTo", label: `To ${filters.joiningTo}`, remove: () => update("joiningTo", "") });
    if (filters.status) arr.push({ key: "status", label: filters.status, remove: () => update("status", "") });
    return arr;
  }, [filters]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300">
      {/* Toggle bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full px-5 py-3.5 text-left hover:bg-gray-50/60 transition"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Filter size={15} className="text-indigo-600" />
        </div>
        <span className="text-sm font-semibold text-gray-800">Advanced Filters</span>
        {activeCount > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
            {activeCount}
          </span>
        )}
        <span className="ml-auto text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Filter chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {chips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.remove} />
          ))}
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition"
          >
            <RotateCcw size={11} /> Clear All
          </button>
        </div>
      )}

      {/* Expandable panel */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? "600px" : "0px", opacity: expanded ? 1 : 0 }}
      >
        <div className="px-5 pb-5 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

            {/* Department multi-select */}
            <CheckboxGroup
              label="Department"
              icon={Building2}
              options={DEPARTMENTS}
              selected={filters.departments}
              onChange={(val) => update("departments", val)}
            />

            {/* Designation multi-select */}
            <CheckboxGroup
              label="Designation"
              icon={Briefcase}
              options={DESIGNATIONS}
              selected={filters.designations}
              onChange={(val) => update("designations", val)}
            />

            {/* Salary range */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <DollarSign size={14} className="text-gray-400" /> Salary Range
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.salaryMin}
                    onChange={(e) => update("salaryMin", e.target.value)}
                    className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <span className="text-xs text-gray-400">—</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.salaryMax}
                    onChange={(e) => update("salaryMax", e.target.value)}
                    className="w-full pl-6 pr-2 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Joining Date range */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" /> Joining Date
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.joiningFrom}
                  onChange={(e) => update("joiningFrom", e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <span className="text-xs text-gray-400">—</span>
                <input
                  type="date"
                  value={filters.joiningTo}
                  onChange={(e) => update("joiningTo", e.target.value)}
                  className="flex-1 min-w-0 px-2.5 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Status
              </p>
              <select
                value={filters.status}
                onChange={(e) => update("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export { EMPTY_FILTERS };
export default AdvancedFilters;
