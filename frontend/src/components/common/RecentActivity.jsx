import React from "react";
import { Clock, FileText, Wallet, UserCheck, ArrowRight } from "lucide-react";

const activities = [
  {
    name: "Kasun Perera",
    action: "checked in at 08:45 AM",
    time: "10 minutes ago",
    icon: UserCheck,
    gradient: "from-emerald-400 to-green-600",
    bg: "bg-emerald-50",
  },
  {
    name: "Nimal Silva",
    action: "applied for Sick Leave",
    time: "35 minutes ago",
    icon: FileText,
    gradient: "from-orange-400 to-red-500",
    bg: "bg-orange-50",
  },
  {
    name: "Payroll",
    action: "processed for April 2026",
    time: "2 hours ago",
    icon: Wallet,
    gradient: "from-purple-500 to-pink-600",
    bg: "bg-purple-50",
  },
  {
    name: "Attendance",
    action: "daily attendance report updated",
    time: "Today",
    icon: Clock,
    gradient: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
          <p className="text-sm text-gray-500">
            Latest employee and system updates
          </p>
        </div>

        <button className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-purple-600 transition">
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              key={index}
              className={`group flex items-center gap-4 p-4 rounded-3xl ${activity.bg} hover:scale-[1.02] transition-all duration-300`}
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activity.gradient} flex items-center justify-center shadow-lg group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}
              >
                <Icon className="text-white" size={22} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-gray-900">
                    {activity.name}
                  </span>{" "}
                  {activity.action}
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>

              <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-pink-500 transition"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;