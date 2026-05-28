import { useState } from "react";
import axios from "axios";

const LeaveForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    leaveType: "Annual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      data.append("leaveType", formData.leaveType);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("reason", formData.reason);
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
              value={formData.endDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
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