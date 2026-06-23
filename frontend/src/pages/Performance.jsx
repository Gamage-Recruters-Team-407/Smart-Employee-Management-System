import React, { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import PerformanceChart from "../components/PerformanceChart";
import performanceApi from "../services/performanceApi";
import { fetchEmployees } from "../services/employeeService";

const managerRoles = ["Manager", "Admin", "HR"];
const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const emidRegex = /^(EMID|EID)\d+$/i;

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

const getSessionUser = () => {
  const localUserRaw = localStorage.getItem("user");
  const sessionUserRaw = sessionStorage.getItem("user");
  const raw = localUserRaw || sessionUserRaw;

  if (!raw || raw === "undefined") {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getEmployeeFieldIssue = (value) => {
  const trimmed = (value || "").trim();

  if (!trimmed) {
    return "Employee ID is required.";
  }

  if (emidRegex.test(trimmed)) {
    return "EMID format detected. Use the employee User ID (24-character ObjectId) for this form.";
  }

  if (!objectIdRegex.test(trimmed)) {
    return "Employee User ID must be a valid 24-character ObjectId.";
  }

  return "";
};

const Performance = () => {
  const [records, setRecords] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationIssue, setValidationIssue] = useState("");
  const [employeeFieldIssue, setEmployeeFieldIssue] = useState("");
  const [message, setMessage] = useState("");
  const [resolvedRole, setResolvedRole] = useState("");
  const [resolvedCanManage, setResolvedCanManage] = useState(null);

  const sessionUser = getSessionUser();
  const fallbackRole = sessionUser?.role || localStorage.getItem("role") || "Employee";
  const currentRole = resolvedRole || fallbackRole;
  const canManage = resolvedCanManage ?? managerRoles.includes(currentRole);

  const loadPerformance = async () => {
    setLoading(true);
    setError("");
    setValidationIssue("");

    try {
      try {
        const accessRes = await performanceApi.getAccess();
        const access = accessRes?.data || {};
        if (access.role) {
          setResolvedRole(access.role);
        }
        if (typeof access.canManage === "boolean") {
          setResolvedCanManage(access.canManage);
        }
      } catch {
        // keep local fallback role/canManage
      }

      const res = await performanceApi.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setRecords(list);

      // Load employees for the dropdown
      try {
        const empRes = await fetchEmployees({ limit: 1000 });
        if (empRes && empRes.data) {
          setEmployeesList(empRes.data);
        }
      } catch (err) {
        console.error("Failed to load employees list", err);
      }
    } catch (apiError) {
      if (!apiError.response) {
        setError(`Cannot connect to backend API (${apiBase}). Start backend and retry.`);
      } else {
        const apiMessage = apiError.response?.data?.message || apiError.message || "Failed to load performance data.";
        if (apiError.response.status === 404 && /performance record not found/i.test(apiMessage)) {
          setRecords([]);
        } else {
          setError(apiMessage);
        }
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

    if (name === "employee") {
      setEmployeeFieldIssue(getEmployeeFieldIssue(value));
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const fieldIssue = getEmployeeFieldIssue(form.employee);
    if (fieldIssue) {
      setEmployeeFieldIssue(fieldIssue);
      setValidationIssue(`Employee field: ${fieldIssue}`);
      return;
    }

    setSubmitting(true);
    setMessage("");
    setError("");
    setValidationIssue("");

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
        const status = apiError.response.status;
        const apiMessage = apiError.response?.data?.message || "Failed to create record.";

        if (status === 400 || status === 409 || status === 422) {
          setValidationIssue(apiMessage);
        } else {
          setError(apiMessage);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this performance record?")) return;
    
    setError("");
    setMessage("");
    try {
      await performanceApi.remove(id);
      setMessage("Performance record deleted.");
      await loadPerformance();
    } catch (apiError) {
      const apiMessage = apiError.response?.data?.message || "Failed to delete record.";
      setError(apiMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
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
      {validationIssue && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
          Validation issue: {validationIssue}
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
            <div className="flex flex-col gap-1">
              <select
                className={`border rounded-xl px-4 py-2 ${employeeFieldIssue ? "border-red-400 bg-red-50" : ""}`}
                name="employee"
                value={form.employee}
                onChange={handleChange}
                onBlur={(event) => setEmployeeFieldIssue(getEmployeeFieldIssue(event.target.value))}
                required
              >
                <option value="">-- Select Employee --</option>
                {employeesList
                  .filter((emp) => {
                    const isAccountMissing = !emp.userId;
                    const alreadyExists = emp.userId && records.some((r) => r.employee?._id === emp.userId);
                    return !isAccountMissing && !alreadyExists;
                  })
                  .map((emp) => (
                    <option key={emp._id} value={emp.userId}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId || emp.email})
                    </option>
                  ))}
              </select>
              {employeeFieldIssue && (
                <p className="text-sm text-red-600">{employeeFieldIssue}</p>
              )}
            </div>
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
                    {canManage && <th className="py-3 text-right">Actions</th>}
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
                        {canManage && (
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
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
