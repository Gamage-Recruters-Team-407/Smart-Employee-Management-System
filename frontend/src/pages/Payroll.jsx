import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Users, TrendingUp, FileText, Plus, Eye,
  Trash2, Edit2, X, RefreshCw,
} from 'lucide-react';
import { payrollAPI } from '../services/api';
import Payslip from '../components/common/Payslip';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'LKR', maximumFractionDigits: 2,
  }).format(val || 0).replace('LKR', 'Rs.');

const currentMonthStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (m) => {
  if (!m) return '';
  // Handles "YYYY-MM" (the month picker value)
  if (/^\d{4}-\d{1,2}$/.test(m)) {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  // Handles a stored month name like "June"
  return m;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl shadow p-5 sm:p-6 flex items-center gap-4 sm:gap-5">
    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500 truncate">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-800 mt-0.5 truncate" title={value}>{value}</p>
    </div>
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Paid: 'bg-green-100 text-green-700',
    Approved: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Payroll = () => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === 'Admin' || user?.role === 'HR';

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    employeeId: '', month: currentMonthStr(),
    allowances: '', deductions: '', loans: '', tax: '', notes: '',
  });
  const [bulkForm, setBulkForm] = useState({
    month: currentMonthStr(), allowanceRate: '10', deductionRate: '0',
  });
  const [editForm, setEditForm] = useState({
    allowances: '', deductions: '', loans: '', tax: '', status: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [payrollRes, summaryRes] = await Promise.all([
        payrollAPI.getAll({ month: selectedMonth }),
        payrollAPI.getSummary(selectedMonth),
      ]);
      setPayrolls(payrollRes.data.data || []);
      setSummary(summaryRes.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payroll data.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await payrollAPI.getEmployees();
      setEmployees(res.data.data || []);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchPayrolls();
    });
  }, [fetchPayrolls]);
  useEffect(() => {
    queueMicrotask(() => {
      fetchEmployees();
    });
  }, [fetchEmployees]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(payrolls.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedPayrolls = payrolls.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [selectedMonth]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  // ── Notifications ──────────────────────────────────────────────────────────
  const notify = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  // ── Create Payroll ─────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payrollAPI.create({
        employeeId: createForm.employeeId,
        month: createForm.month,
        allowances: Number(createForm.allowances) || 0,
        deductions: Number(createForm.deductions) || 0,
        loans: Number(createForm.loans) || 0,
        tax: Number(createForm.tax) || 0,
        notes: createForm.notes,
      });
      notify('Payroll record created successfully!');
      setShowCreateModal(false);
      setCreateForm({ employeeId: '', month: currentMonthStr(), allowances: '', deductions: '', loans: '', tax: '', notes: '' });
      fetchPayrolls();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to create payroll.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Bulk Generate ──────────────────────────────────────────────────────────
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await payrollAPI.generateBulk({
        month: bulkForm.month,
        allowanceRate: Number(bulkForm.allowanceRate) / 100,
        deductionRate: Number(bulkForm.deductionRate) / 100,
      });
      notify(res.data.message);
      setShowBulkModal(false);
      if (bulkForm.month === selectedMonth) fetchPayrolls();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to generate bulk payroll.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (payroll) => {
    setSelectedPayroll(payroll);
    setEditForm({
      allowances: payroll.allowances ?? '',
      deductions: payroll.deductions ?? '',
      loans: payroll.loans ?? '',
      tax: payroll.tax ?? '',
      status: payroll.status || 'Pending',
      notes: payroll.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await payrollAPI.update(selectedPayroll._id, {
        allowances: Number(editForm.allowances) || 0,
        deductions: Number(editForm.deductions) || 0,
        loans: Number(editForm.loans) || 0,
        tax: Number(editForm.tax) || 0,
        status: editForm.status,
        notes: editForm.notes,
      });
      notify('Payroll updated successfully!');
      setShowEditModal(false);
      fetchPayrolls();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update payroll.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete payroll record for ${name}? This cannot be undone.`)) return;
    try {
      await payrollAPI.delete(id);
      notify('Payroll record deleted.');
      fetchPayrolls();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete record.', true);
    }
  };

  // ── View payslip ───────────────────────────────────────────────────────────
  const openPayslip = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayslip(true);
  };

  // ─── Input helper ──────────────────────────────────────────────────────────
  const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Payroll Management</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month filter */}
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
            />
          </div>

          <button
            onClick={fetchPayrolls}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition"
          >
            <RefreshCw size={15} /> Refresh
          </button>

          {isAdminOrHR && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
            >
              <Users size={15} /> Bulk Generate
            </button>
          )}

          {isAdminOrHR && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
            >
              <Plus size={15} /> Add Payroll
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={15} /></button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start justify-between gap-2">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X size={15} /></button>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Employees" value={summary?.totalEmployees ?? 0} color="bg-indigo-500" />
        <StatCard icon={DollarSign} label="Total Net Salary" value={fmt(summary?.totalNetSalary)} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Total Tax Deducted" value={fmt(summary?.totalTax)} color="bg-red-500" />
        <StatCard icon={FileText} label="Gross Payroll" value={fmt((summary?.totalBasicSalary || 0) + (summary?.totalAllowances || 0))} color="bg-amber-500" />
      </div>

      {/* Payroll breakdown mini-summary */}
      {summary && summary.totalEmployees > 0 && (
        <div className="bg-white rounded-2xl shadow p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            {monthLabel(selectedMonth)} — Payroll Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {[
              { label: 'Basic Salary', val: summary.totalBasicSalary, color: 'text-gray-800' },
              { label: 'Allowances', val: summary.totalAllowances, color: 'text-emerald-600' },
              { label: 'Deductions', val: summary.totalDeductions, color: 'text-orange-600' },
              { label: 'Tax (TDS)', val: summary.totalTax, color: 'text-red-600' },
              { label: 'Loans', val: summary.totalLoans, color: 'text-purple-600' },
              { label: 'Net Salary', val: summary.totalNetSalary, color: 'text-indigo-700 font-bold' },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{fmt(item.val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payroll table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            Payroll Records — {monthLabel(selectedMonth)}
          </h2>
          <span className="text-sm text-gray-500">{payrolls.length} record{payrolls.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payrolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <DollarSign size={48} strokeWidth={1} className="mb-3" />
            <p className="text-lg font-medium">No payroll records for {monthLabel(selectedMonth)}</p>
            <p className="text-sm mt-1">
              {isAdminOrHR ? 'Click "Add Payroll" or "Bulk Generate" to get started.' : 'No payroll records found for this month.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Basic</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Allowances</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Deductions</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Loans</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Salary</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedPayrolls.map((p) => {
                  const emp = p.employee || {};
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-800 text-sm">{fullName || '—'}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{emp.employeeId || ''}</div>
                       </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        <div>{emp.department || '—'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{emp.designation || emp.position || emp.role || ''}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-right text-gray-700">{fmt(p.basicSalary)}</td>
                      <td className="px-5 py-4 text-sm text-right text-emerald-600">{fmt(p.allowances)}</td>
                      <td className="px-5 py-4 text-sm text-right text-orange-600">{fmt(p.deductions)}</td>
                      <td className="px-5 py-4 text-sm text-right text-red-600">{fmt(p.tax)}</td>
                      <td className="px-5 py-4 text-sm text-right text-purple-600">{fmt(p.loans)}</td>
                      <td className="px-5 py-4 text-sm text-right font-bold text-indigo-700">{fmt(p.netSalary)}</td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openPayslip(p)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition"
                            title="View Payslip"
                          >
                            <Eye size={16} />
                          </button>
                          {isAdminOrHR && (
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {isAdminOrHR && (
                            <button
                              onClick={() => handleDelete(p._id, fullName)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && payrolls.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm text-gray-500">
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, payrolls.length)} of {payrolls.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                    p === currentPage ? 'bg-indigo-600 text-white' : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ──────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <Modal title="Add Payroll Record" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className={labelCls}>Employee <span className="text-red-500">*</span></label>
              <select
                required
                value={createForm.employeeId}
                onChange={(e) => setCreateForm((f) => ({ ...f, employeeId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId}) — {fmt(emp.salary)}/mo
                  </option>
                ))}
              </select>
              {employees.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No active employees found. Add employees first.</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Month <span className="text-red-500">*</span></label>
              <input
                type="month"
                required
                value={createForm.month}
                onChange={(e) => setCreateForm((f) => ({ ...f, month: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Allowances (Rs)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={createForm.allowances}
                  onChange={(e) => setCreateForm((f) => ({ ...f, allowances: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Deductions (Rs)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={createForm.deductions}
                  onChange={(e) => setCreateForm((f) => ({ ...f, deductions: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tax (Rs)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={createForm.tax}
                  onChange={(e) => setCreateForm((f) => ({ ...f, tax: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Loan Deduction (Rs)</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={createForm.loans}
                  onChange={(e) => setCreateForm((f) => ({ ...f, loans: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700">
              <strong>Formula:</strong> Net Salary = (Basic + Allowances) − (Deductions + Tax + Loans)<br/>
              <span className="text-gray-500">Basic salary is taken from the selected employee&apos;s record. Tax is entered manually.</span>
            </div>

            <div>
              <label className={labelCls}>Notes (optional)</label>
              <textarea
                rows={2}
                placeholder="Any additional notes…"
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                className={inputCls}
              />
            </div>

            <ModalActions onCancel={() => setShowCreateModal(false)} submitting={submitting} label="Create Payroll" />
          </form>
        </Modal>
      )}

      {/* ── BULK MODAL ────────────────────────────────────────────────────────── */}
      {showBulkModal && (
        <Modal title="Bulk Generate Payroll" onClose={() => setShowBulkModal(false)}>
          <form onSubmit={handleBulkGenerate} className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate payroll records for <strong>all active employees</strong> at once. Existing records for the chosen month are skipped.
            </p>

            <div>
              <label className={labelCls}>Month <span className="text-red-500">*</span></label>
              <input
                type="month" required
                value={bulkForm.month}
                onChange={(e) => setBulkForm((f) => ({ ...f, month: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Allowance Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1" placeholder="10"
                  value={bulkForm.allowanceRate}
                  onChange={(e) => setBulkForm((f) => ({ ...f, allowanceRate: e.target.value }))}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">% of basic salary added as allowances</p>
              </div>
              <div>
                <label className={labelCls}>Deduction Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.1" placeholder="0"
                  value={bulkForm.deductionRate}
                  onChange={(e) => setBulkForm((f) => ({ ...f, deductionRate: e.target.value }))}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">% of basic salary as deductions</p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-3 text-xs text-emerald-700">
              Records are created with tax and loans set to 0. Use Edit on any record to add tax or loan deductions afterward.
            </div>

            <ModalActions onCancel={() => setShowBulkModal(false)} submitting={submitting} label="Generate Payroll" color="emerald" />
          </form>
        </Modal>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      {showEditModal && selectedPayroll && (
        <Modal
          title={`Edit Payroll — ${selectedPayroll.employee?.firstName} ${selectedPayroll.employee?.lastName}`}
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
              <strong>Basic Salary:</strong> {fmt(selectedPayroll.basicSalary)} &nbsp;|&nbsp;
              <strong>Month:</strong> {monthLabel(selectedPayroll.month)} {selectedPayroll.year}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Allowances (Rs)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.allowances}
                  onChange={(e) => setEditForm((f) => ({ ...f, allowances: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Deductions (Rs)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.deductions}
                  onChange={(e) => setEditForm((f) => ({ ...f, deductions: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tax (Rs)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.tax}
                  onChange={(e) => setEditForm((f) => ({ ...f, tax: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Loan Deduction (Rs)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.loans}
                  onChange={(e) => setEditForm((f) => ({ ...f, loans: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className={inputCls}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                className={inputCls}
              />
            </div>

            <ModalActions onCancel={() => setShowEditModal(false)} submitting={submitting} label="Save Changes" color="amber" />
          </form>
        </Modal>
      )}

      {/* ── PAYSLIP MODAL ─────────────────────────────────────────────────────── */}
      {showPayslip && selectedPayroll && (
        <Payslip payroll={selectedPayroll} onClose={() => setShowPayslip(false)} />
      )}
    </div>
  );
};

// ─── Shared modal shell ───────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition">
          <X size={18} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const ModalActions = ({ onCancel, submitting, label, color = 'indigo' }) => {
  const colors = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400',
    amber: 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400',
  };
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button" onClick={onCancel}
        className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
      >
        Cancel
      </button>
      <button
        type="submit" disabled={submitting}
        className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition ${colors[color]}`}
      >
        {submitting ? 'Processing…' : label}
      </button>
    </div>
  );
};

export default Payroll;