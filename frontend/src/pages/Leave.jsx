import React, { useState } from 'react';

const Leave = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaves, setLeaves] = useState([]);

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachment: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, attachment: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Connect with backend later
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) data.append(key, formData[key]);
    });

    console.log('Leave Application Submitted:', formData);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    alert('Leave application submitted successfully!');

    // Reset form and close modal
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachment: null,
    });
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form when closing modal
    setFormData({
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: '',
      attachment: null,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Leave Management</h1>

      {/* Apply New Leave Button */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition duration-200 flex items-center gap-2"
        >
          + Apply New Leave
        </button>
      </div>

      <div className='bg-white rounded-2xl shadow overflow-hidden'>
        <div className='overflow-x-auto'>
            <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                    <tr>
                        <th className="px-6 py-4 text-left">Employee ID</th>
                        <th className="px-6 py-4 text-left">Employee Name</th>
                        <th className="px-6 py-4 text-left">Leave Type</th>
                        <th className="px-6 py-4 text-center">Sart Date</th>
                        <th className="px-6 py-4 text-center">End Date</th>
                        <th className="px-6 py-4 text-center">Number of Days</th>
                        <th className="px-6 py-4 text-center">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {leaves.map((leave) => {
                        <tr key={leave._id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono">{leave.employeeId}</td>
                            <td className="px-6 py-4 font-medium">{leave.name}</td>
                            <td className="px-6 py-4 text-gray-600">{leave.startDate}</td>
                            <td className="px-6 py-4 text-gray-600">{leave.endDate}</td>
                            <td className="px-6 py-4 text-gray-600">{leave.numberOfDays}</td>
                            <td className="px-6 py-4 text-gray-600">{leave.reason}</td>
                        </tr>
                    })}
                    
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Apply New Leave</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Leave Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Leave Type</option>
                      <option value="Annual">Annual Leave</option>
                      <option value="Sick">Sick Leave</option>
                      <option value="Casual">Casual Leave</option>
                      <option value="Maternity">Maternity Leave</option>
                      <option value="Paternity">Paternity Leave</option>
                      <option value="Unpaid">Unpaid Leave</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Number of Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Days
                    </label>
                    <input
                      type="text"
                      value={
                        formData.startDate && formData.endDate
                          ? Math.ceil(
                              (new Date(formData.endDate) - new Date(formData.startDate)) /
                                (1000 * 60 * 60 * 24)
                            ) + 1
                          : ''
                      }
                      disabled
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Please explain your reason for leave..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                {/* Attachment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachment (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 file:mr-4 file:py-2 file:px-6 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can upload medical certificate, documents etc. (PDF, JPG, PNG)
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leave;