import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useMockAuth } from "../context/MockAuthContext";
import { CheckSquare, User } from "lucide-react";

const STATUS_STYLES = {
  "To Do": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Review: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
};

const MyTasks = () => {
  const { user, employees, loading: authLoading, switchMockUser } = useMockAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyTasks = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    try {
      const data = await API.get("/tasks/my");
      setTasks(data);
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
      const updated = await API.patch(`/tasks/${taskId}/progress`, { progress });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
    } catch (err) {
      alert(err.message || "Failed to update progress");
    }
  };

  const handleAddComment = async (taskId, text) => {
    const updated = await API.post(`/tasks/${taskId}/comments`, {
      text,
      author: `${user.firstName} ${user.lastName}`,
    });
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  };

  if (authLoading) {
    return <p className="p-8 text-center text-gray-500">Loading session...</p>;
  }

  if (!user?._id) {
    return (
      <p className="p-8 text-center text-gray-500">
        No mock employee selected. Add an employee first, then pick one below.
      </p>
    );
  }

  const active = tasks.filter((t) => t.status !== "Completed");
  const done = tasks.filter((t) => t.status === "Completed");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <strong>Dev mode:</strong> Mock employee session (no JWT yet). Select who you
        are simulating — later this becomes real login + <code>AuthContext</code>.
      </div>

      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <User size={16} />
            {user.firstName} {user.lastName} ({user.email})
          </p>
        </div>
        {employees.length > 1 && (
          <select
            value={user._id}
            onChange={(e) => switchMockUser(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
          >
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                Simulate: {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="My Tasks" value={tasks.length} />
        <Stat label="Active" value={active.length} />
        <Stat label="Completed" value={done.length} />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading your tasks...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
          <CheckSquare className="mx-auto mb-3 text-gray-300" size={40} />
          <p>No tasks assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <TaskSection title="Active" items={active} onProgress={handleProgressChange} onComment={handleAddComment} />
          <TaskSection title="Completed" items={done} onProgress={handleProgressChange} onComment={handleAddComment} />
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="bg-indigo-50 text-indigo-700 rounded-xl p-4">
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
      {task.description && <p className="text-sm text-gray-500 mb-3">{task.description}</p>}
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
      <button type="button" onClick={() => setOpen(!open)} className="text-sm text-indigo-600">
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
          <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm">
            Post
          </button>
        </form>
      )}
    </div>
  );
};

export default MyTasks;
