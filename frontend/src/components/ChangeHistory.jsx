import { useState, useEffect, useCallback } from "react";
import {
  Clock, UserPlus, Pencil, Trash2, Camera, FileText, FileUp, FileMinus,
  ChevronDown, Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../services/api";

// ─── Action styles ────────────────────────────────────────────────────────────
const ACTION_CONFIG = {
  created:           { icon: UserPlus, color: "bg-emerald-500", label: "Created" },
  updated:           { icon: Pencil,   color: "bg-blue-500",    label: "Updated" },
  deleted:           { icon: Trash2,   color: "bg-red-500",     label: "Deleted" },
  photo_uploaded:    { icon: Camera,   color: "bg-indigo-500",  label: "Photo Uploaded" },
  document_uploaded: { icon: FileUp,   color: "bg-violet-500",  label: "Document Uploaded" },
  document_deleted:  { icon: FileMinus,color: "bg-gray-500",    label: "Document Deleted" },
};

// ─── Single timeline entry ────────────────────────────────────────────────────
const TimelineEntry = ({ entry, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.updated;
  const Icon = config.icon;
  const hasChanges = entry.changes && entry.changes.length > 0;

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon size={14} className="text-white" />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* Content */}
      <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {entry.summary || config.label}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{entry.performedBy || "System"}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
            {hasChanges && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition whitespace-nowrap"
              >
                {expanded ? "Hide" : "Show"} changes
                <ChevronDown size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>

          {/* Changes diff table */}
          {expanded && hasChanges && (
            <div className="mt-3 border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-500 w-1/3">Field</th>
                    <th className="px-3 py-2 text-left font-semibold text-red-400 w-1/3">Old Value</th>
                    <th className="px-3 py-2 text-left font-semibold text-emerald-500 w-1/3">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entry.changes.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-medium text-gray-700 capitalize">{c.field}</td>
                      <td className="px-3 py-2 text-red-600 line-through truncate max-w-[140px]">
                        {c.oldValue != null ? String(c.oldValue) : "—"}
                      </td>
                      <td className="px-3 py-2 text-emerald-600 font-medium truncate max-w-[140px]">
                        {c.newValue != null ? String(c.newValue) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-3 animate-pulse">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 bg-gray-100 rounded-xl h-20" />
      </div>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * ChangeHistory
 * Displays a paginated audit timeline for an employee.
 *
 * Props:
 *   employeeId : string (MongoDB _id)
 */
const ChangeHistory = ({ employeeId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (pageNum, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      const res = await api.get(`/employees/${employeeId}/history`, {
        params: { page: pageNum, limit: 20 },
      });
      const data = res.data;
      if (append) {
        setLogs((prev) => [...prev, ...(data.data || [])]);
      } else {
        setLogs(data.data || []);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [employeeId]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [employeeId, load]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, true);
  };

  if (loading) return <Skeleton />;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Clock size={20} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No changes recorded yet.</p>
        <p className="text-xs text-gray-400 mt-0.5">Changes will appear here when this employee is edited.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((entry, i) => (
        <TimelineEntry key={entry._id} entry={entry} isLast={i === logs.length - 1 && !hasMore} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore ? (
              <><Loader2 size={14} className="animate-spin" /> Loading…</>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChangeHistory;
