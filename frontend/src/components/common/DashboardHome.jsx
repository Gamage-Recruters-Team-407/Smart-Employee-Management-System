import React, { useEffect, useState } from 'react';
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { User, Briefcase, Award, Clock } from 'lucide-react';
import DashboardStats from "./DashboardStats";
import RecentActivity from "./RecentActivity";

const DashboardHome = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'Employee') {
      const fetchEmployee = async () => {
        setLoading(true);
        try {
          const res = await API.get('/employees');
          const emp = res.data.find(e => e.email?.toLowerCase() === user.email?.toLowerCase());
          setEmployee(emp);
        } catch (err) {
          console.error("Error fetching employee profile:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    }
  }, [user]);

  if (user?.role === 'Employee') {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {user.name}!</h1>
            <p className="text-indigo-200 text-sm mt-2">Manage your daily attendance, apply for leaves, and track your performance reviews below.</p>
          </div>
        </div>

        {/* Profile Card / Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Department</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{loading ? 'Loading...' : (employee?.department || 'Engineering')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
              <User size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Designation</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{loading ? 'Loading...' : (employee?.designation || 'Software Engineer')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-orange-50 text-orange-650 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Status</p>
              <p className="text-lg font-bold text-gray-850 mt-1">{loading ? 'Loading...' : (employee?.status || 'Active')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 text-purple-650 rounded-xl">
              <Award size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Joining Date</p>
              <p className="text-sm font-bold text-gray-850 mt-1">
                {loading ? 'Loading...' : (employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '01/01/2025')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions / Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">My Workspace Shortcuts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a href="/attendance" className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors flex flex-col justify-between group">
              <span className="font-bold text-gray-700 group-hover:text-indigo-650 transition-colors">Daily Attendance Board &rarr;</span>
              <span className="text-xs text-gray-500 mt-1">View your check-in history and mark manual logs if permitted.</span>
            </a>
            <a href="/leaves" className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-100 transition-colors flex flex-col justify-between group">
              <span className="font-bold text-gray-700 group-hover:text-indigo-650 transition-colors">Leave Requests Portal &rarr;</span>
              <span className="text-xs text-gray-500 mt-1">Apply for casual, sick, or annual leaves and view approval status.</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecentActivity />
      </div>
    </>
  );
};

export default DashboardHome;