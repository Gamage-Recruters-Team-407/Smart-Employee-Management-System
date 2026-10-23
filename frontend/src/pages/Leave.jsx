import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, RotateCw, Trash2, Calendar as CalendarIcon, Table as TableIcon, CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';

const Leave = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager';

  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'manage'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [manageCurrentPage, setManageCurrentPage] = useState(1);
  const manageItemsPerPage = 6;
  const getLocalDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const [manageFilterDate, setManageFilterDate] = useState(getLocalDateString());
  const [manageSearchName, setManageSearchName] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date()); // Month currently being viewed in calendar
  const [selectedDayLeaves, setSelectedDayLeaves] = useState(null); // { dateString, leaves: [] }
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null,
    isHalfDay: false,
    leaveCategory: 'Full Day',
    halfDaySession: 'Morning',
    startTime: '',
    endTime: '',
    totalHours: '',
    weekendCoverDates: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Approve/Reject/Revert confirmation popup state ────────────────────────
  const [confirmAction, setConfirmAction] = useState(null); // { id, status, employeeName }
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaves();
    if (isAdminOrHR) fetchAllLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await API.get('/leaves/my-leaves');
      setLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllLeaves = async () => {
    try {
      const res = await API.get('/leaves/all');
      setAllLeaves(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (diffMinutes <= 0) return '';
    return parseFloat((diffMinutes / 60).toFixed(2)).toString();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'startDate') {
      setFormData(prev => ({
        ...prev,
        startDate: value,
        endDate: (prev.leaveCategory === 'Half Day' || prev.leaveCategory === 'Short Leave') ? value : prev.endDate,
      }));
      return;
    }

    if (name === 'startTime' || name === 'endTime') {
      setFormData(prev => {
        const nextState = { ...prev, [name]: value };
        nextState.totalHours = calculateHours(nextState.startTime, nextState.endTime);
        return nextState;
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
  };

  // Helper to calculate leave duration, monthly quota usage, and required weekend cover dates
  const calculateLeaveDurationInfo = () => {
    const { startDate, endDate, leaveCategory } = formData;
    if (!startDate) return { requestedDays: 0, usedThisMonth: 0, remainingQuota: 1.0, extraDays: 0, requiredWeekendCount: 0 };

    let requestedDays = 0;
    if (leaveCategory === 'Half Day') {
      requestedDays = 0.5;
    } else if (leaveCategory === 'Short Leave') {
      requestedDays = 0;
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

    const start = new Date(startDate);
    const targetYear = start.getFullYear();
    const targetMonth = start.getMonth();

    // Calculate leaves already taken/pending this month
    const usedThisMonth = leaves
      .filter(l => {
        if (!['Pending', 'Approved'].includes(l.status)) return false;
        const lDate = new Date(l.startDate);
        return lDate.getFullYear() === targetYear && lDate.getMonth() === targetMonth;
      })
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);

    const MONTHLY_LIMIT = 1.0;
    const remainingQuota = Math.max(0, MONTHLY_LIMIT - usedThisMonth);
    const coveredByQuota = Math.min(requestedDays, remainingQuota);
    const extraDays = Math.max(0, requestedDays - coveredByQuota);
    const requiredWeekendCount = Math.ceil(extraDays);

    const monthName = start.toLocaleString('default', { month: 'long', year: 'numeric' });

    return {
      requestedDays,
      usedThisMonth,
      remainingQuota,
      coveredByQuota,
      extraDays,
      requiredWeekendCount,
      monthName,
    };
  };

  const durationInfo = calculateLeaveDurationInfo();

  const handleAddCoverDate = () => {
    setFormData(prev => ({
      ...prev,
      weekendCoverDates: [
        ...prev.weekendCoverDates,
        { date: '', notes: '' }
      ]
    }));
  };

  const handleRemoveCoverDate = (index) => {
    setFormData(prev => ({
      ...prev,
      weekendCoverDates: prev.weekendCoverDates.filter((_, i) => i !== index)
    }));
  };

  const handleCoverDateChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.weekendCoverDates];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, weekendCoverDates: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (formData.leaveCategory === 'Short Leave') {
      if (!formData.startTime || !formData.endTime) {
        setError('Start time and end time are required for short leaves.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.totalHours || parseFloat(formData.totalHours) <= 0) {
        setError('End time must be after start time.');
        setIsSubmitting(false);
        return;
      }
    }

    // Monthly 1-day allowance check & Weekend cover validation
    if (durationInfo.extraDays > 0) {
      if (formData.weekendCoverDates.length < durationInfo.requiredWeekendCount) {
        setError(`You have ${durationInfo.extraDays} extra day(s) beyond your 1 day/month allowance. You must provide at least ${durationInfo.requiredWeekendCount} weekend cover date(s) (Saturday or Sunday).`);
        setIsSubmitting(false);
        return;
      }

      // Verify each cover date is a Saturday or Sunday and distinct
      const seenDates = new Set();
      for (let i = 0; i < formData.weekendCoverDates.length; i++) {
        const item = formData.weekendCoverDates[i];
        if (!item.date) {
          setError(`Please select a date for weekend cover entry #${i + 1}.`);
          setIsSubmitting(false);
          return;
        }
        const d = new Date(item.date);
        const day = d.getDay(); // 0 is Sunday, 6 is Saturday
        if (day !== 0 && day !== 6) {
          setError(`Cover date #${i + 1} (${item.date}) is not a weekend. Extra leave days must be covered strictly on a Saturday or Sunday.`);
          setIsSubmitting(false);
          return;
        }
        if (seenDates.has(item.date)) {
          setError(`Cover date ${item.date} is selected more than once. Please choose distinct Saturday/Sunday dates.`);
          setIsSubmitting(false);
          return;
        }
        seenDates.add(item.date);
      }
    }

    try {
      const data = new FormData();
      data.append('leaveType', formData.leaveType);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.leaveCategory === 'Full Day' ? formData.endDate : formData.startDate);
      data.append('reason', formData.reason);
      data.append('isHalfDay', formData.leaveCategory === 'Half Day');
      data.append('leaveCategory', formData.leaveCategory);
      if (formData.leaveCategory === 'Half Day') {
        data.append('halfDaySession', formData.halfDaySession);
      }
      if (formData.leaveCategory === 'Short Leave') {
        data.append('startTime', formData.startTime);
        data.append('endTime', formData.endTime);
        data.append('totalHours', formData.totalHours);
      }
      if (durationInfo.extraDays > 0 && formData.weekendCoverDates.length > 0) {
        data.append('weekendCoverDates', JSON.stringify(formData.weekendCoverDates));
      }
      if (formData.attachment) data.append('medicalDocument', formData.attachment);

      await API.post('/leaves/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMessage('Leave application submitted successfully!');
      fetchLeaves();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };
  // ── Approve / Reject / Revert ──────────────────────────────────────────────
  const openConfirm = (leave, status) => {
    setConfirmAction({
      id: leave._id,
      status,
      employeeName: leave.employee
        ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
        : 'this employee',
    });
  };

  const closeConfirm = () => setConfirmAction(null);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.status === 'Deleted') {
        await API.delete(`/leaves/${confirmAction.id}`);
      } else if (confirmAction.status === 'Cancelled') {
        await API.put(`/leaves/cancel/${confirmAction.id}`, {});
      } else if (confirmAction.status === 'Reverted') {
        await API.put(`/leaves/revert/${confirmAction.id}`, {});
      } else {
        await API.put(`/leaves/status/${confirmAction.id}`, { status: confirmAction.status });
      }
      await fetchAllLeaves();
      await fetchLeaves();
      closeConfirm();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to perform action.');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachment: null,
      isHalfDay: false,
      leaveCategory: 'Full Day',
      halfDaySession: 'Morning',
      startTime: '',
      endTime: '',
      totalHours: '',
      weekendCoverDates: [],
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const indexOfLastLeave = currentPage * itemsPerPage;
  const indexOfFirstLeave = indexOfLastLeave - itemsPerPage;
  const currentLeaves = leaves.slice(indexOfFirstLeave, indexOfLastLeave);
  const totalPages = Math.ceil(leaves.length / itemsPerPage);

  const filteredManageLeaves = allLeaves.filter(leave => {
    const employeeName = leave.employee
      ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
      : '';
    if (!employeeName.toLowerCase().includes(manageSearchName.trim().toLowerCase())) return false;
    if (!manageFilterDate) return true;

    const target = new Date(`${manageFilterDate}T00:00:00`);
    const start = new Date(leave.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(leave.endDate || leave.startDate);
    end.setHours(0, 0, 0, 0);
    return target >= start && target <= end;
  });

    const indexOfLastManageLeave = manageCurrentPage * manageItemsPerPage;
  const indexOfFirstManageLeave = indexOfLastManageLeave - manageItemsPerPage;
  const currentManageLeaves = filteredManageLeaves.slice(indexOfFirstManageLeave, indexOfLastManageLeave);
  const totalManagePages = Math.ceil(filteredManageLeaves.length / manageItemsPerPage);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchLeaves();
      if (isAdminOrHR) await fetchAllLeaves();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Calendar Helpers ───────────────────────────────────────────────────────
  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill a 35 or 42 grid (multiple of 7)
    const remainingSlots = 7 - (days.length % 7);
    if (remainingSlots < 7) {
      for (let i = 1; i <= remainingSlots; i++) {
        days.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  };

  const getLeavesForDate = (dateObj, targetLeavesList) => {
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);

    return targetLeavesList.filter((leave) => {
      const s = new Date(leave.startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(leave.endDate || leave.startDate);
      e.setHours(0, 0, 0, 0);

      // Check if day falls in leave duration OR is a weekend cover date
      const fallsInDuration = d >= s && d <= e;
      const isCoverDate = leave.weekendCoverDates?.some((cov) => {
        const cd = new Date(cov.date);
        cd.setHours(0, 0, 0, 0);
        return cd.getTime() === d.getTime();
      });

      return fallsInDuration || isCoverDate;
    });
  };

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setCalendarDate(new Date());
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Leave Management</h1>

      {/* ── Tabs (Admin/HR only) ─────────────────────────────────────────── */}
      {isAdminOrHR && (
        <div className="flex gap-2 mb-6 bg-white rounded-2xl shadow p-2 w-fit">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'my' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'manage' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Manage Leave Requests
          </button>
        </div>
      )}

      {/* ── MY LEAVES TAB ─────────────────────────────────────────────────── */}
      {(!isAdminOrHR || activeTab === 'my') && (
        <>
          <div className="bg-white rounded-2xl shadow p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 flex items-center gap-2"
            >
              + Apply New Leave
            </button>

            {/* Table / Calendar View Toggle for My Leaves */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Calendar View"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>
          </div>

          {/* ── RECENT LEAVES ─────────────────────────────────────────────────── */}
          {leaves.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Recent Leaves</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...leaves]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 3)
                  .map((leave) => {
                    const statusStyles = {
                      Approved: { pill: 'bg-green-100 text-green-700', bar: 'bg-green-500', dot: 'bg-green-400' },
                      Rejected: { pill: 'bg-red-100 text-red-700', bar: 'bg-red-500', dot: 'bg-red-400' },
                      Pending:  { pill: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', dot: 'bg-amber-400' },
                      Cancelled:{ pill: 'bg-gray-100 text-gray-500', bar: 'bg-gray-300', dot: 'bg-gray-400' },
                    };
                    const style = statusStyles[leave.status] || statusStyles.Pending;
                    const start = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const end   = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <div key={leave._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`h-1 w-full ${style.bar}`} />
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                                {leave.leaveType}
                                {leave.leaveCategory === 'Half Day' && ' (Half Day)'}
                                {leave.leaveCategory === 'Short Leave' && ' (Short)'}
                              </span>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${style.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 mb-1">
                            {start} → {end}
                          </p>
                          <p className="text-xs text-gray-400 mb-2">
                            {leave.leaveCategory === 'Short Leave'
                              ? `${leave.totalHours || 0} hrs`
                              : leave.leaveCategory === 'Half Day'
                                ? `Half Day (${leave.halfDaySession || 'Morning'})`
                                : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`}
                          </p>
                          {leave.extraDays > 0 && leave.weekendCoverDates?.length > 0 && (
                            <div className="mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                              <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">
                                Weekend Cover ({leave.weekendCoverDates.length}d):
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {leave.weekendCoverDates.map((cov, i) => (
                                  <span key={i} className="text-[10px] font-medium bg-white text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                                    {cov.dayOfWeek ? `${cov.dayOfWeek.slice(0, 3)} ` : ''}{new Date(cov.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {leave.reason && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {leave.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── CALENDAR VIEW FOR MY LEAVES ──────────────────────────── */}
          {viewMode === 'calendar' && (
            <div className="bg-white rounded-2xl shadow overflow-hidden p-6 space-y-6">
              {/* Calendar Month Navigation Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-800">
                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    type="button"
                    onClick={handleTodayMonth}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                  >
                    Current Month
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Pending
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Approved
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Sat/Sun Cover
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <div
                        key={day}
                        className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                          idx === 0 || idx === 6 ? 'text-indigo-600 bg-indigo-50/50 rounded-lg' : 'text-gray-500'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {getCalendarDays(calendarDate).map(({ date, isCurrentMonth }, idx) => {
                      const todayStr = getLocalDateString();
                      const dateYMD = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const isToday = dateYMD === todayStr;
                      const dayLeaves = getLeavesForDate(date, leaves);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (dayLeaves.length > 0) {
                              setSelectedDayLeaves({
                                dateString: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                                leaves: dayLeaves,
                              });
                            }
                          }}
                          className={`min-h-[105px] p-2 rounded-xl border transition flex flex-col justify-between ${
                            !isCurrentMonth
                              ? 'bg-gray-50/50 border-gray-100 opacity-40'
                              : isWeekend
                              ? 'bg-slate-50/60 border-indigo-100'
                              : 'bg-white border-gray-200 hover:border-indigo-300'
                          } ${dayLeaves.length > 0 ? 'cursor-pointer hover:shadow-md ring-1 ring-transparent hover:ring-indigo-300' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                isToday
                                  ? 'bg-indigo-600 text-white'
                                  : isCurrentMonth
                                  ? 'text-gray-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {date.getDate()}
                            </span>
                            {isWeekend && isCurrentMonth && (
                              <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.2 rounded">
                                {date.getDay() === 6 ? 'Sat' : 'Sun'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 my-1 overflow-hidden">
                            {dayLeaves.slice(0, 3).map((l) => {
                              const isCompensationDate = l.weekendCoverDates?.some(cov => {
                                const cd = new Date(cov.date);
                                cd.setHours(0, 0, 0, 0);
                                const curD = new Date(date);
                                curD.setHours(0, 0, 0, 0);
                                return cd.getTime() === curD.getTime();
                              });

                              return (
                                <div
                                  key={l._id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 ${
                                    isCompensationDate
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : l.status === 'Approved'
                                      ? 'bg-green-100 text-green-800'
                                      : l.status === 'Rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                  title={`${l.leaveType} (${l.status})${isCompensationDate ? ' [Weekend Cover Work]' : ''}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isCompensationDate
                                        ? 'bg-indigo-600'
                                        : l.status === 'Approved'
                                        ? 'bg-green-600'
                                        : l.status === 'Rejected'
                                        ? 'bg-red-600'
                                        : 'bg-amber-600'
                                    }`}
                                  />
                                  <span className="truncate">
                                    {isCompensationDate ? `[Cover] ${l.leaveType}` : `${l.leaveType} (${l.leaveCategory === 'Half Day' ? 'Half' : `${l.totalDays}d`})`}
                                  </span>
                                </div>
                              );
                            })}
                            {dayLeaves.length > 3 && (
                              <div className="text-[10px] text-gray-500 font-semibold px-1">
                                +{dayLeaves.length - 3} more
                              </div>
                            )}
                          </div>

                          <div className="text-[9px] text-gray-400 text-right">
                            {dayLeaves.length > 0 && `${dayLeaves.length} item(s)`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TABLE VIEW FOR MY LEAVES ───────────────────────────────────── */}
          {viewMode === 'table' && (
          <div className='bg-white rounded-2xl shadow overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
                    <th className="px-6 py-4 text-left">Leave Type</th>
                    <th className="px-6 py-4 text-left">Start Date</th>
                    <th className="px-6 py-4 text-left">End Date</th>
                    <th className="px-6 py-4 text-center">Days</th>
                    <th className="px-6 py-4 text-center">Duration</th>
                    <th className="px-6 py-4 text-left min-w-[240px]">Reason & Weekend Cover</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLeaves.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-8 text-gray-500">No leave requests found.</td></tr>
                  ) : (
                    currentLeaves.map((leave) => (
                      <tr key={leave._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">
                          {leave.leaveType}
                          {leave.leaveCategory === 'Half Day' && ' (Half Day)'}
                          {leave.leaveCategory === 'Short Leave' && ' (Short Leave)'}
                        </td>
                        <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {leave.leaveCategory === 'Half Day' || leave.leaveCategory === 'Short Leave'
                            ? '—'
                            : new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {leave.leaveCategory === 'Half Day' || leave.leaveCategory === 'Short Leave'
                            ? '—'
                            : leave.totalDays}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {leave.leaveCategory === 'Half Day'
                            ? (leave.halfDaySession || 'Morning')
                            : leave.leaveCategory === 'Short Leave'
                              ? `${leave.startTime || ''} - ${leave.endTime || ''}`
                              : 'Full Day'}
                        </td>
                        <td className="px-6 py-4 max-w-xs break-words min-w-[240px]">
                          <p>{leave.reason}</p>
                          {leave.extraDays > 0 && leave.weekendCoverDates?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                Cover:
                              </span>
                              {leave.weekendCoverDates.map((cov, i) => (
                                <span key={i} className="text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                                  {cov.dayOfWeek ? `${cov.dayOfWeek.slice(0, 3)} ` : ''}{new Date(cov.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {leave.status === 'Pending' && (
                            <div className="flex flex-col items-center">
                              <button
                                onClick={() => openConfirm(leave, 'Cancelled')}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-semibold">{indexOfFirstLeave + 1}</span>–
                  <span className="font-semibold">{Math.min(indexOfLastLeave, leaves.length)}</span> of{" "}
                  <span className="font-semibold">{leaves.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                        currentPage === pg
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          )}
        </>
      )}

      {/* ── MANAGE LEAVE REQUESTS TAB (Admin/HR only) ───────────────────────── */}
      {isAdminOrHR && activeTab === 'manage' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-2xl shadow p-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Leave Requests</h2>
              <p className="text-gray-500 text-sm mt-1">Review and manage leave requests</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <input
                type="search"
                value={manageSearchName}
                onChange={(e) => {
                  setManageSearchName(e.target.value);
                  setManageCurrentPage(1);
                }}
                placeholder="Search employee name..."
                aria-label="Search employee name"
                className="w-full sm:w-56 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              />
              <input
                type="date"
                value={manageFilterDate}
                onChange={(e) => {
                  setManageFilterDate(e.target.value);
                  setManageCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setManageFilterDate(getLocalDateString());
                  setManageCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  manageFilterDate === getLocalDateString()
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setManageFilterDate("");
                  setManageCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                  !manageFilterDate
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-gray-300 hover:bg-gray-50 text-gray-700 bg-white'
                }`}
              >
                View All
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white transition flex items-center justify-center disabled:opacity-50"
                title="Refresh data"
              >
                <RotateCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Table / Calendar View Toggle */}
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'table'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    viewMode === 'calendar'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Calendar View"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Calendar
                </button>
              </div>
            </div>
          </div>

          {/* ── CALENDAR VIEW ──────────────────────────────────────────────── */}
          {viewMode === 'calendar' && (
            <div className="bg-white rounded-2xl shadow overflow-hidden p-6 space-y-6">
              {/* Calendar Month Navigation Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-800">
                    {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    type="button"
                    onClick={handleTodayMonth}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                  >
                    Current Month
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Pending
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Approved
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Sat/Sun Cover
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Weekday Names Header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <div
                        key={day}
                        className={`text-center py-2 text-xs font-bold uppercase tracking-wider ${
                          idx === 0 || idx === 6 ? 'text-indigo-600 bg-indigo-50/50 rounded-lg' : 'text-gray-500'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Day Slots */}
                  <div className="grid grid-cols-7 gap-2">
                    {getCalendarDays(calendarDate).map(({ date, isCurrentMonth }, idx) => {
                      const todayStr = getLocalDateString();
                      const dateYMD = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      const isToday = dateYMD === todayStr;
                      const dayLeaves = getLeavesForDate(date, filteredManageLeaves);
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (dayLeaves.length > 0) {
                              setSelectedDayLeaves({
                                dateString: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                                leaves: dayLeaves,
                              });
                            }
                          }}
                          className={`min-h-[110px] p-2 rounded-xl border transition flex flex-col justify-between ${
                            !isCurrentMonth
                              ? 'bg-gray-50/50 border-gray-100 opacity-40'
                              : isWeekend
                              ? 'bg-slate-50/60 border-indigo-100'
                              : 'bg-white border-gray-200 hover:border-indigo-300'
                          } ${dayLeaves.length > 0 ? 'cursor-pointer hover:shadow-md ring-1 ring-transparent hover:ring-indigo-300' : ''}`}
                        >
                          {/* Day number & weekend indicator */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                isToday
                                  ? 'bg-indigo-600 text-white'
                                  : isCurrentMonth
                                  ? 'text-gray-700'
                                  : 'text-gray-400'
                              }`}
                            >
                              {date.getDate()}
                            </span>
                            {isWeekend && isCurrentMonth && (
                              <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.2 rounded">
                                {date.getDay() === 6 ? 'Sat' : 'Sun'}
                              </span>
                            )}
                          </div>

                          {/* Leave pills for the day */}
                          <div className="space-y-1 my-1 overflow-hidden">
                            {dayLeaves.slice(0, 3).map((l) => {
                              const empName = l.employee
                                ? `${l.employee.firstName || ''} ${l.employee.lastName || ''}`.trim()
                                : 'Employee';

                              // Check if this date is specifically a weekend compensation cover date
                              const isCompensationDate = l.weekendCoverDates?.some(cov => {
                                const cd = new Date(cov.date);
                                cd.setHours(0, 0, 0, 0);
                                const curD = new Date(date);
                                curD.setHours(0, 0, 0, 0);
                                return cd.getTime() === curD.getTime();
                              });

                              return (
                                <div
                                  key={l._id}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 ${
                                    isCompensationDate
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : l.status === 'Approved'
                                      ? 'bg-green-100 text-green-800'
                                      : l.status === 'Rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                  title={`${empName} - ${l.leaveType} (${l.status})${isCompensationDate ? ' [Weekend Cover Work]' : ''}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isCompensationDate
                                        ? 'bg-indigo-600'
                                        : l.status === 'Approved'
                                        ? 'bg-green-600'
                                        : l.status === 'Rejected'
                                        ? 'bg-red-600'
                                        : 'bg-amber-600'
                                    }`}
                                  />
                                  <span className="truncate">
                                    {isCompensationDate ? `[Cover] ${empName}` : empName}
                                  </span>
                                </div>
                              );
                            })}
                            {dayLeaves.length > 3 && (
                              <div className="text-[10px] text-gray-500 font-semibold px-1">
                                +{dayLeaves.length - 3} more
                              </div>
                            )}
                          </div>

                          <div className="text-[9px] text-gray-400 text-right">
                            {dayLeaves.length > 0 && `${dayLeaves.length} on leave/cover`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TABLE VIEW ─────────────────────────────────────────────────── */}
          {viewMode === 'table' && (
          <div className='bg-white rounded-2xl shadow overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b'>
                <tr>
                  <th className="px-6 py-4 text-left">Employee</th>
                  <th className="px-6 py-4 text-left">Leave Type</th>
                  <th className="px-6 py-4 text-left">Start Date</th>
                  <th className="px-6 py-4 text-left">End Date</th>
                  <th className="px-6 py-4 text-center">Days</th>
                  <th className="px-6 py-4 text-center">Duration</th>
                  <th className="px-6 py-4 text-left min-w-[240px]">Reason & Weekend Cover</th>
                  <th className="px-6 py-4 text-center">Applied Date</th>
                  <th className="px-6 py-4 text-center">Applied Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentManageLeaves.length === 0 ? (
                  <tr><td colSpan="11" className="text-center py-8 text-gray-500">{manageFilterDate ? "No leave requests found for this date." : "No leave requests found."}</td></tr>
                ) : (
                  currentManageLeaves.map((leave) => {
                    const empName = leave.employee
                      ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
                      : '—';
                    return (
                      <tr key={leave._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{empName}</td>
                        <td className="px-6 py-4">
                          {leave.leaveType}
                          {leave.leaveCategory === 'Half Day' && ' (Half Day)'}
                          {leave.leaveCategory === 'Short Leave' && ' (Short Leave)'}
                        </td>
                        <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {leave.leaveCategory === 'Half Day' || leave.leaveCategory === 'Short Leave'
                            ? '—'
                            : new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {leave.leaveCategory === 'Half Day' || leave.leaveCategory === 'Short Leave'
                            ? '—'
                            : leave.totalDays}
                        </td>
                        <td className="px-6 py-4 text-center font-medium">
                          {leave.leaveCategory === 'Half Day'
                            ? (leave.halfDaySession || 'Morning')
                            : leave.leaveCategory === 'Short Leave'
                              ? `${leave.startTime || ''} - ${leave.endTime || ''}`
                              : 'Full Day'}
                        </td>
                        <td className="px-6 py-4 max-w-xs break-words min-w-[240px]">
                          <p>{leave.reason}</p>
                          {leave.extraDays > 0 && leave.weekendCoverDates?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                Cover:
                              </span>
                              {leave.weekendCoverDates.map((cov, i) => (
                                <span key={i} className="text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                                  {cov.dayOfWeek ? `${cov.dayOfWeek.slice(0, 3)} ` : ''}{new Date(cov.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {leave.createdAt
                            ? new Date(leave.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {leave.status === 'Pending' ? (
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <button
                                onClick={() => openConfirm(leave, 'Approved')}
                                className="text-green-600 hover:underline text-sm font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openConfirm(leave, 'Rejected')}
                                className="text-red-600 hover:underline text-sm font-medium"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => openConfirm(leave, 'Deleted')}
                                className="mt-1 p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition"
                                title="Delete Leave Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : ['Approved', 'Rejected'].includes(leave.status) ? (
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <button
                                onClick={() => openConfirm(leave, 'Reverted')}
                                className="text-amber-600 hover:underline text-sm font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => openConfirm(leave, 'Deleted')}
                                className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition"
                                title="Delete Leave Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <button
                                onClick={() => openConfirm(leave, 'Deleted')}
                                className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition"
                                title="Delete Leave Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalManagePages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing <span className="font-semibold">{indexOfFirstManageLeave + 1}</span>–
                <span className="font-semibold">{Math.min(indexOfLastManageLeave, filteredManageLeaves.length)}</span> of{" "}
                <span className="font-semibold">{filteredManageLeaves.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={manageCurrentPage === 1}
                  onClick={() => setManageCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalManagePages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setManageCurrentPage(pg)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                      manageCurrentPage === pg
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  disabled={manageCurrentPage === totalManagePages}
                  onClick={() => setManageCurrentPage(prev => Math.min(prev + 1, totalManagePages))}
                  className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    )}

      {/* ── DAY LEAVES DETAIL MODAL (WHEN CLICKING A DAY IN CALENDAR) ─────── */}
      {selectedDayLeaves && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Leaves & Weekend Covers</h3>
                <p className="text-xs text-indigo-600 font-medium">{selectedDayLeaves.dateString}</p>
              </div>
              <button
                onClick={() => setSelectedDayLeaves(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none p-1"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 divide-y divide-gray-100">
              {selectedDayLeaves.leaves.map((l) => {
                const empName = l.employee
                  ? `${l.employee.firstName || ''} ${l.employee.lastName || ''}`.trim()
                  : 'Employee';

                // Check if this date is a weekend cover date
                const matchedCover = l.weekendCoverDates?.find(cov => {
                  const cd = new Date(cov.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  return cd === selectedDayLeaves.dateString;
                });

                return (
                  <div key={l._id} className="pt-3 first:pt-0 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900 text-sm">{empName}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(l.status)}`}>
                        {l.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                        {l.leaveType}
                      </span>
                      <span>
                        {l.leaveCategory === 'Short Leave'
                          ? `Short Leave (${l.startTime} - ${l.endTime})`
                          : l.leaveCategory === 'Half Day'
                          ? `Half Day (${l.halfDaySession})`
                          : `Full Day (${l.totalDays}d)`}
                      </span>
                    </div>

                    {matchedCover && (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <span>Weekend Compensation Work Date:</span>
                        </div>
                        <p className="mt-1">
                          Employee is covering their extra leave on this <strong>{matchedCover.dayOfWeek || 'Weekend'}</strong> ({new Date(matchedCover.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).
                        </p>
                        {matchedCover.notes && <p className="mt-1 text-indigo-800 italic">Tasks/Notes: "{matchedCover.notes}"</p>}
                      </div>
                    )}

                    {/* Always show scheduled covering dates if this leave required weekend cover */}
                    {l.weekendCoverDates && l.weekendCoverDates.length > 0 && !matchedCover && (
                      <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-950">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Covering Date(s) for this leave ({l.weekendCoverDates.length} required):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {l.weekendCoverDates.map((cov, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 bg-white border border-amber-300 text-amber-900 font-semibold px-2 py-1 rounded-md text-[11px] shadow-sm"
                            >
                              <span className="text-amber-600">📅</span>
                              <span>{cov.dayOfWeek ? `${cov.dayOfWeek}, ` : ''}{new Date(cov.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              {cov.notes && <span className="text-[10px] text-gray-500 font-normal">({cov.notes})</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {l.reason && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <strong className="text-gray-800">Reason:</strong> {l.reason}
                      </p>
                    )}

                    {/* Admin / HR quick actions directly in calendar popup */}
                    {isAdminOrHR && activeTab === 'manage' && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 mt-1">
                        {l.status === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayLeaves(null);
                                openConfirm(l, 'Approved');
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayLeaves(null);
                                openConfirm(l, 'Rejected');
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayLeaves(null);
                                openConfirm(l, 'Deleted');
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : ['Approved', 'Rejected'].includes(l.status) ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayLeaves(null);
                                openConfirm(l, 'Reverted');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Revert to Pending
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDayLeaves(null);
                                openConfirm(l, 'Deleted');
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedDayLeaves(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPLY NEW LEAVE MODAL ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Apply New Leave</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
              </div>

              {/* Dynamic Categories Tabs */}
              <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1.5 w-full">
                {['Full Day', 'Half Day', 'Short Leave'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        leaveCategory: cat,
                        isHalfDay: cat === 'Half Day',
                        endDate: (cat === 'Half Day' || cat === 'Short Leave') ? prev.startDate : prev.endDate,
                      }));
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                      formData.leaveCategory === cat
                        ? 'bg-white text-indigo-600 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {error && <p className="text-red-500 mb-4">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={formData.leaveCategory === 'Half Day' ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type <span className="text-red-500">*</span></label>
                    <select name="leaveType" value={formData.leaveType} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select Leave Type</option>
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Maternity">Maternity Leave</option>
                      <option value="Paternity">Paternity Leave</option>
                      <option value="Unpaid">Unpaid Leave</option>
                    </select>
                  </div>

                  {formData.leaveCategory === 'Full Day' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          required
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Days</label>
                        <input
                          type="text"
                          value={
                            formData.startDate && formData.endDate
                              ? Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1
                              : ''
                          }
                          disabled
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 font-medium"
                        />
                      </div>
                    </>
                  )}

                  {formData.leaveCategory === 'Half Day' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          {['Morning', 'Evening'].map((session) => (
                            <button
                              key={session}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, halfDaySession: session }))}
                              className={`flex-1 py-3 border rounded-xl text-sm font-semibold transition ${
                                formData.halfDaySession === session
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {session === 'Morning' ? 'Morning Half' : 'Evening Half'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {formData.leaveCategory === 'Short Leave' && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time <span className="text-red-500">*</span></label>
                        <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Time <span className="text-red-500">*</span></label>
                        <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Hours</label>
                        <input
                          type="text"
                          value={formData.totalHours ? `${formData.totalHours} hrs` : ''}
                          disabled
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-500 font-medium"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* ── Monthly Quota & Extra Dates Info ── */}
                {formData.startDate && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        <span className="font-semibold text-sm text-indigo-950">
                          Monthly Allowance Policy (1 Day / Month)
                        </span>
                      </div>
                      <span className="text-xs font-medium text-indigo-700 bg-white px-2.5 py-1 rounded-full border border-indigo-200">
                        {durationInfo.monthName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-indigo-900">
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-gray-500 block">Monthly Limit</span>
                        <span className="font-bold text-sm text-gray-800">1.0 Day</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-gray-500 block">Used This Month</span>
                        <span className="font-bold text-sm text-gray-800">{durationInfo.usedThisMonth} Day(s)</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-gray-500 block">Covered By Quota</span>
                        <span className="font-bold text-sm text-green-700">{durationInfo.coveredByQuota} Day</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                        <span className="text-gray-500 block">Extra Days</span>
                        <span className={`font-bold text-sm ${durationInfo.extraDays > 0 ? 'text-amber-600' : 'text-gray-700'}`}>
                          {durationInfo.extraDays} Day(s)
                        </span>
                      </div>
                    </div>

                    {/* Extra Days Alert & Weekend Cover Picker */}
                    {durationInfo.extraDays > 0 ? (
                      <div className="mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                        <div className="flex items-start gap-2 text-amber-900 text-xs">
                          <span className="text-base leading-none">⚠️</span>
                          <div>
                            <span className="font-semibold">Weekend Compensation Required:</span> Each member gets 1 leave day per month. You are requesting <strong>{durationInfo.extraDays} extra day(s)</strong>, which must be covered on a <strong>Saturday or Sunday</strong>.
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-semibold text-amber-950">
                            Weekend Cover Dates ({formData.weekendCoverDates.length} of {durationInfo.requiredWeekendCount} required)
                          </span>
                          <button
                            type="button"
                            onClick={handleAddCoverDate}
                            className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition"
                          >
                            + Add Weekend Date
                          </button>
                        </div>

                        {formData.weekendCoverDates.length === 0 ? (
                          <div className="text-center py-3 bg-white/70 rounded-lg border border-dashed border-amber-300 text-xs text-amber-800">
                            No weekend dates added yet. Click "+ Add Weekend Date" to select a Saturday or Sunday to cover your extra {durationInfo.extraDays} day(s).
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {formData.weekendCoverDates.map((item, index) => {
                              const d = item.date ? new Date(item.date) : null;
                              const dayIndex = d && !isNaN(d.getTime()) ? d.getDay() : null;
                              const isSaturday = dayIndex === 6;
                              const isSunday = dayIndex === 0;
                              const isValidWeekend = isSaturday || isSunday;

                              return (
                                <div key={index} className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <div className="w-full sm:w-1/2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-600">Cover Date #{index + 1}</span>
                                      {item.date && (
                                        isValidWeekend ? (
                                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                            ✓ {isSaturday ? 'Saturday' : 'Sunday'}
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                            ⚠️ Must be Sat/Sun
                                          </span>
                                        )
                                      )}
                                    </div>
                                    <input
                                      type="date"
                                      value={item.date}
                                      onChange={(e) => handleCoverDateChange(index, 'date', e.target.value)}
                                      required
                                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                  </div>

                                  <div className="w-full sm:w-1/2">
                                    <span className="text-xs font-medium text-gray-600 block mb-1">Work Tasks / Notes (Optional)</span>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="Tasks to cover on this weekend..."
                                        value={item.notes || ''}
                                        onChange={(e) => handleCoverDateChange(index, 'notes', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCoverDate(index)}
                                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition"
                                        title="Remove date"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2.5 flex items-center gap-2">
                        <span>✓</span>
                        <span>This leave is within your 1 day/month allowance. No weekend cover dates required.</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason <span className="text-red-500">*</span></label>
                  <textarea name="reason" value={formData.reason} onChange={handleChange} required rows={5} placeholder="Please explain your reason for leave..." className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (Optional)</label>
                  <input type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" className="w-full border border-gray-300 rounded-xl px-4 py-3 file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  <p className="text-xs text-gray-500 mt-1">You can upload medical certificate, documents etc. (PDF, JPG, PNG)</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition">
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVE/REJECT/REVERT CONFIRMATION MODAL ─────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
            <h2 className="text-xl font-semibold mb-3">
              {confirmAction.status === 'Approved'
                ? 'Approve Leave Request'
                : confirmAction.status === 'Rejected'
                ? 'Reject Leave Request'
                : confirmAction.status === 'Deleted'
                ? 'Delete Leave Request'
                : confirmAction.status === 'Cancelled'
                ? 'Cancel Leave Request'
                : 'Revert Leave to Pending'}
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{' '}
              <strong>
                {confirmAction.status === 'Approved'
                  ? 'approve'
                  : confirmAction.status === 'Rejected'
                  ? 'reject'
                  : confirmAction.status === 'Deleted'
                  ? 'delete'
                  : confirmAction.status === 'Cancelled'
                  ? 'cancel'
                  : 'revert to pending'}
              </strong>{' '}
              {confirmAction.status === 'Cancelled' ? 'your' : 'the'} leave request
              {confirmAction.status !== 'Cancelled' && (
                <> from <strong>{confirmAction.employeeName}</strong></>
              )}?
              {confirmAction.status === 'Deleted' && ' This action cannot be undone.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={closeConfirm}
                disabled={actionLoading}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={actionLoading}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                  confirmAction.status === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                    : confirmAction.status === 'Rejected' || confirmAction.status === 'Deleted' || confirmAction.status === 'Cancelled'
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    : 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmAction.status === 'Approved'
                  ? 'Approve'
                  : confirmAction.status === 'Rejected'
                  ? 'Reject'
                  : confirmAction.status === 'Deleted'
                  ? 'Delete'
                  : confirmAction.status === 'Cancelled'
                  ? 'Cancel'
                  : 'Revert'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── SUCCESS MESSAGE MODAL ─────────────────────────────────────────── */}
      {successMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage('')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
