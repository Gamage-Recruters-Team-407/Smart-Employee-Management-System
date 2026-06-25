import React, { useCallback, useEffect, useState, memo, useRef } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Mail,
  X,
  Search,
  Activity,
  CalendarDays,
  FileText,
  BarChart3,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Download,
  Filter,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import API from "../services/api";
import { hasAuthToken } from "../utils/authToken";
import { useAuth } from "../context/AuthContext";
import { useBadges } from "../context/BadgeContext";
import heroImg from "../assets/hero_abstract.png";

import {
  downloadPayslipPdf,
  downloadAttendanceReportPdf,
  downloadLeaveReportPdf,
  downloadPerformanceReportPdf,
} from "../services/pdfApi";

const TYPE_STYLES = {
  attendance: "bg-blue-50 text-blue-700 border-blue-200/50",
  leave: "bg-orange-50 text-orange-700 border-orange-200/50",
  payroll: "bg-green-50 text-green-700 border-green-200/50",
  task: "bg-purple-50 text-purple-700 border-purple-200/50",
  performance: "bg-amber-50 text-amber-700 border-amber-200/50",
  system: "bg-gray-50 text-gray-700 border-gray-200/50",
};

const TYPE_ICONS = {
  attendance: <CalendarDays size={16} className="text-blue-600" />,
  leave: <Activity size={16} className="text-orange-600" />,
  payroll: <FileText size={16} className="text-green-600" />,
  performance: <BarChart3 size={16} className="text-amber-600" />,
  system: <AlertCircle size={16} className="text-gray-600" />,
  task: <CheckCircle2 size={16} className="text-purple-600" />,
};

const normalizeRole = (role) => String(role || "").trim();

const sameId = (a, b) => {
  if (!a || !b) return false;
  return String(a) === String(b);
};

const getUserId = (user) => {
  return user?._id || user?.id || user?.userId || "";
};

const getUserEmployeeId = (user) => {
  return (
    user?.employee?._id ||
    user?.employee ||
    user?.employeeId?._id ||
    user?.employeeId ||
    ""
  );
};

const getPayrollEmployeeId = (payroll) => {
  return payroll?.employee?._id || payroll?.employee || "";
};

const getPayrollEmployeeUserId = (payroll) => {
  return payroll?.employee?.userId?._id || payroll?.employee?.userId || "";
};

const getPayrollEmployeeEmail = (payroll) => {
  return String(payroll?.employee?.email || "").toLowerCase().trim();
};

const getUserEmail = (user) => {
  return String(user?.email || "").toLowerCase().trim();
};

const filterPayrollsForLoggedUser = (payrollList, user) => {
  const list = Array.isArray(payrollList) ? payrollList : [];

  const loggedRole = normalizeRole(user?.role);
  const loggedUserId = getUserId(user);
  const loggedEmployeeId = getUserEmployeeId(user);
  const loggedEmail = getUserEmail(user);

  if (loggedRole === "Admin") {
    return list;
  }

  if (loggedRole === "HR") {
    return list.filter((payroll) => normalizeRole(payroll?.role) !== "Admin");
  }

  if (loggedRole === "Employee" || loggedRole === "Manager") {
    return list.filter((payroll) => {
      const payrollEmployeeId = getPayrollEmployeeId(payroll);
      const payrollEmployeeUserId = getPayrollEmployeeUserId(payroll);
      const payrollEmployeeEmail = getPayrollEmployeeEmail(payroll);

      if (loggedEmployeeId && payrollEmployeeId) {
        return sameId(payrollEmployeeId, loggedEmployeeId);
      }

      if (loggedUserId && payrollEmployeeUserId) {
        return sameId(payrollEmployeeUserId, loggedUserId);
      }

      if (loggedEmail && payrollEmployeeEmail) {
        return payrollEmployeeEmail === loggedEmail;
      }

      return false;
    });
  }

  return [];
};

const TiltCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    setRotateX(-(mouseY / height) * 2);
    setRotateY((mouseX / width) * 2);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY, y: rotateX !== 0 ? -2 : 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`group relative bg-white border border-zinc-200 rounded-xl p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-300 flex flex-col justify-between ${className}`}
    >
      <div className="w-full h-full flex flex-col justify-between flex-1">
        {children}
      </div>
    </motion.div>
  );
};

const NotificationItem = memo(
  ({ notification, actionId, handleMarkAsRead, handleDelete }) => {
    const isUnread = !notification.isRead;
    const busy =
      actionId === notification._id || actionId === `delete-${notification._id}`;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`group relative p-4 rounded-2xl border transition-all duration-200 ${
          isUnread
            ? "bg-white border-indigo-100 shadow-sm shadow-indigo-500/5 hover:border-indigo-200"
            : "bg-zinc-50/50 border-zinc-100 hover:bg-white hover:border-zinc-200"
        }`}
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                TYPE_STYLES[notification.type] || TYPE_STYLES.system
              }`}
            >
              {TYPE_ICONS[notification.type] || TYPE_ICONS.system}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1 gap-2">
              <h4
                className={`text-[15px] font-semibold truncate transition-colors ${
                  isUnread
                    ? "text-zinc-900"
                    : "text-zinc-600 group-hover:text-zinc-900"
                }`}
              >
                {notification.title}
              </h4>

              <span className="text-[12px] text-zinc-400 whitespace-nowrap flex-shrink-0">
                {notification.createdAt
                  ? format(new Date(notification.createdAt), "MMM d, h:mm a")
                  : "—"}
              </span>
            </div>

            <p className="text-[13.5px] text-zinc-500 leading-relaxed line-clamp-2 mb-2">
              {notification.message}
            </p>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {isUnread && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(notification._id)}
                  disabled={busy}
                  className="flex items-center gap-1 text-[14px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors border border-indigo-100/50"
                >
                  <CheckCheck size={14} />
                  Mark Read
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(notification._id)}
                disabled={busy}
                className="flex items-center gap-1 text-[14px] font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg transition-colors border border-red-100/50"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>

          {isUnread && (
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
          )}
        </div>
      </motion.div>
    );
  }
);

const HeroSection = ({
  unreadCount,
  emailStatus,
  setIsDrawerOpen,
  handleMarkAllAsRead,
  actionId,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-2xl bg-[#F8F9FB] border border-zinc-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={heroImg}
          alt=""
          className="w-full h-full object-cover object-center mix-blend-multiply opacity-80"
        />
      </div>

      <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-8 z-10 min-h-[260px]">
        <div className="max-w-xl flex flex-col justify-between h-full">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-zinc-200 text-[11.5px] font-medium uppercase text-zinc-500 mb-5 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
              Operational Feed
            </div>

            <h1 className="text-[26px] font-semibold text-zinc-900 tracking-tight mb-3 leading-none">
              Notifications
            </h1>

            <p className="text-[13.5px] text-zinc-500 leading-relaxed mb-8 max-w-[380px]">
              Stay up to date on attendance, leave, payroll and system alerts
              with a calm, enterprise grade overview.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <Bell size={14} className="text-[#635BFF]" />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[12px] text-zinc-400 uppercase leading-none mb-1">
                  Unread
                </span>
                <span className="text-[15px] font-semibold text-zinc-900 leading-none">
                  {unreadCount}
                </span>
              </div>
            </div>

            {emailStatus && (
              <div className="flex items-center px-4 py-2.5 rounded-full bg-white border border-emerald-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-[11.5px] font-medium text-emerald-600">
                  Email alerts {emailStatus.emailEnabled ? "enabled" : "disabled"}
                </span>
              </div>
            )}

            <div className="flex items-center px-4 py-2.5 rounded-full bg-white border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[11.5px] font-medium text-zinc-700">
                {hasAuthToken() ? "Authenticated session" : "Session Expired"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-end mt-4 md:mt-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center bg-white border border-zinc-200 px-5 py-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-zinc-300 transition-all h-[64px]"
          >
            <span className="text-[12px] text-zinc-400 uppercase mb-1">
              System
            </span>
            <span className="text-[14px] font-medium text-zinc-900 leading-none">
              Notification center
            </span>
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={actionId === "all" || unreadCount === 0}
            className="bg-[#635BFF] hover:bg-[#4A42DD] text-white px-5 rounded-2xl text-[14px] font-medium transition-colors shadow-[0_2px_4px_rgba(99,91,255,0.2)] disabled:opacity-50 flex items-center justify-center h-[64px]"
          >
            {actionId === "all" ? "Updating..." : "Quick action"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ReportsPanel = ({
  payrolls,
  selectedPayrollId,
  setSelectedPayrollId,
  pdfLoading,
  handlePdfDownload,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 lg:p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[18px] font-semibold text-zinc-900">
            Document Hub
          </h2>
          <p className="text-[13.5px] text-zinc-500 leading-relaxed mt-1">
            Securely access your operational logs and payroll documents.
          </p>
        </div>
      </div>

      {!hasAuthToken() && (
        <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
          <p className="text-[13.5px] text-zinc-500 leading-relaxed flex items-center gap-2">
            <AlertCircle size={16} className="text-zinc-400" />
            Sign in is required for secure PDF compilation.
          </p>
          <Link
            to="/login"
            className="text-[14px] font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
          >
            Sign In &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TiltCard>
          <div className="h-full flex flex-col justify-between">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                  <FileText size={16} className="text-zinc-700" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-zinc-900 leading-none">
                    Monthly Payslip
                  </h3>
                  <p className="text-[12px] text-zinc-400 mt-1">
                    Payroll Service
                  </p>
                </div>
              </div>

              {payrolls.length === 0 ? (
                <p className="text-[13.5px] text-zinc-500 leading-relaxed mt-2">
                  No active payrolls found.
                </p>
              ) : (
                <div className="relative mt-2">
                  <select
                    value={selectedPayrollId}
                    onChange={(e) => setSelectedPayrollId(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[14px] text-zinc-900 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] transition-all appearance-none cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                  >
                    {payrolls.map((p) => {
                      const emp = p.employee;
                      const name = emp
                        ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
                        : "Employee";

                      return (
                        <option key={p._id} value={p._id}>
                          {p.month || "—"} ·{" "}
                          {name || emp?.employeeId || p._id} ·{" "}
                          {p.role || "No Role"}
                        </option>
                      );
                    })}
                  </select>

                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-auto pt-2">
              {payrolls.length > 0 && (
                <button
                  type="button"
                  disabled={!selectedPayrollId || pdfLoading === "payslip"}
                  onClick={() =>
                    handlePdfDownload("payslip", () =>
                      downloadPayslipPdf(
                        payrolls.find((p) => p._id === selectedPayrollId)
                      )
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors shadow-sm hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50"
                >
                  <Download size={14} />
                  {pdfLoading === "payslip"
                    ? "Downloading..."
                    : "Download Payslip"}
                </button>
              )}
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <CalendarDays size={16} className="text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-zinc-900 leading-none">
                      Attendance Log
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-1">
                      Timesheet compilation
                    </p>
                  </div>
                </div>
                <span className="text-[11.5px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                  Admin
                </span>
              </div>
              <p className="text-[13.5px] text-zinc-500 leading-relaxed mb-6">
                Compile exhaustive monthly check-in logs, total operational
                hours, and exceptions.
              </p>
            </div>

            <button
              type="button"
              disabled={pdfLoading === "attendance"}
              onClick={() =>
                handlePdfDownload("attendance", downloadAttendanceReportPdf)
              }
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-[14px] font-medium transition-all disabled:opacity-50"
            >
              <Download size={14} />
              {pdfLoading === "attendance"
                ? "Compiling..."
                : "Download Full PDF"}
            </button>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <Activity size={16} className="text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-zinc-900 leading-none">
                      Leave Balance
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-1">
                      Leave Analytics
                    </p>
                  </div>
                </div>
                <span className="text-[11.5px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                  Admin
                </span>
              </div>
              <p className="text-[13.5px] text-zinc-500 leading-relaxed mb-6">
                Detailed ledger summaries showing balance increments, pending
                approvals, and requests.
              </p>
            </div>

            <button
              type="button"
              disabled={pdfLoading === "leave"}
              onClick={() => handlePdfDownload("leave", downloadLeaveReportPdf)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-[14px] font-medium transition-all disabled:opacity-50"
            >
              <Download size={14} />
              {pdfLoading === "leave" ? "Compiling..." : "Download Full PDF"}
            </button>
          </div>
        </TiltCard>

        <TiltCard>
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <BarChart3 size={16} className="text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-zinc-900 leading-none">
                      Performance Index
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-1">
                      Appraisal Ledger
                    </p>
                  </div>
                </div>
                <span className="text-[11.5px] font-medium bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                  Admin
                </span>
              </div>
              <p className="text-[13.5px] text-zinc-500 leading-relaxed mb-6">
                Aggregate indices, goals metrics, peer-review progress, and
                standard benchmark scores.
              </p>
            </div>

            <button
              type="button"
              disabled={pdfLoading === "performance"}
              onClick={() =>
                handlePdfDownload("performance", downloadPerformanceReportPdf)
              }
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-[14px] font-medium transition-all disabled:opacity-50"
            >
              <Download size={14} />
              {pdfLoading === "performance"
                ? "Compiling..."
                : "Download Full PDF"}
            </button>
          </div>
        </TiltCard>
      </div>
    </motion.div>
  );
};

const RecentNotifications = ({
  loading,
  recentNotifications,
  unreadCount,
  setIsDrawerOpen,
  actionId,
  handleMarkAsRead,
  handleDelete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="bg-white rounded-3xl border border-zinc-200/80 shadow-md shadow-zinc-100/50 p-6 flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-zinc-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50/50 border border-indigo-100/20 flex items-center justify-center">
            <Bell size={15} className="text-indigo-600" />
          </div>
          Recent Activity
        </h2>

        {unreadCount > 0 && (
          <span className="bg-indigo-100/70 border border-indigo-200 text-indigo-700 text-[11.5px] font-medium px-2.5 py-0.5 rounded-full uppercase animate-pulse">
            {unreadCount} NEW
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-[13.5px] text-zinc-500 leading-relaxed">
            Refreshing database...
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-3 border border-zinc-100/80">
              <CheckCheck size={20} className="text-indigo-500" />
            </div>
            <p className="text-[15px] font-semibold text-zinc-900">
              You're fully up-to-date!
            </p>
            <p className="text-[13.5px] text-zinc-500 leading-relaxed mt-1 max-w-[150px]">
              No new diagnostic alerts require immediate input.
            </p>
          </div>
        ) : (
          recentNotifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              actionId={actionId}
              handleMarkAsRead={handleMarkAsRead}
              handleDelete={handleDelete}
            />
          ))
        )}
      </div>

      <button
        onClick={() => setIsDrawerOpen(true)}
        className="w-full flex items-center justify-center gap-2 text-[14px] font-medium text-zinc-700 hover:text-indigo-600 bg-zinc-50 hover:bg-indigo-50/60 border border-zinc-200/80 py-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
      >
        See all notifications
        <ArrowRight size={14} className="text-zinc-400" />
      </button>
    </motion.div>
  );
};

const EmailStatusCard = ({
  emailStatus,
  emailActionMsg,
  canTestEmail,
  handleSendTestEmail,
  emailLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="bg-white rounded-3xl border border-zinc-200/80 shadow-md shadow-zinc-100/50 p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-zinc-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50/50 border border-indigo-100/20 flex items-center justify-center">
            <Mail size={15} className="text-indigo-600" />
          </div>
          Email Status
        </h2>

        {emailStatus?.emailEnabled ? (
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/40">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SMTP CONNECTED
          </span>
        ) : (
          <span className="text-[11.5px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
            INACTIVE
          </span>
        )}
      </div>

      {emailStatus && (
        <div className="space-y-3 bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100/80 shadow-inner">
          <div className="flex justify-between items-center text-[13.5px] text-zinc-500 leading-relaxed">
            <span>Email Alerts</span>
            <span className="text-[14px] font-medium text-zinc-900">
              {emailStatus.emailEnabled ? "Active" : "Disabled"}
            </span>
          </div>

          <div className="flex justify-between items-center text-[13.5px] text-zinc-500 leading-relaxed">
            <span>SMTP Credentials</span>
            <span className="text-[14px] font-medium text-zinc-900">
              {emailStatus.smtpConfigured ? "Configured" : "Missing"}
            </span>
          </div>

          {emailStatus.verification?.message && (
            <div className="pt-3 mt-1 border-t border-zinc-200/50 flex justify-between items-center text-[12px] text-zinc-400">
              <span className="uppercase">Verification</span>
              <span
                className={`font-medium ${
                  emailStatus.verification.ok
                    ? "text-emerald-600"
                    : "text-amber-600 truncate max-w-[150px]"
                }`}
              >
                {emailStatus.verification.message}
              </span>
            </div>
          )}
        </div>
      )}

      {emailActionMsg && (
        <p className="text-[13.5px] rounded-xl px-3.5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 leading-relaxed">
          {emailActionMsg}
        </p>
      )}

      {canTestEmail && hasAuthToken() && (
        <button
          type="button"
          onClick={handleSendTestEmail}
          disabled={emailLoading === "test"}
          className="w-full flex items-center justify-center gap-2 bg-white border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 text-zinc-700 px-3 py-3 rounded-2xl text-[14px] font-medium transition-all shadow-sm hover:-translate-y-0.5"
        >
          <Mail size={14} className="text-zinc-400" />
          {emailLoading === "test"
            ? "Sending test payload..."
            : "Send Test Email"}
        </button>
      )}
    </motion.div>
  );
};

const NotificationsDrawer = ({
  isDrawerOpen,
  setIsDrawerOpen,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  filteredNotifications,
  loading,
  actionId,
  handleMarkAsRead,
  handleDelete,
}) => {
  const filterTabs = [
    "All",
    "Unread",
    "Payroll",
    "Leave",
    "Attendance",
    "Performance",
  ];

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-zinc-200"
          >
            <div className="flex-shrink-0 px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-[18px] font-semibold text-zinc-900">
                  Notification Center
                </h2>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  View and manage all your operational logs
                </p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-shrink-0 p-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-2 px-2">
                <Filter size={12} className="text-zinc-400 flex-shrink-0 ml-1" />
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors ${
                      activeFilter === tab
                        ? "bg-zinc-900 text-white"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/30">
              {loading ? (
                <div className="py-12 text-center text-[13.5px] text-zinc-500 leading-relaxed">
                  Loading logs...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3 border border-zinc-200/50">
                    <Bell size={20} className="text-zinc-300" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-1">
                    No notifications found
                  </h3>
                  <p className="text-[13.5px] text-zinc-500 max-w-[220px] leading-relaxed">
                    Try adjusting your filters or search query to find the
                    specific reports.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <NotificationItem
                    key={n._id}
                    notification={n}
                    actionId={actionId}
                    handleMarkAsRead={handleMarkAsRead}
                    handleDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Notifications = () => {
  const { user } = useAuth();
  const { refreshBadges } = useBadges();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const [payrolls, setPayrolls] = useState([]);
  const [selectedPayrollId, setSelectedPayrollId] = useState("");
  const [pdfLoading, setPdfLoading] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");

  const [emailStatus, setEmailStatus] = useState(null);
  const [emailActionMsg, setEmailActionMsg] = useState("");
  const [emailLoading, setEmailLoading] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const canTestEmail = ["Admin", "HR", "Manager"].includes(user?.role);

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
      const res = await API.get("/payroll");

      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      const visiblePayrolls = filterPayrollsForLoggedUser(list, user);

      setPayrolls(visiblePayrolls);

      if (visiblePayrolls.length > 0) {
        setSelectedPayrollId(visiblePayrolls[0]._id);
      } else {
        setSelectedPayrollId("");
      }
    } catch (err) {
      console.error("Failed to load payrolls:", err);
      setPayrolls([]);
      setSelectedPayrollId("");
    }
  }, [user]);

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

    const handleSocketUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("socket-badge-update", handleSocketUpdate);
    return () => window.removeEventListener("socket-badge-update", handleSocketUpdate);
  }, [fetchNotifications]);

  useEffect(() => {
    const loadEmailStatus = async () => {
      if (!hasAuthToken()) {
        setEmailStatus(null);
        return;
      }

      try {
        const res = await API.get("/notifications/email-status");
        setEmailStatus(res.data?.data ?? null);
      } catch {
        setEmailStatus(null);
      }
    };

    loadEmailStatus();
  }, []);

  const handleSendTestEmail = async () => {
    setEmailLoading("test");
    setEmailActionMsg("");

    try {
      const res = await API.post("/notifications/test-email");
      setEmailActionMsg(res.data?.message || "Test email sent.");
      await fetchNotifications();
    } catch (err) {
      setEmailActionMsg(
        err.response?.data?.message ||
          err.message ||
          "Failed to send test email"
      );
    } finally {
      setEmailLoading("");
    }
  };

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
      refreshBadges();
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
      refreshBadges();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark all as read");
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
        refreshBadges();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete notification");
    } finally {
      setActionId(null);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const title = n.title || "";
    const message = n.message || "";

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.isRead;

    return (n.type || "").toLowerCase() === activeFilter.toLowerCase();
  });

  const recentNotifications = notifications.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <HeroSection
          unreadCount={unreadCount}
          emailStatus={emailStatus}
          setIsDrawerOpen={setIsDrawerOpen}
          handleMarkAllAsRead={handleMarkAllAsRead}
          actionId={actionId}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-start gap-3"
          >
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">{error}</p>
              {!hasAuthToken() && (
                <Link
                  to="/login"
                  className="inline-block mt-1 font-semibold hover:underline"
                >
                  Sign in to continue
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {pdfMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 border rounded-xl text-xs flex items-start gap-3 ${
              pdfMessage.includes("successfully")
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : "bg-amber-50 border-amber-100 text-amber-700"
            }`}
          >
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <p className="font-semibold">{pdfMessage}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <ReportsPanel
              payrolls={payrolls}
              selectedPayrollId={selectedPayrollId}
              setSelectedPayrollId={setSelectedPayrollId}
              pdfLoading={pdfLoading}
              handlePdfDownload={handlePdfDownload}
            />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <RecentNotifications
              loading={loading}
              recentNotifications={recentNotifications}
              unreadCount={unreadCount}
              setIsDrawerOpen={setIsDrawerOpen}
              actionId={actionId}
              handleMarkAsRead={handleMarkAsRead}
              handleDelete={handleDelete}
            />

            <EmailStatusCard
              emailStatus={emailStatus}
              emailActionMsg={emailActionMsg}
              canTestEmail={canTestEmail}
              handleSendTestEmail={handleSendTestEmail}
              emailLoading={emailLoading}
            />
          </div>
        </div>
      </div>

      <NotificationsDrawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        filteredNotifications={filteredNotifications}
        loading={loading}
        actionId={actionId}
        handleMarkAsRead={handleMarkAsRead}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default Notifications;