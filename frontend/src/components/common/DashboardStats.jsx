import React from "react";
import { Users, Clock, CalendarCheck, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Employees",
    value: "248",
    change: "+12 this month",
    icon: Users,
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    title: "Present Today",
    value: "212",
    change: "85% attendance",
    icon: Clock,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "On Leave",
    value: "18",
    change: "7 pending requests",
    icon: CalendarCheck,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Avg Performance",
    value: "4.7",
    change: "+0.4 improvement",
    icon: TrendingUp,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mt-3">
                  {stat.value}
                </h2>
                <p className="text-sm text-gray-500 mt-2">{stat.change}</p>
              </div>

              <div className={`${stat.bgColor} p-3 rounded-2xl`}>
                <Icon className={`${stat.iconColor}`} size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;