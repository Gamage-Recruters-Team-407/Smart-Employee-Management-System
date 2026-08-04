import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const Leave = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager';

  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'manage'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null,
    isHalfDay: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ── Approve/Reject/Revert confirmation popup state ────────────────────────
  const [confirmAction, setConfirmAction] = useState(null); // { id, status, employeeName }
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'startDate') {
      setFormData(prev => ({
        ...prev,
        startDate: value,
        // keep endDate synced to startDate while half day is selected
        endDate: prev.isHalfDay ? value : prev.endDate,
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHalfDayToggle = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isHalfDay: checked,
      // half day leave is always a single day
      endDate: checked ? prev.startDate : prev.endDate,
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = new FormData();
      data.append('leaveType', formData.leaveType);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('reason', formData.reason);
      data.append('isHalfDay', formData.isHalfDay);
      if (formData.attachment) data.append('medicalDocument', formData.attachment);

      await API.post('/leaves/apply', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Leave application submitted successfully!');
      fetchLeaves();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.put(`/leaves/cancel/${id}`, {});
      fetchLeaves();
    } catch (err) {
      console.error(err);
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
      if (confirmAction.status === 'Reverted') {
        await API.put(`/leaves/revert/${confirmAction.id}`, {});
      } else {
        await API.put(`/leaves/status/${confirmAction.id}`, { status: confirmAction.status });
      }
      await fetchAllLeaves();
      closeConfirm();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update leave status.');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
    setFormData({ leaveType: '', startDate: '', endDate: '', reason: '', attachment: null, isHalfDay: false });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
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
                            {leave.isHalfDay ? 'Half day' : `${leave.totalDays} ${leave.totalDays === 1 ? 'day' : 'days'}`}
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
                    <th className="px-6 py-4 text-left">Reason</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No leave requests found.</td></tr>
                  ) : (
                    leaves.map((leave) => (
                      <tr key={leave._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">{leave.leaveType}{leave.isHalfDay && ' (Half Day)'}</td>
                        <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">{leave.totalDays}</td>
                        <td className="px-6 py-4">{leave.reason}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {leave.status === 'Pending' && (
                            <button
                              onClick={() => handleCancel(leave._id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── MANAGE LEAVE REQUESTS TAB (Admin/HR only) ───────────────────────── */}
      {isAdminOrHR && activeTab === 'manage' && (
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
                  <th className="px-6 py-4 text-left">Reason</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {allLeaves.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-8 text-gray-500">No leave requests found.</td></tr>
                ) : (
                  allLeaves.map((leave) => {
                    const empName = leave.employee
                      ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim()
                      : '—';
                    return (
                      <tr key={leave._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{empName}</td>
                        <td className="px-6 py-4">{leave.leaveType}{leave.isHalfDay && ' (Half Day)'}</td>
                        <td className="px-6 py-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-center">{leave.totalDays}</td>
                        <td className="px-6 py-4">{leave.reason}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(leave.status)}`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {leave.status === 'Pending' ? (
                            <div className="flex items-center justify-center gap-3">
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
                            </div>
                          ) : ['Approved', 'Rejected'].includes(leave.status) ? (
                            <button
                              onClick={() => openConfirm(leave, 'Reverted')}
                              className="text-amber-600 hover:underline text-sm font-medium"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
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

                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isHalfDay"
                        checked={formData.isHalfDay}
                        onChange={handleHalfDayToggle}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Half Day Leave</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date <span className="text-red-500">*</span></label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.isHalfDay ? formData.startDate : formData.endDate}
                      onChange={handleChange}
                      disabled={formData.isHalfDay}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Days</label>
                    <input
                      type="text"
                      value={
                        formData.isHalfDay
                          ? (formData.startDate ? '0.5' : '')
                          : (formData.startDate && formData.endDate
                              ? Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1
                              : '')
                      }
                      disabled
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50"
                    />
                  </div>
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
                : 'Revert Leave to Pending'}
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to{' '}
              <strong>
                {confirmAction.status === 'Approved'
                  ? 'approve'
                  : confirmAction.status === 'Rejected'
                  ? 'reject'
                  : 'revert to pending'}
              </strong>{' '}
              the leave request from <strong>{confirmAction.employeeName}</strong>?
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
                    : confirmAction.status === 'Rejected'
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
                  : 'Revert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;
