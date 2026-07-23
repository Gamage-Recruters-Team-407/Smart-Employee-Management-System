import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const fetchLeavesRef = useRef(null);

  // ─── FETCH LEAVES ──────────────────────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        if (isMountedRef.current) {
          setError("Please login to view your leave history");
          setLoading(false);
        }
        return;
      }

      const res = await axios.get("http://localhost:5000/api/leaves/my-leaves", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (isMountedRef.current) {
        setLeaves(res.data || []);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      if (isMountedRef.current) {
        setError(err.response?.data?.message || "Failed to load leave history");
        setLeaves([]);
        setLoading(false);
      }
    }
  }, []);

  // Store ref to fetchLeaves for use in effects
  useEffect(() => {
    fetchLeavesRef.current = fetchLeaves;
  }, [fetchLeaves]);

  // ─── CANCEL LEAVE ──────────────────────────────────────────────────────────
  const handleCancel = useCallback(async (id) => {
    if (!isMountedRef.current) return;
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (!token) {
        if (isMountedRef.current) {
          setError("Please login to cancel leave requests");
        }
        return;
      }

      await axios.put(`http://localhost:5000/api/leaves/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh the list after cancellation
      if (isMountedRef.current && fetchLeavesRef.current) {
        await fetchLeavesRef.current();
      }
    } catch (err) {
      console.error("Failed to cancel leave:", err);
      if (isMountedRef.current) {
        setError(err.response?.data?.message || "Failed to cancel leave request");
      }
    }
  }, []);

  // ─── EFFECT: INITIAL FETCH ──────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    
    // Use setTimeout to move setState out of the effect's synchronous flow
    const timerId = setTimeout(() => {
      if (isMountedRef.current && fetchLeavesRef.current) {
        fetchLeavesRef.current();
      }
    }, 0);
    
    return () => {
      clearTimeout(timerId);
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array - only runs once on mount

  // ─── GET STATUS COLOR ──────────────────────────────────────────────────
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "text-green-600 bg-green-100";
      case "Rejected": return "text-red-600 bg-red-100";
      case "Cancelled": return "text-gray-600 bg-gray-100";
      default: return "text-yellow-600 bg-yellow-100";
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading leave history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Leave History</h2>
        <span className="text-sm text-gray-500">
          {leaves.length} {leaves.length === 1 ? 'request' : 'requests'} found
        </span>
      </div>

      {leaves.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500">No leave requests found.</p>
          <p className="text-sm text-gray-400 mt-1">Apply for a leave to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {leave.leaveType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 text-center">
                    {leave.totalDays}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {leave.reason || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(leave.status)}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === "Pending" && (
                      <button
                        onClick={() => handleCancel(leave._id)}
                        className="text-red-600 hover:text-red-700 hover:underline text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {leave.status !== "Pending" && (
                      <span className="text-gray-400 text-sm">—</span>
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