import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckSquare,
  Calendar,
  MessageSquare,
  Loader2,
  AlertCircle,
  Filter,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import DailyProgressForm from "../components/DailyProgressForm";

const STATUS_STYLES = {
  "To Do": "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Review: "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_FILTERS = ["All", "To Do", "In Progress", "Review", "Completed"];

const unwrap = (response) => response.data;

const formatDueDate = (date) => {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const EmployeeTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showReport, setShowReport] = useState(false);

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await unwrap(await API.get("/tasks/my"));
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load your tasks.";
      setError(message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        await API.get("/employees/me");
      } catch {
        /* profile may still load tasks by email */
      }
      fetchMyTasks();
    };
    load();
  }, [fetchMyTasks]);

  const filtered =
    statusFilter === "All"
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  const active = filtered.filter((t) => t.status !== "Completed");
  const completed = filtered.filter((t) => t.status === "Completed");

  const displayName = user?.name || "Employee";

  const handleProgressChange = async (taskId, progress) => {
    try {
      const updated = await unwrap(
        await API.patch(`/tasks/${taskId}/progress`, { progress })
      );
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update progress");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      const updated = await unwrap(
        await API.patch(`/tasks/${taskId}/status`, { status })
      );
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update status");
    }
  };

  const handleAddComment = async (taskId, text) => {
    try {
      const updated = await unwrap(
        await API.post(`/tasks/${taskId}/comments`, {
          text,
          author: displayName,
        })
      );
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to post comment");
    }
  };

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status !== "Completed").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    overdue: tasks.filter((t) => {
      if (!t.dueDate || t.status === "Completed") return false;
      const due = new Date(t.dueDate);
      due.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due < today;
    }).length,
  };

  const WORKFLOW = ["To Do", "In Progress", "Review", "Completed"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Workflow:</span>
        {WORKFLOW.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span>→</span>}
            <span className="px-2 py-0.5 bg-gray-100 rounded-md">{s}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-500 mt-1">
            Drag the progress slider and pick a status for your assigned work. HR/Manager views updates on Task Management.
          </p>
          {user?.email && (
            <p className="text-sm text-indigo-600 mt-1 font-medium">{user.email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={fetchMyTasks}
          disabled={loading}
          className="text-sm px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} className="bg-indigo-50 text-indigo-800" />
        <StatCard label="Active" value={stats.active} className="bg-blue-50 text-blue-800" />
        <StatCard label="Completed" value={stats.completed} className="bg-green-50 text-green-800" />
        <StatCard label="Overdue" value={stats.overdue} className="bg-red-50 text-red-800" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              statusFilter === s
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin mb-3" size={32} />
          <p>Loading your tasks…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium">Could not load tasks</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              type="button"
              onClick={fetchMyTasks}
              className="mt-3 text-sm font-semibold text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <CheckSquare className="mx-auto mb-3 text-gray-300" size={48} />
          <p className="text-gray-600 font-medium">No tasks found</p>
          <p className="text-sm text-gray-400 mt-1">
            {statusFilter === "All"
              ? "No tasks yet. Ask HR/Manager to assign tasks using the same email as your login."
              : `No tasks with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <TaskSection
              title="Active"
              items={active}
              onProgress={handleProgressChange}
              onStatus={handleStatusChange}
              onComment={handleAddComment}
            />
          )}
          {completed.length > 0 && (
            <TaskSection
              title="Completed"
              items={completed}
              onProgress={handleProgressChange}
              onStatus={handleStatusChange}
              onComment={handleAddComment}
            />
          )}
        </div>
      )}

      <div className="mt-10 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => setShowReport((v) => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <ClipboardList size={16} />
          {showReport ? "Hide Daily Progress Report" : "Daily Progress Report"}
        </button>
        {showReport && <DailyProgressForm />}
      </div>
      
    </div>
  );
};

const StatCard = ({ label, value, className }) => (
  <div className={`rounded-xl p-4 ${className}`}>
    <p className="text-sm opacity-80">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const TaskSection = ({ title, items, onProgress, onStatus, onComment }) => (
  <section>
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {title} ({items.length})
    </h2>
    <div className="space-y-4">
      {items.map((task) => (
        <EmployeeTaskCard
          key={task._id}
          task={task}
          onProgress={onProgress}
          onStatus={onStatus}
          onComment={onComment}
        />
      ))}
    </div>
  </section>
);

const WORKFLOW_STATUSES = ["To Do", "In Progress", "Review", "Completed"];

const EmployeeTaskCard = ({ task, onProgress, onStatus, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [savingProgress, setSavingProgress] = useState(false);
  const progressRef = useRef(progress);

  useEffect(() => {
    setProgress(task.progress ?? 0);
    progressRef.current = task.progress ?? 0;
  }, [task.progress, task._id]);

  const saveProgress = async (value) => {
    if (value === progressRef.current) return;
    setSavingProgress(true);
    try {
      await onProgress(task._id, value);
      progressRef.current = value;
    } finally {
      setSavingProgress(false);
    }
  };

  const isOverdue =
    task.dueDate &&
    task.status !== "Completed" &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex flex-wrap justify-between gap-2 mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
        <span
          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
            STATUS_STYLES[task.status] || STATUS_STYLES["To Do"]
          }`}
        >
          {task.status}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
        <span className="inline-flex items-center gap-1">
          <Calendar size={14} />
          Due: {formatDueDate(task.dueDate)}
          {isOverdue && (
            <span className="text-red-600 font-semibold ml-1">(overdue)</span>
          )}
        </span>
        {task.priority && (
          <span className="capitalize">Priority: {task.priority}</span>
        )}
      </div>

      <label className="block text-xs font-medium text-gray-700 mb-1">
        Your work progress: {progress}%
        {savingProgress && <span className="text-indigo-500 ml-2">Saving…</span>}
      </label>
      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        disabled={savingProgress}
        onChange={(e) => {
          const v = Number(e.target.value);
          setProgress(v);
          progressRef.current = v;
        }}
        onMouseUp={() => saveProgress(progressRef.current)}
        onTouchEnd={() => saveProgress(progressRef.current)}
        className="w-full accent-indigo-600 mb-1"
      />
      <p className="text-xs text-gray-400 mb-3">Move the slider when you complete part of this task.</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {WORKFLOW_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatus(task._id, s)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition ${
              task.status === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowComments(!showComments)}
        className="inline-flex items-center gap-1 text-sm text-indigo-600 font-medium"
      >
        <MessageSquare size={16} />
        {showComments ? "Hide comments" : `Comments (${task.comments?.length || 0})`}
      </button>

      {showComments && (
        <div className="mt-3 space-y-2">
          {(task.comments || []).length === 0 ? (
            <p className="text-xs text-gray-400">No comments yet.</p>
          ) : (
            (task.comments || []).map((c, i) => (
              <div key={i} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-700">{c.author}</span>
                <span className="text-gray-400 text-xs ml-2">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </span>
                <p className="text-gray-600 mt-0.5">{c.text}</p>
              </div>
            ))
          )}
          <form
            className="flex gap-2 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!comment.trim()) return;
              onComment(task._id, comment.trim());
              setComment("");
            }}
          >
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Add a comment…"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

export default EmployeeTasks;
