import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../services/api";
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  Mail,
  Briefcase,
  Building2,
} from "lucide-react";

const STATUS_STYLES = {
  "To Do": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Review: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
};

const EmployeeAccount = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [emp, empTasks] = await Promise.all([
        API.get(`/employees/${id}`),
        API.get(`/employees/${id}/tasks`),
      ]);
      setEmployee(emp.data);
      setTasks(Array.isArray(empTasks.data) ? empTasks.data : []);
    } catch (err) {
      setError(err.message || "Failed to load employee account");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const handleProgressChange = async (taskId, progress) => {
    try {
      const updated = await API.patch(`/tasks/${taskId}/progress`, { progress });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updated.data : t)));
    } catch (err) {
      alert(err.message || "Failed to update progress");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading employee account...</div>
    );
  }

  if (error || !employee) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-red-600 mb-4">{error || "Employee not found"}</p>
        <Link
          to="/employees"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Employees
        </Link>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== "Completed");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        to="/employees"
        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium mb-6"
      >
        <ArrowLeft size={18} />
        Back to Employees
      </Link>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {employee.firstName?.[0]}
            {employee.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-800">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-gray-500 font-mono text-sm mt-1">
              {employee.employeeId}
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {employee.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {employee.email}
                </span>
              )}
              {employee.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  {employee.department}
                </span>
              )}
              {employee.designation && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} />
                  {employee.designation}
                </span>
              )}
            </div>
          </div>
          <div className="bg-indigo-50 text-indigo-700 rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-sm font-medium">Assigned Tasks</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="text-indigo-600" size={22} />
        <h2 className="text-xl font-bold text-gray-800">Assigned Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
          <p>No tasks assigned yet.</p>
          <p className="text-sm mt-2">
            Assign tasks from Task Management — they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeTasks.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Active ({activeTasks.length})
              </h3>
              <div className="space-y-4">
                {activeTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onProgressChange={handleProgressChange}
                  />
                ))}
              </div>
            </section>
          )}

          {completedTasks.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onProgressChange={handleProgressChange}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const TaskItem = ({ task, onProgressChange }) => {
  const [localProgress, setLocalProgress] = useState(task.progress ?? 0);

  useEffect(() => {
    setLocalProgress(task.progress ?? 0);
  }, [task.progress]);

  const isOverdue =
    task.dueDate &&
    task.status !== "Completed" &&
    new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
        <h4 className="font-semibold text-gray-800">{task.title}</h4>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[task.status]}`}
        >
          {task.status}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-gray-500 mb-3">{task.description}</p>
      )}

      {task.dueDate && (
        <p
          className={`flex items-center gap-1.5 text-sm mb-3 ${
            isOverdue ? "text-red-600 font-medium" : "text-gray-500"
          }`}
        >
          <Calendar size={14} />
          Due: {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && " (Overdue)"}
        </p>
      )}

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span className="font-medium">Progress</span>
          <span>{localProgress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={localProgress}
          onChange={(e) => setLocalProgress(Number(e.target.value))}
          onMouseUp={() => onProgressChange(task._id, localProgress)}
          onTouchEnd={() => onProgressChange(task._id, localProgress)}
          className="w-full h-2 accent-indigo-600 cursor-pointer"
        />
        <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${localProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeAccount;
