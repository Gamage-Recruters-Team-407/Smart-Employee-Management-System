import React, { useState, useEffect } from 'react';
// import API from '../services/api';
import { format, subDays } from 'date-fns';

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  // Fetch Employees
//   useEffect(() => {
//     const fetchEmployees = async () => {
//       try {
//         const res = await API.get('/employees');
//         setEmployees(res.data);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchEmployees();
//   }, []);

  // Fetch Attendance for selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/attendance?date=${selectedDate}`);
        setAttendanceData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedDate]);

  const markAttendance = async (employeeId, status) => {
    try {
      await API.post('/attendance', {
        employee: employeeId,
        date: selectedDate,
        status: status,
        checkInTime: status === 'Present' ? '09:00' : null
      });

      // Refresh attendance
      const res = await API.get(`/attendance?date=${selectedDate}`);
      setAttendanceData(res.data);
    } catch (error) {
      alert('Failed to mark attendance');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-700';
      case 'Absent': return 'bg-red-100 text-red-700';
      case 'Late': return 'bg-yellow-100 text-yellow-700';
      case 'Half-Day': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Attendance Sheet</h1>
        
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-xl focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
          >
            Today
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Employee ID</th>
                <th className="px-6 py-4 text-left">Employee Name</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Check In</th>
                <th className="px-6 py-4 text-center">Check Out</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const record = attendanceData.find(a => a.employee?._id === emp._id || a.employee === emp._id);
                const currentStatus = record?.status || 'Not Marked';

                return (
                  <tr key={emp._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono">{emp.employeeId}</td>
                    <td className="px-6 py-4 font-medium">{emp.name}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.department}</td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(currentStatus)}`}>
                        {currentStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center text-gray-600">
                      {record?.checkInTime || '-'}
                    </td>

                    <td className="px-6 py-4 text-center text-gray-600">
                      {record?.checkOutTime || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => markAttendance(emp._id, 'Present')}
                          className="px-4 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => markAttendance(emp._id, 'Absent')}
                          className="px-4 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => markAttendance(emp._id, 'Late')}
                          className="px-4 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="text-center mt-4">Loading attendance...</p>}
    </div>
  );
};

export default Attendance;