import React from "react";
import { Clock, FileText, Wallet, UserCheck } from "lucide-react";

const activities = [
  {
    name: "Kasun Perera",
    action: "checked in at 08:45 AM",
    time: "10 minutes ago",
    icon: UserCheck,
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    name: "Nimal Silva",
    action: "applied for Sick Leave",
    time: "35 minutes ago",
    icon: FileText,
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    name: "Payroll",
    action: "processed for April 2026",
    time: "2 hours ago",
    icon: Wallet,
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    name: "Attendance",
    action: "daily attendance report updated",
    time: "Today",
    icon: Clock,
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Recent Activity
          </h3>
          <p className="text-sm text-gray-500">
            Latest system and employee updates
          </p>
        </div>

        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition"
            >
              <div className={`${activity.bgColor} p-3 rounded-2xl`}>
                <Icon className={activity.iconColor} size={22} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">
                    {activity.name}
                  </span>{" "}
                  {activity.action}
                </p>
                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;