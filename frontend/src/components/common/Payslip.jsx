import { useRef } from 'react';
import { X, Printer } from 'lucide-react';

const fmt = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val || 0);

const monthLabel = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const Payslip = ({ payroll, onClose }) => {
  const printRef = useRef(null);

  if (!payroll) return null;

  const emp = payroll.employee || {};
  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Payslip - ${fullName} - ${monthLabel(payroll.month)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; }
            .payslip { max-width: 700px; margin: 0 auto; padding: 40px; }
            .header { background: #4f46e5; color: #fff; padding: 28px 32px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: flex-start; }
            .company-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
            .payslip-title { font-size: 13px; opacity: 0.85; margin-top: 4px; }
            .month-badge { background: rgba(255,255,255,0.2); border-radius: 8px; padding: 6px 14px; font-size: 14px; font-weight: 600; }
            .body { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 32px; }
            .emp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; background: #f9fafb; border-radius: 8px; padding: 16px; }
            .emp-row { display: flex; flex-direction: column; }
            .emp-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            .emp-value { font-size: 14px; font-weight: 600; color: #111827; margin-top: 2px; }
            .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
            .section-title { font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .salary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
            .earnings, .deductions-box { background: #f9fafb; border-radius: 8px; padding: 16px; }
            .earnings { border-left: 4px solid #10b981; }
            .deductions-box { border-left: 4px solid #ef4444; }
            .line-item { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
            .line-item:last-child { border-bottom: none; }
            .line-label { color: #4b5563; }
            .line-value { font-weight: 600; color: #111827; }
            .subtotal { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 2px solid #e5e7eb; font-size: 14px; font-weight: 700; }
            .net-salary-box { background: #4f46e5; color: #fff; border-radius: 10px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
            .net-label { font-size: 15px; font-weight: 600; opacity: 0.9; }
            .net-amount { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
            .status-badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 12px; font-size: 12px; margin-top: 6px; }
            .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="payslip">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const grossEarnings = (payroll.basicSalary || 0) + (payroll.allowances || 0);
  const totalDeductions = (payroll.deductions || 0) + (payroll.tax || 0) + (payroll.loans || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-auto">
        {/* Modal header controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Payslip Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm font-medium"
            >
              <Printer size={16} /> Print / Download
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable payslip body */}
        <div className="p-6" ref={printRef}>
          {/* Header */}
          <div className="bg-indigo-600 text-white px-8 py-6 rounded-t-xl flex justify-between items-start">
            <div>
              <div className="text-xl font-bold tracking-wide">SEMS</div>
              <div className="text-sm opacity-80 mt-1">Smart Employee Management System</div>
              <div className="text-xs opacity-70 mt-1">SALARY SLIP</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 text-right">
              <div className="text-sm font-semibold">{monthLabel(payroll.month)}</div>
              <div className="text-xs opacity-80 mt-1">Pay Period</div>
            </div>
          </div>

          {/* Employee info */}
          <div className="border border-t-0 border-gray-200 px-8 py-5 rounded-b-xl">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-gray-50 rounded-xl p-5 mb-6">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Employee Name</div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5">{fullName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Employee ID</div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5 font-mono">{emp.employeeId || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Department</div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5">{emp.department || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Designation</div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5">{emp.designation || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Pay Month</div>
                <div className="text-sm font-semibold text-gray-800 mt-0.5">{monthLabel(payroll.month)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
                <div className="mt-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    payroll.status === 'Paid'
                      ? 'bg-green-100 text-green-700'
                      : payroll.status === 'Processed'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {payroll.status}
                  </span>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 mb-5" />

            {/* Salary breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Earnings */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-4">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-3">Earnings</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Basic Salary</span>
                    <span className="font-semibold">{fmt(payroll.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Allowances</span>
                    <span className="font-semibold">{fmt(payroll.allowances)}</span>
                  </div>
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-emerald-200 text-sm font-bold text-emerald-700">
                  <span>Gross Earnings</span>
                  <span>{fmt(grossEarnings)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4">
                <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">Deductions</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deductions</span>
                    <span className="font-semibold">{fmt(payroll.deductions)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax (TDS)</span>
                    <span className="font-semibold">{fmt(payroll.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Loan Deduction</span>
                    <span className="font-semibold">{fmt(payroll.loans)}</span>
                  </div>
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-red-200 text-sm font-bold text-red-700">
                  <span>Total Deductions</span>
                  <span>{fmt(totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-indigo-600 text-white rounded-xl px-6 py-4 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium opacity-90">Net Salary (Take Home)</div>
                <div className="text-xs opacity-70 mt-0.5">
                  ({fmt(grossEarnings)} − {fmt(totalDeductions)})
                </div>
              </div>
              <div className="text-3xl font-extrabold tracking-tight">{fmt(payroll.netSalary)}</div>
            </div>

            {payroll.notes && (
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</div>
                <p className="text-sm text-gray-700">{payroll.notes}</p>
              </div>
            )}

            <div className="mt-6 text-center text-xs text-gray-400">
              Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; SEMS — Smart Employee Management System
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
