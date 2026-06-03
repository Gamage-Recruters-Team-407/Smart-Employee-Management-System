import { useEffect, useState } from "react";
import axios from "axios";

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/leaves/my-leaves", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/leaves/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "text-green-600 bg-green-100";
      case "Rejected": return "text-red-600 bg-red-100";
      case "Cancelled": return "text-gray-600 bg-gray-100";
      default: return "text-yellow-600 bg-yellow-100";
    }
  };

  if (loading) return <p className="text-center py-4">Loading...</p>;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Leave History</h2>
      {leaves.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No leave requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Start Date</th>
                <th className="border border-gray-200 px-4 py-2 text-left">End Date</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Days</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Reason</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-200 px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-2">{leave.leaveType}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{leave.totalDays}</td>
                  <td className="border border-gray-200 px-4 py-2">{leave.reason}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">
                    {leave.status === "Pending" && (
                      <button
                        onClick={() => handleCancel(leave._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;