import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const LeaveForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    leaveType: "Annual",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
    weekendCoverDates: [],
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [monthUsage, setMonthUsage] = useState({ usedDays: 0, remaining: 1.0 });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "startDate") {
      setFormData((prev) => ({
        ...prev,
        startDate: value,
        endDate: prev.isHalfDay ? value : prev.endDate,
      }));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleHalfDayToggle = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      isHalfDay: checked,
      endDate: checked ? prev.startDate : prev.endDate,
    }));
  };

  const calculateDurationInfo = () => {
    const { startDate, endDate, isHalfDay } = formData;
    if (!startDate) return { requestedDays: 0, extraDays: 0, requiredWeekendCount: 0 };

    let requestedDays = 0;
    if (isHalfDay) {
      requestedDays = 0; // Half day is not counted in monthly allowance policy
    } else {
      if (!endDate) {
        requestedDays = 1;
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
          requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        }
      }
    }

    const MONTHLY_LIMIT = 1.0;
    const remainingQuota = Math.max(0, MONTHLY_LIMIT - monthUsage.usedDays);
    const coveredByQuota = !isHalfDay ? Math.min(requestedDays, remainingQuota) : 0;
    const extraDays = !isHalfDay ? Math.max(0, requestedDays - coveredByQuota) : 0;
    const requiredWeekendCount = Math.ceil(extraDays);

    return { requestedDays, extraDays, requiredWeekendCount };
  };

  const durationInfo = calculateDurationInfo();

  // Helper to parse YYYY-MM-DD safely in local time without timezone shifts
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = String(dateStr).split("T")[0].split("-");
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  };

  // Helper to test if date string is Saturday or Sunday
  const isWeekendString = (dateStr) => {
    const d = parseLocalDate(dateStr);
    if (!d || isNaN(d.getTime())) return false;
    const day = d.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  const getDayNameString = (dateStr) => {
    const d = parseLocalDate(dateStr);
    if (!d || isNaN(d.getTime())) return "";
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames[d.getDay()];
  };

  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // Generate only upcoming Saturdays and Sundays (exclude past days of this month)
  const getAvailableWeekendDates = (startDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const base = startDateStr ? parseLocalDate(startDateStr) : today;
    const year = base && !isNaN(base.getTime()) ? base.getFullYear() : today.getFullYear();
    const month = base && !isNaN(base.getTime()) ? base.getMonth() : today.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 3, 0);

    const weekends = [];
    const curr = new Date(Math.max(today.getTime(), start.getTime()));

    while (curr <= end) {
      if (curr >= today) {
        const day = curr.getDay();
        if (day === 0 || day === 6) {
          const yyyy = curr.getFullYear();
          const mm = String(curr.getMonth() + 1).padStart(2, "0");
          const dd = String(curr.getDate()).padStart(2, "0");
          const dateStr = `${yyyy}-${mm}-${dd}`;
          const dayName = day === 6 ? "Saturday" : "Sunday";
          const formatted = curr.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const monthYear = curr.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          weekends.push({ date: dateStr, dayName, formatted, monthYear });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
    return weekends;
  };

  // Calculate ONLY valid, distinct weekend cover dates count
  const getValidCoverDatesCount = () => {
    const todayStr = getTodayStr();
    const seen = new Set();
    let count = 0;
    for (const item of formData.weekendCoverDates) {
      if (item.date && item.date >= todayStr && isWeekendString(item.date) && !seen.has(item.date)) {
        seen.add(item.date);
        count++;
      }
    }
    return count;
  };

  const validCoverDatesCount = getValidCoverDatesCount();

  // Automatically synchronize weekendCoverDates slots with requiredWeekendCount
  useEffect(() => {
    if (durationInfo.extraDays > 0) {
      if (formData.weekendCoverDates.length === 0) {
        setFormData((prev) => ({
          ...prev,
          weekendCoverDates: [{ date: "", notes: "", useCalendar: false }],
        }));
      } else if (formData.weekendCoverDates.length > durationInfo.requiredWeekendCount) {
        setFormData((prev) => ({
          ...prev,
          weekendCoverDates: prev.weekendCoverDates.slice(0, durationInfo.requiredWeekendCount),
        }));
      }
    } else if (durationInfo.extraDays === 0 && formData.weekendCoverDates.length > 0) {
      setFormData((prev) => ({
        ...prev,
        weekendCoverDates: [],
      }));
    }
  }, [formData.startDate, formData.endDate, formData.isHalfDay, durationInfo.extraDays, durationInfo.requiredWeekendCount]);

  const handleAddCoverDate = () => {
    if (formData.weekendCoverDates.length >= durationInfo.requiredWeekendCount) {
      toast.error(`You can only add up to ${durationInfo.requiredWeekendCount} weekend cover date(s) for your ${durationInfo.extraDays} extra day(s).`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      weekendCoverDates: [...prev.weekendCoverDates, { date: "", notes: "", useCalendar: false }],
    }));
  };

  const handleRemoveCoverDate = (idx) => {
    setFormData((prev) => ({
      ...prev,
      weekendCoverDates: prev.weekendCoverDates.filter((_, i) => i !== idx),
    }));
  };

  const handleCoverDateChange = (idx, field, value) => {
    if (field === "date") {
      if (value) {
        const todayStr = getTodayStr();
        if (value < todayStr) {
          toast.error(`Invalid Selection: ${value} is in the past.\n\nCover dates cannot be in the past.`, {
            duration: 4500,
            icon: "⚠️",
          });
          setFormData((prev) => {
            const updated = [...prev.weekendCoverDates];
            updated[idx] = { ...updated[idx], date: "" };
            return { ...prev, weekendCoverDates: updated };
          });
          return;
        }

        if (!isWeekendString(value)) {
          const dayName = getDayNameString(value);
          toast.error(`Invalid Selection: ${dayName} (${value}) is a weekday.\n\nCover dates can ONLY be selected on a Saturday or Sunday.`, {
            duration: 5000,
            icon: "⚠️",
          });
          setFormData((prev) => {
            const updated = [...prev.weekendCoverDates];
            updated[idx] = { ...updated[idx], date: "" };
            return { ...prev, weekendCoverDates: updated };
          });
          return;
        }

        const duplicateIdx = formData.weekendCoverDates.findIndex((c, i) => i !== idx && c.date === value);
        if (duplicateIdx !== -1) {
          toast.error(`The date ${value} is already chosen for Cover Date #${duplicateIdx + 1}.\n\nPlease choose a different Saturday or Sunday.`, {
            duration: 4500,
          });
          setFormData((prev) => {
            const updated = [...prev.weekendCoverDates];
            updated[idx] = { ...updated[idx], date: "" };
            return { ...prev, weekendCoverDates: updated };
          });
          return;
        }
      }
    }

    setFormData((prev) => {
      const updated = [...prev.weekendCoverDates];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, weekendCoverDates: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (durationInfo.extraDays > 0) {
      if (validCoverDatesCount < durationInfo.requiredWeekendCount) {
        setError(`You have ${durationInfo.extraDays} extra day(s) beyond your 1 day/month allowance. You must provide ${durationInfo.requiredWeekendCount} valid weekend cover date(s) (Saturday or Sunday). Currently valid: ${validCoverDatesCount}/${durationInfo.requiredWeekendCount}.`);
        setLoading(false);
        return;
      }

      const seen = new Set();
      for (let i = 0; i < formData.weekendCoverDates.length; i++) {
        const item = formData.weekendCoverDates[i];
        if (!item.date) {
          setError(`Please select a date for weekend cover entry #${i + 1}.`);
          setLoading(false);
          return;
        }
        if (!isWeekendString(item.date)) {
          const dayName = getDayNameString(item.date);
          setError(`Cover date #${i + 1} (${item.date}) is a ${dayName}. Extra days must be covered on Saturday or Sunday.`);
          setLoading(false);
          return;
        }
        if (seen.has(item.date)) {
          setError(`Cover date ${item.date} is selected more than once.`);
          setLoading(false);
          return;
        }
        seen.add(item.date);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      data.append("leaveType", formData.leaveType);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.isHalfDay ? formData.startDate : formData.endDate);
      data.append("reason", formData.reason);
      data.append("isHalfDay", formData.isHalfDay);
      if (durationInfo.extraDays > 0 && formData.weekendCoverDates.length > 0) {
        data.append("weekendCoverDates", JSON.stringify(formData.weekendCoverDates));
      }
      if (file) data.append("medicalDocument", file);

      await axios.post("http://localhost:5000/api/leaves/apply", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Leave application submitted successfully!");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Apply New Leave</h2>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Leave Type</label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option>Annual</option>
              <option>Sick</option>
              <option>Casual</option>
              <option>Maternity</option>
              <option>Paternity</option>
              <option>Unpaid</option>
            </select>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="isHalfDay"
              name="isHalfDay"
              checked={formData.isHalfDay}
              onChange={handleHalfDayToggle}
              className="h-4 w-4"
            />
            <label htmlFor="isHalfDay" className="text-sm font-medium">
              Half Day Leave
            </label>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.isHalfDay ? formData.startDate : formData.endDate}
              onChange={handleChange}
              disabled={formData.isHalfDay}
              className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Monthly 1-day allowance indicator & weekend cover */}
          {!formData.isHalfDay && formData.startDate && (
            <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
              <div className="font-semibold text-amber-900 mb-1">
                Policy: 1 Leave Day / Month Allowed
              </div>
              {durationInfo.extraDays > 0 ? (
                <div>
                  <p className="text-amber-800 mb-2">
                    ⚠️ You are requesting <strong>{durationInfo.extraDays} extra day(s)</strong>. These must be covered on a <strong>Saturday or Sunday</strong>.
                  </p>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-amber-950">
                        Weekend Cover Dates ({validCoverDatesCount}/{durationInfo.requiredWeekendCount} required)
                      </span>
                      {validCoverDatesCount >= durationInfo.requiredWeekendCount ? (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                          ✓ Complete
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          {durationInfo.requiredWeekendCount - validCoverDatesCount} needed
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCoverDate}
                      disabled={formData.weekendCoverDates.length >= durationInfo.requiredWeekendCount}
                      className={`px-2 py-1 rounded text-xs font-semibold transition ${
                        formData.weekendCoverDates.length >= durationInfo.requiredWeekendCount
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                      title={
                        formData.weekendCoverDates.length >= durationInfo.requiredWeekendCount
                          ? `Maximum ${durationInfo.requiredWeekendCount} cover date(s) allowed for ${durationInfo.extraDays} extra day(s)`
                          : 'Add another weekend cover date'
                      }
                    >
                      + Add Weekend Date
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.weekendCoverDates.map((item, idx) => {
                      const d = parseLocalDate(item.date);
                      const dayIdx = d && !isNaN(d.getTime()) ? d.getDay() : null;
                      const isSat = dayIdx === 6;
                      const isSun = dayIdx === 0;
                      const isValidWeekend = isSat || isSun;

                      const availableWeekends = getAvailableWeekendDates(formData.startDate);
                      const hasInList = availableWeekends.some((w) => w.date === item.date);

                      return (
                        <div key={idx} className="bg-white p-2.5 rounded border border-amber-200 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-medium text-gray-700">Cover #{idx + 1}</span>
                            <div className="flex items-center gap-1.5">
                              {item.date && (
                                isValidWeekend ? (
                                  <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                                    ✓ {isSat ? "Saturday" : "Sunday"}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                    ⚠️ Must be Sat/Sun
                                  </span>
                                )
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const updated = [...prev.weekendCoverDates];
                                    updated[idx] = { ...updated[idx], useCalendar: !updated[idx].useCalendar };
                                    return { ...prev, weekendCoverDates: updated };
                                  });
                                }}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                              >
                                {item.useCalendar ? "📋 Sat/Sun List" : "📅 Calendar"}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            {item.useCalendar ? (
                              <input
                                type="date"
                                value={item.date}
                                min={getTodayStr()}
                                onChange={(e) => handleCoverDateChange(idx, "date", e.target.value)}
                                required
                                className={`border rounded px-2 py-1 text-xs flex-1 ${
                                  item.date && isValidWeekend ? "border-green-400 bg-green-50/20" : "border-gray-300"
                                }`}
                              />
                            ) : (
                              <select
                                value={item.date}
                                onChange={(e) => handleCoverDateChange(idx, "date", e.target.value)}
                                required
                                className={`border rounded px-2 py-1 text-xs flex-1 ${
                                  item.date && isValidWeekend ? "border-green-400 bg-green-50/20 text-gray-900 font-medium" : "border-gray-300 text-gray-700"
                                }`}
                              >
                                <option value="">-- Choose Saturday or Sunday --</option>
                                {item.date && !hasInList && isValidWeekend && (
                                  <option value={item.date}>
                                    {isSat ? "Sat" : "Sun"}, {item.date}
                                  </option>
                                )}
                                {Object.entries(
                                  availableWeekends.reduce((groups, w) => {
                                    groups[w.monthYear] = groups[w.monthYear] || [];
                                    groups[w.monthYear].push(w);
                                    return groups;
                                  }, {})
                                ).map(([monthYear, dates]) => (
                                  <optgroup key={monthYear} label={monthYear}>
                                    {dates.map((w) => (
                                      <option key={w.date} value={w.date}>
                                        {w.formatted}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveCoverDate(idx)}
                              className="text-red-500 hover:text-red-700 text-xs px-1"
                              title="Remove slot"
                            >
                              ✕
                            </button>
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Tasks to cover on this weekend (optional)..."
                              value={item.notes || ""}
                              onChange={(e) => handleCoverDateChange(idx, "notes", e.target.value)}
                              className="w-full border rounded px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-green-700 font-medium">
                  ✓ Within 1 day allowance for this month.
                </div>
              )}
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows="3"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Medical Document (Optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || (durationInfo.extraDays > 0 && validCoverDatesCount < durationInfo.requiredWeekendCount)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-2 rounded transition"
              title={
                durationInfo.extraDays > 0 && validCoverDatesCount < durationInfo.requiredWeekendCount
                  ? `Please select ${durationInfo.requiredWeekendCount - validCoverDatesCount} more valid weekend cover date(s) to submit`
                  : "Apply Leave"
              }
            >
              {loading ? "Submitting..." : "Apply Leave"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;
