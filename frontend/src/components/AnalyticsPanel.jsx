import { useMemo } from "react";
import { Loader2, TrendingUp, BarChart3, PieChart } from "lucide-react";

// ─── Color maps ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Active: "#10b981",
  Inactive: "#9ca3af",
  "On Leave": "#f59e0b",
  Terminated: "#ef4444",
};

const BAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#818cf8",
  "#6d28d9", "#7c3aed", "#4f46e5", "#4338ca",
  "#5b21b6", "#3730a3",
];

const SALARY_LABELS = {
  0: "$0 – $25K",
  25000: "$25K – $50K",
  50000: "$50K – $75K",
  75000: "$75K – $100K",
  100000: "$100K+",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    ))}
  </div>
);

// ─── Department Bar Chart ─────────────────────────────────────────────────────
const DeptChart = ({ data }) => {
  const maxCount = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <BarChart3 size={15} className="text-indigo-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">Department Distribution</h3>
      </div>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={d._id || "unknown"} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 truncate max-w-[120px]">
                {d._id || "Unassigned"}
              </span>
              <span className="text-xs font-bold text-gray-800">{d.count}</span>
            </div>
            <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80"
                style={{
                  width: `${(d.count / maxCount) * 100}%`,
                  background: `linear-gradient(90deg, ${BAR_COLORS[i % BAR_COLORS.length]}, ${BAR_COLORS[(i + 1) % BAR_COLORS.length]})`,
                }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No department data</p>
        )}
      </div>
    </div>
  );
};

// ─── Status Donut Chart ───────────────────────────────────────────────────────
const StatusDonut = ({ data }) => {
  const total = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data]);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  // Build segments
  const segments = useMemo(() => {
    let offset = 0;
    return data.map((d) => {
      const pct = total > 0 ? d.count / total : 0;
      const seg = {
        ...d,
        pct,
        dashArray: `${pct * circumference} ${circumference}`,
        dashOffset: -offset,
        color: STATUS_COLORS[d._id] || "#d1d5db",
      };
      offset += pct * circumference;
      return seg;
    });
  }, [data, total, circumference]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <PieChart size={15} className="text-emerald-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">Status Breakdown</h3>
      </div>
      <div className="flex flex-col items-center gap-4">
        {/* SVG donut */}
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="16" />
            {segments.map((seg) => (
              <circle
                key={seg._id}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="16"
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{total}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
          </div>
        </div>
        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {segments.map((seg) => (
            <div key={seg._id} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-gray-600">{seg._id || "Unknown"}</span>
              <span className="text-gray-400 ml-auto">{total > 0 ? Math.round(seg.pct * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Salary Histogram ─────────────────────────────────────────────────────────
const SalaryHistogram = ({ distribution, stats }) => {
  const maxCount = useMemo(
    () => Math.max(1, ...distribution.map((d) => d.count)),
    [distribution]
  );
  const avgSalary = stats?.[0]?.avgSalary || 0;
  const minSalary = stats?.[0]?.minSalary || 0;
  const maxSalary = stats?.[0]?.maxSalary || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
          <TrendingUp size={15} className="text-violet-600" />
        </div>
        <h3 className="text-sm font-bold text-gray-800">Salary Distribution</h3>
      </div>

      {/* Bars */}
      <div className="flex items-end justify-center gap-3 h-36 mb-4">
        {distribution.map((d, i) => {
          const heightPct = (d.count / maxCount) * 100;
          const label = SALARY_LABELS[d._id] || `$${(d._id / 1000).toFixed(0)}K+`;
          return (
            <div key={d._id} className="flex flex-col items-center gap-1 flex-1 group">
              <span className="text-[10px] font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition">
                {d.count}
              </span>
              <div className="w-full relative" style={{ height: "120px" }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700 ease-out group-hover:opacity-80"
                  style={{
                    height: `${heightPct}%`,
                    background: `linear-gradient(180deg, ${BAR_COLORS[i * 2] || "#6366f1"}, ${BAR_COLORS[i * 2 + 1] || "#8b5cf6"})`,
                  }}
                />
              </div>
              <span className="text-[9px] text-gray-500 text-center leading-tight whitespace-nowrap">
                {label}
              </span>
            </div>
          );
        })}
        {distribution.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-12">No salary data</p>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
        {[
          { label: "Min", value: minSalary },
          { label: "Avg", value: avgSalary },
          { label: "Max", value: maxSalary },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-gray-800">
              ${Math.round(value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * AnalyticsPanel
 * Collapsible dashboard with department, status, and salary charts.
 *
 * Props:
 *   isOpen  : boolean
 *   data    : { departmentCounts, statusCounts, salaryDistribution, salaryStats } | null
 *   loading : boolean
 */
const AnalyticsPanel = ({ isOpen, data, loading }) => {
  if (!isOpen) return null;

  if (loading || !data) return <Skeleton />;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DeptChart data={data.departmentCounts || []} />
        <StatusDonut data={data.statusCounts || []} />
        <SalaryHistogram
          distribution={data.salaryDistribution || []}
          stats={data.salaryStats || []}
        />
      </div>
    </div>
  );
};

export default AnalyticsPanel;
