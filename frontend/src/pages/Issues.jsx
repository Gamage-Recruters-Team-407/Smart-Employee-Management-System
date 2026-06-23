import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  FileText,
  User,
  RefreshCw,
} from "lucide-react";

const Issues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });

  const [statusUpdate, setStatusUpdate] = useState({
    status: "Pending",
    reviewNote: "",
    priority: "Medium",
  });

  // Check authorization
  useEffect(() => {
    if (!["HR", "Admin"].includes(user?.role)) {
      setError("Not authorized to access this page");
    }
  }, [user?.role]);

  // Fetch issues and stats
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const res = await API.get("/issues", { params });
      setIssues(res?.data ?? []);

      // Fetch stats
      const statsRes = await API.get("/issues/stats");
      setStats(statsRes?.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleStatusUpdate = async () => {
    if (!selectedIssue) return;

    setLoading(true);
    try {
      await API.patch(`/issues/${selectedIssue._id}/status`, statusUpdate);
      setSuccess("Issue status updated successfully");
      setTimeout(() => {
        setSuccess("");
        setShowModal(false);
        fetchIssues();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update issue");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={20} className="text-amber-600" />;
      case "In Review":
        return <AlertTriangle size={20} className="text-blue-600" />;
      case "Resolved":
        return <CheckCircle size={20} className="text-green-600" />;
      case "Closed":
        return <CheckCircle size={20} className="text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "In Review":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Resolved":
        return "bg-green-50 text-green-700 border-green-200";
      case "Closed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "High":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "";
    }
  };

  if (!["HR", "Admin"].includes(user?.role)) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <AlertCircle size={24} className="mb-3" />
          <p className="font-semibold">Access Denied</p>
          <p className="text-sm mt-1">
            Only HR and Admin users can access the Issues management page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <AlertCircle size={32} className="text-amber-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Issues Management</h1>
            <p className="text-gray-500 mt-1">
              View, review, and manage all reported issues from employees
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchIssues}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition bg-white text-gray-700 shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total"
            value={stats.total}
            color="bg-indigo-50 text-indigo-700"
          />
          <StatCard
            label="Pending"
            value={stats.byStatus.pending}
            color="bg-amber-50 text-amber-700"
          />
          <StatCard
            label="In Review"
            value={stats.byStatus.inReview}
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="Resolved"
            value={stats.byStatus.resolved}
            color="bg-green-50 text-green-700"
          />
          <StatCard
            label="Closed"
            value={stats.byStatus.closed}
            color="bg-gray-50 text-gray-700"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Priority</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      {/* Issues List */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading issues...</div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No issues found</p>
          </div>
        ) : (
          <div className="divide-y">
            {issues.map((issue) => (
              <div key={issue._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {issue.title}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm">{issue.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>{issue.reporterName}</span>
                  </div>
                  <span>•</span>
                  <span>{issue.reporterRole}</span>
                  <span>•</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  {issue.priority && (
                    <>
                      <span>•</span>
                      <span
                        className={`px-2.5 py-0.5 rounded border font-medium ${getPriorityColor(
                          issue.priority
                        )}`}
                      >
                        {issue.priority}
                      </span>
                    </>
                  )}
                </div>

                {issue.reviewNote && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                    <p className="text-sm">
                      <span className="font-medium text-blue-900">Review Note:</span>
                      <span className="text-blue-800 ml-2">{issue.reviewNote}</span>
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  {issue.attachment && (
                    <a
                      href={`http://localhost:5000/${issue.attachment}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
                    >
                      <FileText size={16} />
                      View Attachment
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedIssue(issue);
                      setStatusUpdate({
                        status: issue.status,
                        reviewNote: issue.reviewNote || "",
                        priority: issue.priority || "Medium",
                      });
                      setShowModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Update Issue Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue: {selectedIssue.title}
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) =>
                    setStatusUpdate({ ...statusUpdate, status: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={statusUpdate.priority}
                  onChange={(e) =>
                    setStatusUpdate({ ...statusUpdate, priority: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Note
                </label>
                <textarea
                  value={statusUpdate.reviewNote}
                  onChange={(e) =>
                    setStatusUpdate({
                      ...statusUpdate,
                      reviewNote: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Add a review note..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition"
                >
                  {loading ? "Updating..." : "Update"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className={`rounded-xl p-4 ${color}`}>
    <p className="text-sm opacity-80">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default Issues;