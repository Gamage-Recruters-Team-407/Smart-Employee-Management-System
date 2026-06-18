import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CheckSquare, User } from "lucide-react";
import DailyProgressForm from "../components/DailyProgressForm";

const STATUS_STYLES = {
  "To Do": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Review: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
};

const MyTasks = () => {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyTasks = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/tasks/my");
      const data = res?.data ?? res;
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load your tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleProgressChange = async (taskId, progress) => {
    try {
      const res = await API.patch(`/tasks/${taskId}/progress`, { progress });
      const updated = res?.data ?? res;
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      alert(err.message || "Failed to update progress");
    }
  };

  const handleAddComment = async (taskId, text) => {
    const res = await API.post(`/tasks/${taskId}/comments`, {
      text,
      author: user.name || user.email,
    });
    const updated = res?.data ?? res;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  };

  if (authLoading) {
    return <p className="p-8 text-center text-gray-500">Loading session...</p>;
  }

  if (!user?._id) {
    return (
      <p className="p-8 text-center text-gray-500">
        You must be logged in to view your tasks.
      </p>
    );
  }

  const active = tasks.filter((t) => t.status !== "Completed");
  const done = tasks.filter((t) => t.status === "Completed");
  const overdue = tasks.filter(
    (t) => t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < new Date()
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <User size={16} />
            {user.name} ({user.email})
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Workflow:</span>
        {["To Do", "In Progress", "Review", "Completed"].map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span>→</span>}
            <span className="px-2 py-0.5 bg-gray-100 rounded-md">{s}</span>
          </span>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Drag the progress slider and pick a status for your assigned work. HR/Manager views updates on Task Management.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Total" value={tasks.length} color="bg-indigo-50 text-indigo-700" />
        <Stat label="Active" value={active.length} color="bg-blue-50 text-blue-700" />
        <Stat label="Completed" value={done.length} color="bg-green-50 text-green-700" />
        <Stat label="Overdue" value={overdue.length} color="bg-red-50 text-red-700" />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading your tasks...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
          <CheckSquare className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="font-medium">No tasks found</p>
          <p className="text-sm mt-1">
            No tasks yet. Ask HR/Manager to assign tasks using the same email as your login.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <TaskSection
            title="Active"
            items={active}
            onProgress={handleProgressChange}
            onComment={handleAddComment}
          />
          <TaskSection
            title="Completed"
            items={done}
            onProgress={handleProgressChange}
            onComment={handleAddComment}
          />
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <p className="text-sm opacity-80">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const TaskSection = ({ title, items, onProgress, onComment }) => {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
        {title} ({items.length})
      </h2>
      <div className="space-y-4">
        {items.map((task) => (
          <TaskRow key={task._id} task={task} onProgress={onProgress} onComment={onComment} />
        ))}
      </div>
    </section>
  );
};

const TaskRow = ({ task, onProgress, onComment }) => {
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm">
      <div className="flex justify-between gap-2 mb-2">
        <h3 className="font-semibold">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[task.status]}`}>
          {task.status}
        </span>
      </div>
      {task.description && (
        <p className="text-sm text-gray-500 mb-3">{task.description}</p>
      )}
      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        onChange={(e) => setProgress(Number(e.target.value))}
        onMouseUp={() => onProgress(task._id, progress)}
        className="w-full accent-indigo-600 mb-2"
      />
      <p className="text-xs text-gray-500 mb-2">{progress}% complete</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-indigo-600"
      >
        {open ? "Hide" : "Add"} comment
      </button>
      {open && (
        <form
          className="flex gap-2 mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            onComment(task._id, comment);
            setComment("");
          }}
        >
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            placeholder="Write a comment..."
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            Post
          </button>
        </form>
      )}

      <DailyProgressForm />
      
    </div>
  );
};

export default MyTasks;