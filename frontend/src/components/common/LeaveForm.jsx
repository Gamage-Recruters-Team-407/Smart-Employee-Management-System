import { useState } from "react";
import axios from "axios";

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
      requestedDays = 0.5;
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
    const coveredByQuota = Math.min(requestedDays, remainingQuota);
    const extraDays = Math.max(0, requestedDays - coveredByQuota);
    const requiredWeekendCount = Math.ceil(extraDays);

    return { requestedDays, extraDays, requiredWeekendCount };
  };

  const durationInfo = calculateDurationInfo();

  const handleAddCoverDate = () => {
    setFormData((prev) => ({
      ...prev,
      weekendCoverDates: [...prev.weekendCoverDates, { date: "", notes: "" }],
    }));
  };

  const handleRemoveCoverDate = (idx) => {
    setFormData((prev) => ({
      ...prev,
      weekendCoverDates: prev.weekendCoverDates.filter((_, i) => i !== idx),
    }));
  };

  const handleCoverDateChange = (idx, field, value) => {
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
      if (formData.weekendCoverDates.length < durationInfo.requiredWeekendCount) {
        setError(`You have ${durationInfo.extraDays} extra day(s) beyond your 1 day/month allowance. You must provide at least ${durationInfo.requiredWeekendCount} weekend cover date(s) (Saturday or Sunday).`);
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
        const d = new Date(item.date);
        const day = d.getDay();
        if (day !== 0 && day !== 6) {
          setError(`Cover date #${i + 1} (${item.date}) is not a weekend. Extra days must be covered on Saturday or Sunday.`);
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

      onSuccess();
      onClose();
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
          {formData.startDate && (
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
                    <span className="font-medium text-amber-950">
                      Weekend Cover Dates ({formData.weekendCoverDates.length}/{durationInfo.requiredWeekendCount} required)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCoverDate}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-semibold"
                    >
                      + Add Weekend Date
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.weekendCoverDates.map((item, idx) => {
                      const d = item.date ? new Date(item.date) : null;
                      const dayIdx = d && !isNaN(d.getTime()) ? d.getDay() : null;
                      const isSat = dayIdx === 6;
                      const isSun = dayIdx === 0;
                      return (
                        <div key={idx} className="bg-white p-2 rounded border border-amber-200">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-medium text-gray-600">Cover #{idx + 1}</span>
                            {item.date && (
                              isSat || isSun ? (
                                <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                                  ✓ {isSat ? "Saturday" : "Sunday"}
                                </span>
                              ) : (
                                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                                  ⚠️ Must be Sat/Sun
                                </span>
                              )
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => handleCoverDateChange(idx, "date", e.target.value)}
                              required
                              className="border rounded px-2 py-1 text-xs flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCoverDate(idx)}
                              className="text-red-500 hover:text-red-700 text-xs px-1"
                            >
                              ✕
                            </button>
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
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
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
