import React from "react";

const AttendanceTable = ({ employees, attendanceData, markAttendance, loading }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-50 text-green-700 border border-green-200";
      case "Absent":
        return "bg-red-50 text-red-700 border border-red-200";
      case "Late":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Half-Day":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-gray-50 text-gray-500 border border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading attendance sheet...</span>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 font-medium bg-gray-50 border-t border-b">
        No employees found. Add employees in the system to track their attendance.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 -mb-6">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50/70 border-y border-gray-100">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Employee ID
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Employee Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Check In
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Check Out
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100/60">
          {employees.map((emp) => {
            // Find matching attendance record for the employee
            const record = attendanceData.find(
              (a) => a.employee?._id === emp._id || a.employee?.employeeId === emp.employeeId
            );
            
            const currentStatus = record?.status || "Not Marked";

            return (
              <tr key={emp._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-gray-700 font-medium">
                  {emp.employeeId}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                  {emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {emp.department || "N/A"}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      currentStatus
                    )}`}
                  >
                    {currentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                  {record?.checkInTime || "-"}
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                  {record?.checkOutTime || "-"}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => markAttendance(emp.employeeId, "Present")}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-100"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(emp.employeeId, "Absent")}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-100"
                    >
                      Absent
                    </button>
                    <button
                      onClick={() => markAttendance(emp.employeeId, "Late")}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all shadow-sm shadow-amber-100"
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
  );
};

export default AttendanceTable;
