import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Trash2, FileDown } from "lucide-react";
import API from "../services/api";
import { hasAuthToken } from "../utils/authToken";
import {
  fetchPayrollsForPdf,
  downloadPayslipPdf,
  downloadDemoPayslipPdf,
  downloadAttendanceReportPdf,
  downloadLeaveReportPdf,
  downloadPerformanceReportPdf,
} from "../services/pdfApi";

const TYPE_STYLES = {
  attendance: "bg-blue-100 text-blue-700",
  leave: "bg-orange-100 text-orange-700",
  payroll: "bg-green-100 text-green-700",
  task: "bg-purple-100 text-purple-700",
  performance: "bg-amber-100 text-amber-700",
  system: "bg-gray-100 text-gray-700",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState("");
  const [pdfLoading, setPdfLoading] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");

  const fetchUnreadCount = useCallback(async () => {
    const res = await API.get("/notifications/unread-count");
    setUnreadCount(res.data?.data?.unreadCount ?? 0);
  }, []);

  const loadPayrolls = useCallback(async () => {
    if (!hasAuthToken()) {
      setPayrolls([]);
      setSelectedPayrollId("");
      return;
    }
    try {
      const list = await fetchPayrollsForPdf();
      setPayrolls(list);
      if (list.length > 0) {
        setSelectedPayrollId(list[0]._id);
      }
    } catch {
      setPayrolls([]);
      setSelectedPayrollId("");
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes] = await Promise.all([
        API.get("/notifications"),
        fetchUnreadCount(),
        loadPayrolls(),
      ]);
      setNotifications(listRes.data?.data ?? []);
    } catch (err) {
      const status = err.response?.status;
      let message =
        err.response?.data?.message ||
        err.message ||
        "Failed to load notifications";

      if (status === 401 && !hasAuthToken()) {
        message = "Please sign in to view your notifications.";
      } else if (status === 401) {
        message = "Your session has expired. Please sign in again.";
      }

      setError(message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUnreadCount, loadPayrolls]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handlePdfDownload = async (key, downloadFn) => {
    if (!hasAuthToken()) {
      setPdfMessage("Please sign in to download PDFs.");
      return;
    }

    setPdfLoading(key);
    setPdfMessage("");
    try {
      await downloadFn();
      setPdfMessage("PDF downloaded successfully. A new notification was added.");
      await fetchNotifications();
    } catch (err) {
      const status = err.response?.status;
      let message = err.message || "Failed to download PDF";
      if (status === 401) {
        message = "Session expired. Please sign in again.";
      } else if (status === 403) {
        message = "You are not authorized to download this report.";
      } else if (status === 404) {
        message = "Record not found.";
      }
      setPdfMessage(message);
    } finally {
      setPdfLoading("");
    }
  };

  const handleMarkAsRead = async (id) => {
    setActionId(id);
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to mark notification as read"
      );
    } finally {
      setActionId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionId("all");
    try {
      await API.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to mark all as read"
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionId(`delete-${id}`);
    try {
      await API.delete(`/notifications/${id}`);
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete notification"
      );
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 mt-1">
            Stay updated on attendance, leave, payroll, and more
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={actionId === "all"}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-medium transition"
          >
            <CheckCheck size={18} />
            {actionId === "all" ? "Updating..." : "Mark All as Read"}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Bell className="text-indigo-600" size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">Unread notifications</p>
          <p className="text-3xl font-bold text-gray-800">{unreadCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileDown className="text-indigo-600" size={22} />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Reports & PDF Downloads
            </h2>
            <p className="text-sm text-gray-500">
              Generate PDFs from the backend. Each download creates a notification.
            </p>
          </div>
        </div>

        {!hasAuthToken() && (
          <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
            <p className="font-medium">Sign in required for PDF downloads</p>
            <Link
              to="/login"
              className="inline-block mt-2 text-indigo-600 font-semibold hover:underline"
            >
              Go to Sign In
            </Link>
          </div>
        )}

        {pdfMessage && (
          <p
            className={`mb-4 text-sm rounded-xl px-4 py-3 ${
              pdfMessage.includes("successfully")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            {pdfMessage}
            {pdfMessage.toLowerCase().includes("sign in") && (
              <>
                {" "}
                <Link to="/login" className="font-semibold underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Payslip PDF</h3>
            {payrolls.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">
                No payroll in database. Use sample payslip or restart backend to
                auto-seed data.
              </p>
            ) : (
              <select
                value={selectedPayrollId}
                onChange={(e) => setSelectedPayrollId(e.target.value)}
                className="w-full mb-3 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {payrolls.map((p) => {
                  const emp = p.employee;
                  const name = emp
                    ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
                    : "Employee";
                  return (
                    <option key={p._id} value={p._id}>
                      {p.month || "—"} — {name || emp?.employeeId || p._id}
                    </option>
                  );
                })}
              </select>
            )}
            <div className="flex flex-col gap-2">
              {payrolls.length > 0 && (
                <button
                  type="button"
                  disabled={!selectedPayrollId || pdfLoading === "payslip"}
                  onClick={() =>
                    handlePdfDownload("payslip", () =>
                      downloadPayslipPdf(selectedPayrollId)
                    )
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  {pdfLoading === "payslip"
                    ? "Generating..."
                    : "Download Payslip"}
                </button>
              )}
              <button
                type="button"
                disabled={!hasAuthToken() || pdfLoading === "payslip-demo"}
                onClick={() =>
                  handlePdfDownload("payslip-demo", downloadDemoPayslipPdf)
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                {pdfLoading === "payslip-demo"
                  ? "Generating..."
                  : payrolls.length > 0
                    ? "Download Sample Payslip"
                    : "Download Payslip (Sample)"}
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Attendance Report
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Admin / HR / Manager only
              </p>
            </div>
            <button
              type="button"
              disabled={pdfLoading === "attendance"}
              onClick={() =>
                handlePdfDownload("attendance", downloadAttendanceReportPdf)
              }
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              {pdfLoading === "attendance"
                ? "Generating..."
                : "Download Attendance PDF"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Leave Report</h3>
              <p className="text-sm text-gray-500 mb-3">
                Admin / HR / Manager only
              </p>
            </div>
            <button
              type="button"
              disabled={pdfLoading === "leave"}
              onClick={() =>
                handlePdfDownload("leave", downloadLeaveReportPdf)
              }
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              {pdfLoading === "leave"
                ? "Generating..."
                : "Download Leave PDF"}
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Performance Report
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Admin / HR / Manager only
              </p>
            </div>
            <button
              type="button"
              disabled={pdfLoading === "performance"}
              onClick={() =>
                handlePdfDownload("performance", downloadPerformanceReportPdf)
              }
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              {pdfLoading === "performance"
                ? "Generating..."
                : "Download Performance PDF"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <p className="font-medium">{error}</p>
          {!hasAuthToken() && (
            <p className="text-sm mt-2 text-red-600">
              <Link
                to="/login"
                className="text-indigo-600 font-medium hover:underline"
              >
                Sign in to continue
              </Link>
            </p>
          )}
          <button
            type="button"
            onClick={fetchNotifications}
            className="mt-3 text-sm font-medium text-red-800 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
          Loading notifications...
        </div>
      ) : notifications.length === 0 && !error ? (
        <div className="bg-white rounded-2xl shadow p-12 text-center">
          <Bell className="mx-auto text-gray-300 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-700">
            No notifications yet
          </h2>
          <p className="text-gray-500 mt-2">
            When you receive updates, they will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notification) => {
            const isUnread = !notification.isRead;
            const busy =
              actionId === notification._id ||
              actionId === `delete-${notification._id}`;

            return (
              <li
                key={notification._id}
                className={`rounded-2xl shadow p-6 transition ${
                  isUnread
                    ? "bg-indigo-50 border-l-4 border-indigo-600"
                    : "bg-white border-l-4 border-transparent"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          TYPE_STYLES[notification.type] ||
                          TYPE_STYLES.system
                        }`}
                      >
                        {notification.type}
                      </span>
                      {isUnread && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                          Unread
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-lg font-semibold ${
                        isUnread ? "text-gray-900" : "text-gray-700"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 mt-2">{notification.message}</p>
                    <p className="text-sm text-gray-400 mt-3">
                      {notification.createdAt
                        ? format(
                            new Date(notification.createdAt),
                            "MMM d, yyyy · h:mm a"
                          )
                        : "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={busy}
                        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition"
                      >
                        {actionId === notification._id
                          ? "Saving..."
                          : "Mark as Read"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification._id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-xl transition"
                    >
                      <Trash2 size={16} />
                      {actionId === `delete-${notification._id}`
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
