import React, { useEffect, useMemo, useState } from "react";
import PerformanceChart from "../components/PerformanceChart";
import performanceApi from "../services/performanceApi";

const managerRoles = ["Manager", "Admin", "HR"];
const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const emptyForm = {
  employee: "",
  attendanceScore: "",
  tasksCompleted: "",
  tasksAssigned: "",
  qualityScore: "",
  feedback: ""
};

const toNumber = (value) => {
  if (value === "") return 0;
  return Number(value);
};

const scoreTagClasses = (score) => {
  if (score >= 85) return "bg-green-100 text-green-700";
  if (score >= 70) return "bg-sky-100 text-sky-700";
  return "bg-red-100 text-red-700";
};

const Performance = () => {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentRole = localStorage.getItem("role") || "Manager";
  const currentUserId = localStorage.getItem("userId") || "";
  const canManage = managerRoles.includes(currentRole);

  const loadPerformance = async () => {
    setLoading(true);
    setError("");

    try {
      let list = [];
      if (currentRole === "Employee") {
        if (!currentUserId) {
          throw new Error("No user id found. Set localStorage userId for employee view.");
        }
        const res = await performanceApi.getByEmployee(currentUserId);
        list = res.data ? [res.data] : [];
      } else {
        const res = await performanceApi.getAll();
        list = Array.isArray(res.data) ? res.data : [];
      }
      setRecords(list);
    } catch (apiError) {
      if (!apiError.response) {
        setError(`Cannot connect to backend API (${apiBase}). Start backend and retry.`);
      } else {
        setError(apiError.response?.data?.message || apiError.message || "Failed to load performance data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformance();
  }, []);

  const metrics = useMemo(() => {
    if (records.length === 0) {
      return {
        avgOverall: 0,
        avgAttendance: 0,
        avgTaskRate: 0,
        avgQuality: 0
      };
    }

    const sum = records.reduce(
      (acc, row) => {
        acc.overall += row.overallScore || 0;
        acc.attendance += row.attendanceScore || 0;
        acc.task += row.taskCompletionRate || 0;
        acc.quality += row.qualityScore || 0;
        return acc;
      },
      { overall: 0, attendance: 0, task: 0, quality: 0 }
    );

    return {
      avgOverall: (sum.overall / records.length).toFixed(2),
      avgAttendance: (sum.attendance / records.length).toFixed(2),
      avgTaskRate: (sum.task / records.length).toFixed(2),
      avgQuality: (sum.quality / records.length).toFixed(2)
    };
  }, [records]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      await performanceApi.create({
        employee: form.employee,
        attendanceScore: toNumber(form.attendanceScore),
        tasksCompleted: toNumber(form.tasksCompleted),
        tasksAssigned: toNumber(form.tasksAssigned),
        qualityScore: toNumber(form.qualityScore),
        feedback: form.feedback
      });

      setMessage("Performance record created.");
      setForm(emptyForm);
      await loadPerformance();
    } catch (apiError) {
      if (!apiError.response) {
        setError(`Cannot connect to backend API (${apiBase}). Start backend and retry.`);
      } else {
        setError(apiError.response?.data?.message || "Failed to create record.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-600 mt-1">
            Overall Score = (Attendance Score + Task Completion Rate + Quality Score) / 3
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
          Current Role: {currentRole}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {canManage && (
        <form onSubmit={handleCreate} className="bg-white shadow rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Create Performance Record</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              className="border rounded-xl px-4 py-2"
              name="employee"
              value={form.employee}
              onChange={handleChange}
              placeholder="Employee User ID"
              required
            />
            <input
              className="border rounded-xl px-4 py-2"
              name="attendanceScore"
              value={form.attendanceScore}
              onChange={handleChange}
              placeholder="Attendance Score (0-100)"
              type="number"
              min="0"
              max="100"
              required
            />
            <input
              className="border rounded-xl px-4 py-2"
              name="tasksCompleted"
              value={form.tasksCompleted}
              onChange={handleChange}
              placeholder="Tasks Completed"
              type="number"
              min="0"
              required
            />
            <input
              className="border rounded-xl px-4 py-2"
              name="tasksAssigned"
              value={form.tasksAssigned}
              onChange={handleChange}
              placeholder="Tasks Assigned"
              type="number"
              min="0"
              required
            />
            <input
              className="border rounded-xl px-4 py-2"
              name="qualityScore"
              value={form.qualityScore}
              onChange={handleChange}
              placeholder="Quality Score (0-100)"
              type="number"
              min="0"
              max="100"
              required
            />
            <input
              className="border rounded-xl px-4 py-2"
              name="feedback"
              value={form.feedback}
              onChange={handleChange}
              placeholder="Manager Feedback"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create Record"}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Average Overall</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics.avgOverall}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Average Attendance</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics.avgAttendance}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Average Task Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics.avgTaskRate}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-gray-500 text-sm">Average Quality</p>
          <p className="text-2xl font-semibold text-gray-900">{metrics.avgQuality}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-6 text-gray-600">Loading performance data...</div>
      ) : (
        <>
          <PerformanceChart data={records} />

          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Summary Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-gray-600">
                    <th className="py-3">Employee</th>
                    <th className="py-3">Attendance</th>
                    <th className="py-3">Task Rate</th>
                    <th className="py-3">Quality</th>
                    <th className="py-3">Overall</th>
                    <th className="py-3">Last Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 && (
                    <tr>
                      <td className="py-4 text-gray-500" colSpan="6">
                        No records yet.
                      </td>
                    </tr>
                  )}
                  {records.map((record) => {
                    const lastFeedback = record.managerFeedback?.[record.managerFeedback.length - 1];
                    return (
                      <tr key={record._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{record.employee?.name || "-"}</td>
                        <td className="py-3">{record.attendanceScore}</td>
                        <td className="py-3">{record.taskCompletionRate}%</td>
                        <td className="py-3">{record.qualityScore}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreTagClasses(record.overallScore)}`}>
                            {record.overallScore}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{lastFeedback?.feedback || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Performance;
