import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ClipboardList, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, Clock, Circle } from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const TEAM_POSITIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Team Lead",
  "Assistant Team Lead",
  "BA",
  "Quality Assurance",
  "IT",
  "Fullstack",
  "PM",
];

const TASK_STATUSES = ["Pending", "In Progress", "Completed"];

const STATUS_STYLES = {
  Pending:     "bg-slate-100 text-slate-600 border-slate-300",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-300",
  Completed:   "bg-green-100 text-green-700 border-green-300",
};

const STATUS_ICONS = {
  Pending:       <Circle size={13} />,
  "In Progress": <Clock size={13} />,
  Completed:     <CheckCircle size={13} />,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const todayStr = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  timeStr = timeStr.trim();
  
  // Matches "HH:MM" or "HH.MM"
  const match = timeStr.match(/^(\d{1,2})[:.](\d{2})$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return { h, m };
    }
  }
  
  // Matches "HH" (e.g. "13" -> 13:00)
  const hhMatch = timeStr.match(/^(\d{1,2})$/);
  if (hhMatch) {
    const h = parseInt(hhMatch[1], 10);
    if (h >= 0 && h < 24) {
      return { h, m: 0 };
    }
  }
  
  return null;
};

const formatTime = (timeObj) => {
  if (!timeObj) return "";
  const hh = String(timeObj.h).padStart(2, "0");
  const mm = String(timeObj.m).padStart(2, "0");
  return `${hh}:${mm}`;
};

const calcTotalHours = (start, end) => {
  const s = parseTime(start);
  const e = parseTime(end);
  if (!s || !e) return "";
  const totalMins = e.h * 60 + e.m - (s.h * 60 + s.m);
  if (totalMins <= 0) return "";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const emptyTask = () => ({ description: "", status: "Pending" });

const emptyForm = () => ({
  date: todayStr(),
  startTime: "",
  endTime: "",
  totalHours: "",
  teamPosition: "",
  workedOnTasks: true,
  tasks: [emptyTask()],
  challengesIssues: "",
  dependenciesAssistance: "",
  plannedTasksTomorrow: "",
  additionalNotes: "",
});

// ─── Main Component ───────────────────────────────────────────────────────────

const DailyProgressForm = () => {
  const { user } = useAuth();

  const [collapsed, setCollapsed]   = useState(true);
  const [form, setForm]             = useState(emptyForm());
  const [existing, setExisting]     = useState(null); // submitted report for today
  const [editMode, setEditMode]     = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // ── Fetch today's existing report ──────────────────────────────────────────
  const fetchTodayReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/daily-reports/my?date=${todayStr()}`);
      const data = res?.data ?? res;
      setExisting(data);
      setEditMode(false);
    } catch (err) {
      // 404 means no report yet — that's fine
      if (err?.response?.status === 404 || err?.status === 404) {
        setExisting(null);
        setEditMode(true); // open the form straight away
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayReport();
  }, [fetchTodayReport]);

  // Pre-fill form when entering edit mode from an existing report
  useEffect(() => {
    if (editMode && existing) {
      setForm({
        date: existing.date,
        startTime: existing.startTime || "",
        endTime: existing.endTime || "",
        totalHours: existing.totalHours || "",
        teamPosition: existing.teamPosition || "",
        workedOnTasks: existing.workedOnTasks !== false,
        tasks: existing.tasks?.length ? existing.tasks : [emptyTask()],
        challengesIssues: existing.challengesIssues || "",
        dependenciesAssistance: existing.dependenciesAssistance || "",
        plannedTasksTomorrow: existing.plannedTasksTomorrow || "",
        additionalNotes: existing.additionalNotes || "",
      });
    } else if (editMode && !existing) {
      setForm(emptyForm());
    }
  }, [editMode, existing]);

  // Auto-calculate total hours when start time or end time changes
  useEffect(() => {
    if (form.startTime && form.endTime) {
      const hours = calcTotalHours(form.startTime, form.endTime);
      setForm((prev) => ({ ...prev, totalHours: hours }));
      if (hours) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n.totalHours;
          delete n.endTime;
          return n;
        });
      }
    } else {
      setForm((prev) => ({ ...prev, totalHours: "" }));
    }
  }, [form.startTime, form.endTime]);



  // ── Field helpers ──────────────────────────────────────────────────────────
  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleDateChange = async (newDate) => {
    setField("date", newDate);
    setLoading(true);
    try {
      const res = await API.get(`/daily-reports/my?date=${newDate}`);
      const data = res?.data ?? res;
      setExisting(data);
      setEditMode(false);
    } catch (err) {
      if (err?.response?.status === 404 || err?.status === 404) {
        setExisting(null);
        setEditMode(true);
        // Reset the form fields, but keep the newDate and current position selection
        setForm({
          ...emptyForm(),
          date: newDate,
          teamPosition: form.teamPosition,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Task row helpers ───────────────────────────────────────────────────────
  const addTaskRow = () =>
    setForm((prev) => ({ ...prev, tasks: [...prev.tasks, emptyTask()] }));

  const removeTaskRow = (idx) =>
    setForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== idx),
    }));

  const updateTaskField = (idx, field, value) =>
    setForm((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t, i) => (i === idx ? { ...t, [field]: value } : t)),
    }));



  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.startTime) {
      e.startTime = "Start time is required.";
    } else if (!parseTime(form.startTime)) {
      e.startTime = "Use 24h format (e.g. 09:00).";
    }

    if (!form.endTime) {
      e.endTime = "End time is required.";
    } else if (!parseTime(form.endTime)) {
      e.endTime = "Use 24h format (e.g. 17:30).";
    }

    if (form.startTime && form.endTime && parseTime(form.startTime) && parseTime(form.endTime)) {
      if (!calcTotalHours(form.startTime, form.endTime)) {
        e.endTime = "End time must be after start time.";
      }
    }

    if (!form.totalHours || !form.totalHours.trim()) {
      e.totalHours = "Total hours worked is required.";
    }
    if (!form.teamPosition) e.teamPosition = "Please select your position.";
    if (form.workedOnTasks) {
      const hasBlank = form.tasks.some((t) => !t.description.trim());
      if (hasBlank) e.tasks = "All task entries must have a description.";
      if (!form.tasks.length) e.tasks = "Add at least one task.";
    }
    return e;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setErrors({});
    try {
      const parsedStart = parseTime(form.startTime);
      const parsedEnd = parseTime(form.endTime);

      const payload = {
        ...form,
        startTime: formatTime(parsedStart),
        endTime: formatTime(parsedEnd),
        tasks: form.workedOnTasks
          ? form.tasks.filter((t) => t.description.trim())
          : [],
      };
      const res = await API.post("/daily-reports", payload);
      const saved = res?.data ?? res;
      setExisting(saved);
      setEditMode(false);
      setSuccessMsg("Report saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to save report." });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Read-only summary ────────────────────────────────────────────────────
  const renderReadOnlySummary = () => (
    <div className="space-y-4">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <SummaryField label="Date"        value={existing.date} />
        <SummaryField label="Name"        value={existing.fullName} />
        <SummaryField label="Start"       value={existing.startTime} />
        <SummaryField label="End"         value={existing.endTime} />
        <SummaryField label="Total Hours" value={existing.totalHours || "—"} />
        <SummaryField label="Position"    value={existing.teamPosition} />
        <SummaryField label="Worked on tasks?" value={existing.workedOnTasks ? "Yes" : "No"} />
      </div>

      {existing.tasks?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tasks</p>
          <div className="space-y-2">
            {existing.tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[t.status]}`}>
                  {STATUS_ICONS[t.status]} {t.status}
                </span>
                <span className="text-sm text-gray-700">{t.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {existing.challengesIssues && (
        <SummaryBlock label="Challenges / Issues" value={existing.challengesIssues} />
      )}
      {existing.dependenciesAssistance && (
        <SummaryBlock label="Dependencies / Assistance" value={existing.dependenciesAssistance} />
      )}
      {existing.plannedTasksTomorrow && (
        <SummaryBlock label="Planned for Tomorrow" value={existing.plannedTasksTomorrow} />
      )}
      {existing.additionalNotes && (
        <SummaryBlock label="Additional Notes" value={existing.additionalNotes} />
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => { setEditMode(true); setSuccessMsg(""); }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Edit Report
        </button>
        <button
          onClick={() => {
            setExisting(null);
            setEditMode(true);
            setForm(emptyForm());
            setSuccessMsg("");
          }}
          className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition shadow-sm"
        >
          Submit for Another Day
        </button>
      </div>
    </div>
  );

  // ─── Form ─────────────────────────────────────────────────────────────────
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Row 1 — Date / Name (locked) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date">
          <input
            type="date"
            value={form.date}
            onChange={(e) => handleDateChange(e.target.value)}
            max={todayStr()}
            className={`${inputCls()} bg-white`}
          />
        </Field>
        <Field label="Full Name">
          <input
            type="text"
            value={
              user?.name ||
              `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
              "—"
            }
            disabled
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-gray-500 text-sm"
          />
        </Field>
      </div>

      {/* Row 2 — Times */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Start Time *" error={errors.startTime}>
          <div className="flex gap-2 items-center mt-1">
            <select
              value={form.startTime && form.startTime.includes(":") ? form.startTime.split(":")[0] : ""}
              onChange={(e) => {
                const hour = e.target.value;
                const min = form.startTime && form.startTime.includes(":") ? form.startTime.split(":")[1] : "00";
                setField("startTime", hour ? `${hour}:${min}` : "");
              }}
              className={`${inputCls(errors.startTime)} bg-white`}
            >
              <option value="">Hour</option>
              {Array.from({ length: 24 }, (_, i) => {
                const h = String(i).padStart(2, "0");
                return (
                  <option key={h} value={h}>
                    {h}
                  </option>
                );
              })}
            </select>
            <span className="text-gray-500 font-bold">:</span>
            <select
              value={form.startTime && form.startTime.includes(":") ? form.startTime.split(":")[1] : ""}
              onChange={(e) => {
                const min = e.target.value;
                const hour = form.startTime && form.startTime.includes(":") ? form.startTime.split(":")[0] : "08";
                setField("startTime", min ? `${hour}:${min}` : "");
              }}
              className={`${inputCls(errors.startTime)} bg-white`}
            >
              <option value="">Minute</option>
              {Array.from({ length: 60 }, (_, i) => {
                const m = String(i).padStart(2, "0");
                return (
                  <option key={m} value={m}>
                    {m}
                  </option>
                );
              })}
            </select>
          </div>
        </Field>
        <Field label="End Time (24hr) *" error={errors.endTime}>
          <div className="flex gap-2 items-center mt-1">
            <select
              value={form.endTime && form.endTime.includes(":") ? form.endTime.split(":")[0] : ""}
              onChange={(e) => {
                const hour = e.target.value;
                const min = form.endTime && form.endTime.includes(":") ? form.endTime.split(":")[1] : "00";
                setField("endTime", hour ? `${hour}:${min}` : "");
              }}
              className={`${inputCls(errors.endTime)} bg-white`}
            >
              <option value="">Hour</option>
              {Array.from({ length: 24 }, (_, i) => {
                const h = String(i).padStart(2, "0");
                return (
                  <option key={h} value={h}>
                    {h}
                  </option>
                );
              })}
            </select>
            <span className="text-gray-500 font-bold">:</span>
            <select
              value={form.endTime && form.endTime.includes(":") ? form.endTime.split(":")[1] : ""}
              onChange={(e) => {
                const min = e.target.value;
                const hour = form.endTime && form.endTime.includes(":") ? form.endTime.split(":")[0] : "12";
                setField("endTime", min ? `${hour}:${min}` : "");
              }}
              className={`${inputCls(errors.endTime)} bg-white`}
            >
              <option value="">Minute</option>
              {Array.from({ length: 60 }, (_, i) => {
                const m = String(i).padStart(2, "0");
                return (
                  <option key={m} value={m}>
                    {m}
                  </option>
                );
              })}
            </select>
          </div>
        </Field>
        <Field label="Total Hours Worked *" error={errors.totalHours}>
          <input
            type="text"
            value={form.totalHours}
            onChange={(e) => setField("totalHours", e.target.value)}
            placeholder="e.g. 8.5 or 8h"
            className={inputCls(errors.totalHours)}
          />
        </Field>
      </div>

      {/* Team / Position */}
      <Field label="Team / Position *" error={errors.teamPosition}>
        <div className="flex flex-wrap gap-2 mt-1">
          {TEAM_POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setField("teamPosition", pos)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                form.teamPosition === pos
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </Field>

      {/* Worked on tasks today? */}
      <Field label="Did you work on any task today? *">
        <div className="flex gap-3 mt-1">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setField("workedOnTasks", val)}
              className={`px-5 py-2 rounded-lg text-sm font-medium border transition ${
                form.workedOnTasks === val
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
              }`}
            >
              {val ? "Yes" : "No"}
            </button>
          ))}
        </div>
      </Field>

      {/* Task list */}
      {form.workedOnTasks && (
        <Field
          label="Tasks Worked On *"
          hint="Click the status badge to cycle: Pending → In Progress → Completed"
          error={errors.tasks}
        >
          <div className="space-y-2 mt-1">
            {form.tasks.map((task, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                {/* Status select dropdown */}
                <select
                  value={task.status}
                  onChange={(e) => updateTaskField(idx, "status", e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-700 font-medium transition"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {/* Description */}
                <input
                  type="text"
                  value={task.description}
                  onChange={(e) => updateTaskField(idx, "description", e.target.value)}
                  placeholder="Task description…"
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                {/* Remove row */}
                {form.tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTaskRow(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                    title="Remove task"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addTaskRow}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-1"
            >
              <Plus size={15} /> Add another task
            </button>
          </div>
        </Field>
      )}

      {/* Challenges / Issues */}
      <Field
        label="Challenges / Issues Faced"
        hint="Mention any blockers, errors, or difficulties you faced today."
      >
        <textarea
          rows={3}
          value={form.challengesIssues}
          onChange={(e) => setField("challengesIssues", e.target.value)}
          placeholder="e.g. Could not connect MongoDB Atlas due to firewall issue."
          className={`${inputCls()} resize-y`}
        />
      </Field>

      {/* Dependencies */}
      <Field
        label="Dependencies / Assistance Required"
        hint="List if you need help, approvals, or inputs from others."
      >
        <textarea
          rows={3}
          value={form.dependenciesAssistance}
          onChange={(e) => setField("dependenciesAssistance", e.target.value)}
          placeholder="e.g. Waiting for API endpoint from backend team."
          className={`${inputCls()} resize-y`}
        />
      </Field>

      {/* Planned for tomorrow */}
      <Field
        label="Planned Tasks for Tomorrow"
        hint="Write your plan in priority order."
      >
        <textarea
          rows={3}
          value={form.plannedTasksTomorrow}
          onChange={(e) => setField("plannedTasksTomorrow", e.target.value)}
          placeholder="e.g. Complete integration of login authentication."
          className={`${inputCls()} resize-y`}
        />
      </Field>

      {/* Additional notes */}
      <Field label="Additional Notes / Feedback">
        <textarea
          rows={2}
          value={form.additionalNotes}
          onChange={(e) => setField("additionalNotes", e.target.value)}
          placeholder="Any extra information, suggestions, or feedback."
          className={`${inputCls()} resize-y`}
        />
      </Field>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {existing && (
          <button
            type="button"
            onClick={() => { setEditMode(false); setErrors({}); }}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
        >
          {submitting ? "Saving…" : existing ? "Update Report" : "Submit Report"}
        </button>
      </div>
    </form>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mt-10 bg-white rounded-2xl shadow border border-gray-100">
      {/* Card header — always visible, click to collapse */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-6 py-4 rounded-2xl hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-indigo-600" />
          <div className="text-left">
            <p className="font-semibold text-gray-800">Daily Progress Report</p>
            <p className="text-xs text-gray-400">
              {existing && !editMode
                ? `Submitted for ${existing.date} · Click to expand`
                : "Fill this before 5 PM · One submission per day"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existing && !editMode && (
            <span className="text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full">
              ✓ Submitted
            </span>
          )}
          {!existing && !loading && (
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2.5 py-1 rounded-full">
              Pending
            </span>
          )}
          {collapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* Collapsible body */}
      {!collapsed && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading today's report…</p>
          ) : existing && !editMode ? (
            renderReadOnlySummary()
          ) : (
            renderForm()
          )}
        </div>
      )}
    </div>
  );
};

// ─── Module-scoped components & helpers ──────────────────────────────────────

const inputCls = (err) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
    err
      ? "border-red-400 focus:ring-red-300"
      : "border-gray-300 focus:ring-indigo-400"
  }`;

const Field = ({ label, hint, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const SummaryField = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-700">{value}</p>
  </div>
);

const SummaryBlock = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-sm text-gray-700 whitespace-pre-line">{value}</p>
  </div>
);

export default DailyProgressForm;