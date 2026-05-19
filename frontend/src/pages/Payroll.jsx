import React from 'react';

const Payroll = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Payroll Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow text-center">
          <h3 className="text-2xl font-bold text-green-600">₹12,45,000</h3>
          <p className="text-gray-500">Total Payroll This Month</p>
        </div>
      </div>
    </div>
  );
};

export default Payroll;