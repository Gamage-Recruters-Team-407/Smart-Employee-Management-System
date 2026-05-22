import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { BASE_URL } from '../services/api';

// Client-side helper to convert numbers to words (Indian numbering format)
const numberToWordsClient = (num) => {
  if (num === 0) return "Zero Rupees only";
  
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertLessThanThousand = (n) => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit !== 0 ? "-" + a[digit] : "") + " ";
  };

  try {
    let n = Math.floor(num);
    let str = "";
    
    // Crore (10,00,00,00)
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    if (crore > 0) {
      str += convertLessThanThousand(crore) + "crore ";
    }

    // Lakh (1,00,000)
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    if (lakh > 0) {
      str += convertLessThanThousand(lakh) + "lakh ";
    }

    // Thousand (1,000)
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    if (thousand > 0) {
      str += convertLessThanThousand(thousand) + "thousand ";
    }

    // Hundred (100)
    const hundred = Math.floor(n / 100);
    n %= 100;
    if (hundred > 0) {
      str += convertLessThanThousand(hundred) + "hundred ";
    }

    // Tens and Ones
    if (n > 0) {
      if (str !== "") str += "and ";
      str += convertLessThanThousand(n);
    }

    const words = str.trim() + " Rupees only";
    return words.charAt(0).toUpperCase() + words.slice(1);
  } catch (error) {
    return num + " Rupees only";
  }
};

const Payslip = ({ payroll, onClose }) => {
  if (!payroll) return null;

  const emp = payroll.employee || {};
  const monthName = new Date(payroll.month + "-02").toLocaleString("default", { month: "long", year: "numeric" });
  
  const pt = 200;
  const pf = Math.max(0, Math.round(payroll.deductions - pt));
  
  const totalEarnings = payroll.basicSalary + payroll.allowances;
  const totalDeductions = pf + pt + payroll.tax + payroll.loans;

  const handleDownload = () => {
    window.open(`${BASE_URL}/payroll/${payroll._id}/payslip`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl mx-auto my-8 overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Controls */}
        <div className="px-8 py-4 bg-gray-50 border-b flex justify-between items-center print:hidden">
          <h3 className="font-bold text-gray-800 text-lg">Payslip Preview</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium shadow-sm shadow-indigo-100"
            >
              <Download size={16} />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200/50 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Payslip Document (Printable area) */}
        <div id="printable-payslip" className="p-8 md:p-12 overflow-y-auto flex-1 text-gray-800 font-sans print:p-0 print:overflow-visible">
          {/* Header Banner */}
          <div className="bg-indigo-600 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black tracking-tight">SMART INFOTECH</h1>
              <p className="text-indigo-100 text-xs mt-1">Smart Employee & Payroll Management System</p>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-xl font-bold tracking-wide">PAYSLIP</h2>
              <p className="text-indigo-150 text-sm font-semibold">{monthName}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm bg-gray-50 p-4 rounded-xl border border-gray-150/60 print:bg-transparent print:border-none print:p-0">
            <div>
              <p className="text-gray-500 font-medium text-xs">PAYROLL MONTH</p>
              <p className="font-bold text-gray-850 mt-0.5">{monthName}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-xs">STATUS</p>
              <p className={`font-bold mt-0.5 ${payroll.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {payroll.status}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-xs">GENERATED DATE</p>
              <p className="font-bold text-gray-850 mt-0.5">{new Date(payroll.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium text-xs">PAYMENT DATE</p>
              <p className="font-bold text-gray-850 mt-0.5">
                {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Employee Info Block */}
          <h3 className="text-sm font-black text-gray-400 tracking-wider mb-4">EMPLOYEE INFORMATION</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-8 pb-6 border-b text-sm">
            <div className="flex justify-between md:justify-start border-b md:border-b-0 py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Employee ID:</span>
              <span className="font-semibold font-mono">{emp.employeeId || 'N/A'}</span>
            </div>
            <div className="flex justify-between md:justify-start border-b md:border-b-0 py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Department:</span>
              <span className="font-semibold">{emp.department || 'N/A'}</span>
            </div>
            <div className="flex justify-between md:justify-start border-b md:border-b-0 py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Full Name:</span>
              <span className="font-semibold">{emp.firstName} {emp.lastName}</span>
            </div>
            <div className="flex justify-between md:justify-start border-b md:border-b-0 py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Designation:</span>
              <span className="font-semibold">{emp.designation || 'N/A'}</span>
            </div>
            <div className="flex justify-between md:justify-start border-b md:border-b-0 py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Email Address:</span>
              <span className="font-semibold">{emp.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between md:justify-start border-b md:border-b-0 py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Phone Number:</span>
              <span className="font-semibold">{emp.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between md:justify-start py-2 md:py-0">
              <span className="text-gray-500 w-32 font-medium">Joining Date:</span>
              <span className="font-semibold">
                {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Earnings vs Deductions Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-sm">
            {/* Earnings */}
            <div className="flex flex-col border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between font-bold text-gray-700">
                <span>EARNINGS</span>
                <span>Amount (INR)</span>
              </div>
              <div className="p-4 space-y-3 flex-1">
                <div className="flex justify-between text-gray-650">
                  <span>Basic Salary</span>
                  <span className="font-semibold font-mono">₹{payroll.basicSalary.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-gray-650">
                  <span>Allowances (HRA & Medical)</span>
                  <span className="font-semibold font-mono">₹{payroll.allowances.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
              <div className="bg-indigo-50/50 px-4 py-3 border-t flex justify-between font-bold text-indigo-900">
                <span>Total Earnings</span>
                <span className="font-mono">₹{totalEarnings.toLocaleString('en-IN')}.00</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="flex flex-col border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between font-bold text-gray-700">
                <span>DEDUCTIONS</span>
                <span>Amount (INR)</span>
              </div>
              <div className="p-4 space-y-3 flex-1">
                <div className="flex justify-between text-gray-650">
                  <span>Provident Fund (PF)</span>
                  <span className="font-semibold font-mono">₹{pf.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-gray-650">
                  <span>Professional Tax (PT)</span>
                  <span className="font-semibold font-mono">₹{pt.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-gray-650">
                  <span>Income Tax (TDS)</span>
                  <span className="font-semibold font-mono">₹{payroll.tax.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-gray-650">
                  <span>Loan Deductions</span>
                  <span className="font-semibold font-mono">₹{payroll.loans.toLocaleString('en-IN')}.00</span>
                </div>
              </div>
              <div className="bg-rose-50/30 px-4 py-3 border-t flex justify-between font-bold text-rose-900">
                <span>Total Deductions</span>
                <span className="font-mono">₹{totalDeductions.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>

          {/* Net Salary Area */}
          <div className="bg-emerald-50 text-emerald-950 p-6 rounded-2xl border border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <p className="text-emerald-800 font-bold text-xs uppercase tracking-wider">NET SALARY PAYABLE</p>
              <h2 className="text-3xl font-black font-mono mt-1 text-emerald-900">
                ₹{payroll.netSalary.toLocaleString('en-IN')}.00
              </h2>
            </div>
            <div className="text-left md:text-right max-w-md">
              <span className="text-xs text-emerald-800 font-medium">In Words:</span>
              <p className="font-semibold text-sm italic leading-relaxed text-emerald-900 mt-0.5">
                {numberToWordsClient(payroll.netSalary)}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-16 border-t border-dashed mt-16 text-center text-sm">
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-gray-300 mb-2"></div>
              <span className="text-gray-500 font-medium">Employer Signature</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-48 border-b border-gray-300 mb-2"></div>
              <span className="text-gray-500 font-medium">Employee Signature</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-12 print:mt-16">
            This is a computer-generated document and does not require a physical signature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Payslip;
