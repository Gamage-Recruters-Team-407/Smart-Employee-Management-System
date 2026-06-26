import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, X, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const IssueReportingCard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isHRAdmin = ["HR", "Admin"].includes(user?.role);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isHRAdmin ? "/issues" : "/issues/my";
      const res = await API.get(endpoint);
      setIssues(res?.data ?? []);
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  }, [isHRAdmin]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setFileName(droppedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Issue title is required");
      return;
    }

    if (!formData.description.trim()) {
      setError("Issue description is required");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      if (file) {
        data.append("attachment", file);
      }

      await API.post("/issues/report", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Issue reported successfully!");
      setFormData({ title: "", description: "" });
      setFile(null);
      setFileName("");
      setTimeout(() => {
        setShowModal(false);
        setSuccess("");
        fetchIssues();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to report issue");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm("Are you sure you want to delete this issue?")) return;

    try {
      await API.delete(`/issues/${issueId}`);
      setSuccess("Issue deleted successfully");
      fetchIssues();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete issue");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={16} className="text-amber-600" />;
      case "In Review":
        return <AlertTriangle size={16} className="text-blue-600" />;
      case "Resolved":
        return <CheckCircle size={16} className="text-green-600" />;
      case "Closed":
        return <CheckCircle size={16} className="text-gray-600" />;
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
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const myIssues = issues.filter((i) => i.reportedBy?._id === user?._id);
  const otherIssues = issues.filter((i) => i.reportedBy?._id !== user?._id);

  return (
    <div className="mt-8 bg-white rounded-xl border shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-amber-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Report Issues</h3>
            <p className="text-sm text-gray-500">
              {isHRAdmin
                ? "View and manage all reported issues from employees"
                : "Report any issues you encounter"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          + Report Issue
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <IssueModal
          formData={formData}
          fileName={fileName}
          file={file}
          loading={loading}
          error={error}
          success={success}
          onChangeForm={handleChange}
          onChangeFile={handleFileChange}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setError("");
            setSuccess("");
            setFormData({ title: "", description: "" });
            setFile(null);
            setFileName("");
          }}
        />
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading issues...</p>
        ) : issues.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No issues reported yet</p>
        ) : (
          <>
            {/* My Issues (for all users) */}
            {myIssues.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">
                  My Issues ({myIssues.length})
                </h4>
                <div className="space-y-3">
                  {myIssues.map((issue) => (
                    <IssueItem
                      key={issue._id}
                      issue={issue}
                      isOwner={true}
                      onDelete={handleDelete}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Issues (for HR/Admin) */}
            {isHRAdmin && otherIssues.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">
                  All Other Issues ({otherIssues.length})
                </h4>
                <div className="space-y-3">
                  {otherIssues.map((issue) => (
                    <IssueItem
                      key={issue._id}
                      issue={issue}
                      isOwner={false}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Issue Modal Component
const IssueModal = ({
  formData,
  fileName,
  file,
  loading,
  error,
  success,
  onChangeForm,
  onChangeFile,
  onDragOver,
  onDrop,
  onSubmit,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Report an Issue</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={onChangeForm}
              placeholder="Brief title for the issue"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onChangeForm}
              placeholder="Detailed description of the issue"
              rows="4"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (Optional)
            </label>
            <div
              onDragOver={onDragOver}
              onDrop={onDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-amber-500 transition cursor-pointer bg-gray-50"
            >
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <FileText size={20} className="text-amber-600" />
                  <span className="text-sm">{fileName}</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  <p className="font-medium">Drag and drop a file</p>
                  <p className="text-xs">or click to browse</p>
                  <input
                    type="file"
                    onChange={onChangeFile}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block mt-2 text-amber-600 hover:text-amber-700 font-medium text-xs"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supported: PDF, JPG, PNG (Max 5MB)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition"
            >
              {loading ? "Submitting..." : "Report Issue"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Issue Item Component
const IssueItem = ({
  issue,
  isOwner,
  onDelete,
  getStatusIcon,
  getStatusColor,
}) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex-1">
          <h5 className="font-semibold text-gray-800">{issue.title}</h5>
          <p className="text-sm text-gray-500 mt-1">{issue.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(issue.status)}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(
              issue.status
            )}`}
          >
            {issue.status}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-3 border-t">
        <div className="flex items-center gap-4">
          <span>By: {issue.reporterName}</span>
          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
          {issue.attachment && (
            <a
              href={issue.attachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <FileText size={14} />
              Attachment
            </a>
          )}
        </div>
        {isOwner && issue.status === "Pending" && (
          <button
            onClick={() => onDelete(issue._id)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default IssueReportingCard;