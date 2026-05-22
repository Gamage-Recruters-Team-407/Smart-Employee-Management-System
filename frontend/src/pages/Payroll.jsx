import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  Percent, 
  Calendar, 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  RefreshCw, 
  UserPlus,
  TrendingUp
} from 'lucide-react';
import API from '../services/api';
import Payslip from '../components/Payslip';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Modals state
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    tax: 0,
    loans: 0,
    status: 'Pending',
  });

  // Seeding state
  const [seeding, setSeeding] = useState(false);

  // Fetch Payroll and Employees data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollRes, empRes] = await Promise.all([
        API.get(`/payroll?month=${selectedMonth}`),
        API.get('/employees')
      ]);
      setPayrolls(payrollRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Seeding function if database is empty
  const handleSeedEmployees = async () => {
    setSeeding(true);
    const seedEmployees = [
      { firstName: "Arjun", lastName: "Sharma", email: "arjun.sharma@example.com", phone: "9876543210", department: "Engineering", designation: "Senior Software Engineer", salary: 95000, address: "Bangalore", status: "Active" },
      { firstName: "Priya", lastName: "Patel", email: "priya.patel@example.com", phone: "8765432109", department: "Human Resources", designation: "HR Manager", salary: 65000, address: "Mumbai", status: "Active" },
      { firstName: "Rohan", lastName: "Verma", email: "rohan.verma@example.com", phone: "7654321098", department: "Sales", designation: "Sales Executive", salary: 42000, address: "Delhi", status: "Active" },
      { firstName: "Ananya", lastName: "Iyer", email: "ananya.iyer@example.com", phone: "6543210987", department: "Design", designation: "UI/UX Designer", salary: 75000, address: "Chennai", status: "Active" },
      { firstName: "Vikram", lastName: "Singh", email: "vikram.singh@example.com", phone: "5432109876", department: "Engineering", designation: "Tech Lead", salary: 145000, address: "Bangalore", status: "Active" },
    ];

    try {
      let created = 0;
      for (const emp of seedEmployees) {
        try {
          await API.post('/employees', emp);
          created++;
        } catch (e) {
          // If duplicate email, skip silently
        }
      }
      alert(`Seeding complete! Successfully added ${created} demo employees.`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to seed database.");
    } finally {
      setSeeding(false);
    }
  };

  // Generate Payroll for all active employees
  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      const res = await API.post('/payroll/generate', { month: selectedMonth });
      alert(res.data.message);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to generate payroll.");
    } finally {
      setGenerating(false);
    }
  };

  // Edit Payroll record handler
  const handleOpenEditModal = (p) => {
    setEditingPayroll(p);
    setEditForm({
      basicSalary: p.basicSalary,
      allowances: p.allowances,
      deductions: p.deductions,
      tax: p.tax,
      loans: p.loans,
      status: p.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const updated = { ...prev, [name]: name === 'status' ? value : Number(value) };
      return updated;
    });
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/payroll/${editingPayroll._id}`, editForm);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to update payroll record.");
    }
  };

  const handleDeletePayroll = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payroll record?")) return;
    try {
      await API.delete(`/payroll/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete payroll record.");
    }
  };

  // Calculations for summary metrics
  const totalPayrollCost = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalTaxes = payrolls.reduce((sum, p) => sum + p.tax, 0);
  const totalLoans = payrolls.reduce((sum, p) => sum + p.loans, 0);
  const paidCount = payrolls.filter(p => p.status === 'Paid').length;
  const pendingCount = payrolls.filter(p => p.status === 'Pending').length;

  // Dynamically calculate Net Salary preview in the edit form
  const getEditFormNetSalary = () => {
    return Math.max(0, editForm.basicSalary + editForm.allowances - editForm.deductions - editForm.tax - editForm.loans);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header section with month select & generate controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Payroll Management</h1>
          <p className="text-gray-500 mt-2 text-sm">Automated salary calculations, tax (TDS) brackets, loan deductions, and printable payslips.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 border rounded-2xl shadow-sm hover:border-gray-350 transition">
            <Calendar size={18} className="text-indigo-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <button
            onClick={handleGeneratePayroll}
            disabled={generating || employees.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-md shadow-indigo-100 disabled:bg-indigo-300 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
          >
            <RefreshCw size={18} className={generating ? "animate-spin" : ""} />
            {generating ? "Calculating..." : "Generate Payroll"}
          </button>

          {employees.length === 0 && (
            <button
              onClick={handleSeedEmployees}
              disabled={seeding}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold shadow-md shadow-emerald-100 disabled:bg-emerald-350 transition duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              <UserPlus size={18} className={seeding ? "animate-pulse" : ""} />
              {seeding ? "Adding..." : "Add Demo Employees"}
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Cost */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-gray-200 transition duration-300">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Payroll Cost</p>
            <h3 className="text-2xl font-extrabold text-indigo-650 font-mono">₹{totalPayrollCost.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-gray-400">Net payable for {new Date(selectedMonth + "-02").toLocaleString("default", { month: "short", year: "numeric" })}</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <CreditCard size={24} />
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-gray-200 transition duration-300">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payroll Count</p>
            <h3 className="text-2xl font-extrabold text-gray-800 font-mono">{payrolls.length} <span className="text-sm font-normal text-gray-500">Employees</span></h3>
            <p className="text-xs text-gray-450">
              <span className="text-emerald-600 font-bold">{paidCount} Paid</span> • <span className="text-rose-500 font-bold">{pendingCount} Unpaid</span>
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl text-gray-650">
            <Users size={24} />
          </div>
        </div>

        {/* Taxes Deducted */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-gray-200 transition duration-300">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">TDS (Income Tax)</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 font-mono">₹{totalTaxes.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-gray-400">Total TDS collected at source</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
            <Percent size={24} />
          </div>
        </div>

        {/* Loan Deductions */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-gray-200 transition duration-300">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Loan Recoveries</p>
            <h3 className="text-2xl font-extrabold text-amber-600 font-mono">₹{totalLoans.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-gray-400">Recovered loan installments</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Payroll Details Listing</h3>
          <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-650 rounded-full">
            {payrolls.length} Records Found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching payroll records...</span>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <p className="text-gray-450 font-medium">No payroll records exist for this month.</p>
            {employees.length > 0 ? (
              <button
                onClick={handleGeneratePayroll}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition"
              >
                Auto-Generate Payroll for {new Date(selectedMonth + "-02").toLocaleString("default", { month: "long" })}
              </button>
            ) : (
              <div className="max-w-md mx-auto space-y-3">
                <p className="text-xs text-gray-400">You must register or seed employees first to run payroll calculations.</p>
                <button
                  onClick={handleSeedEmployees}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition inline-flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Seed Demo Employees
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b text-gray-500 text-xs font-bold uppercase tracking-wider text-left">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Basic Salary</th>
                  <th className="px-6 py-4">Allowances</th>
                  <th className="px-6 py-4">Tax (TDS)</th>
                  <th className="px-6 py-4">Loans</th>
                  <th className="px-6 py-4">Net Salary</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {payrolls.map((p) => {
                  const empName = p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : "Unknown";
                  const empId = p.employee ? p.employee.employeeId : "N/A";
                  const empDept = p.employee ? p.employee.department : "N/A";
                  const empDesg = p.employee ? p.employee.designation : "N/A";

                  return (
                    <tr key={p._id} className="hover:bg-gray-50/30 transition duration-150">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">{empName}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{empId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-700 font-medium">{empDept}</p>
                          <p className="text-xs text-gray-400">{empDesg}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-650">₹{p.basicSalary.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-mono text-gray-650">₹{p.allowances.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-mono text-rose-500">₹{p.tax.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-mono text-amber-600">₹{p.loans.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900">₹{p.netSalary.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'Paid' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setSelectedPayslip(p)}
                            title="View Payslip"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Record"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePayroll(p._id)}
                            title="Delete"
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Payroll Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-gray-150 animate-scaleUp">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Edit Payroll calculations</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-250 transition"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Basic Salary</label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={editForm.basicSalary}
                    onChange={handleEditChange}
                    className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Allowances</label>
                  <input
                    type="number"
                    name="allowances"
                    value={editForm.allowances}
                    onChange={handleEditChange}
                    className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deductions (PF + PT)</label>
                  <input
                    type="number"
                    name="deductions"
                    value={editForm.deductions}
                    onChange={handleEditChange}
                    className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Income Tax (TDS)</label>
                  <input
                    type="number"
                    name="tax"
                    value={editForm.tax}
                    onChange={handleEditChange}
                    className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loan Deductions</label>
                  <input
                    type="number"
                    name="loans"
                    value={editForm.loans}
                    onChange={handleEditChange}
                    className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    className="w-full border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-medium bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Net Salary Preview */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl flex justify-between items-center border border-indigo-100">
                <div>
                  <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Recalculated Net Salary</p>
                  <p className="text-2xl font-black font-mono text-indigo-900 mt-1">₹{getEditFormNetSalary().toLocaleString('en-IN')}</p>
                </div>
                <span className="text-xs text-gray-400 italic">Auto-calculated</span>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 border rounded-xl font-semibold hover:bg-gray-50 transition text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-150 transition"
                >
                  Save Calculations
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip preview modal */}
      {selectedPayslip && (
        <Payslip 
          payroll={selectedPayslip} 
          onClose={() => setSelectedPayslip(null)} 
        />
      )}
    </div>
  );
};

export default Payroll;