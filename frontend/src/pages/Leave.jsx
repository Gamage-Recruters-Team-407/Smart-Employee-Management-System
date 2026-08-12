import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, RotateCw, Trash2 } from 'lucide-react';

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
  const [manageFilterDate, setManageFilterDate] = useState("");
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
    if (!manageFilterDate) return true;
    
    const target = new Date(manageFilterDate);
    target.setHours(0, 0, 0, 0);
    
    const start = new Date(leave.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(leave.endDate);
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
          <div className="bg-white rounded-2xl shadow p-6 mb-8">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 flex items-center gap-2"
            >
              + Apply New Leave
            </button>
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
                          <p className="text-xs text-gray-400 mb-3">
                            {leave.leaveCategory === 'Short Leave'
                              ? `${leave.totalHours || 0} hrs`
                              : leave.leaveCategory === 'Half Day'
                                ? `Half Day (${leave.halfDaySession || 'Morning'})`
                                : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`}
                          </p>
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
                    <th className="px-6 py-4 text-left min-w-[240px]">Reason</th>
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
                        <td className="px-6 py-4 max-w-xs break-words min-w-[240px]">{leave.reason}</td>
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
            
            <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
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
                  setManageFilterDate(new Date().toISOString().split('T')[0]);
                  setManageCurrentPage(1);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
              >
                Today
              </button>
              {manageFilterDate && (
                <button
                  type="button"
                  onClick={() => {
                    setManageFilterDate("");
                    setManageCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition"
                >
                  Show All
                </button>
              )}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white transition flex items-center justify-center disabled:opacity-50"
                title="Refresh data"
              >
                <RotateCw className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

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
                  <th className="px-6 py-4 text-left min-w-[240px]">Reason</th>
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
                        <td className="px-6 py-4 max-w-xs break-words min-w-[240px]">{leave.reason}</td>
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
