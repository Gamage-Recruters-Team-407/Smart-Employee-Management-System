import DashboardStats from "./DashboardStats";
import RecentActivity from "./RecentActivity";
import { Bell, CalendarDays, Download, Plus } from "lucide-react";

const DashboardHome = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-indigo-100 text-sm font-medium">
              Smart Employee Management System
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold mt-2">
              Welcome back, Admin 👋
            </h1>
            <p className="text-indigo-100 mt-3 max-w-2xl">
              Monitor employee attendance, leave requests, payroll updates, and
              performance insights from one dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <DashboardStats />

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentActivity />
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-5">
            Quick Overview
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell className="text-indigo-600" size={22} />
                <div>
                  <p className="font-medium text-gray-800">Notifications</p>
                  <p className="text-sm text-gray-500">5 new alerts</p>
                </div>
              </div>
              <span className="text-indigo-600 font-bold">5</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-orange-600" size={22} />
                <div>
                  <p className="font-medium text-gray-800">Pending Leaves</p>
                  <p className="text-sm text-gray-500">Awaiting approval</p>
                </div>
              </div>
              <span className="text-orange-600 font-bold">12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;