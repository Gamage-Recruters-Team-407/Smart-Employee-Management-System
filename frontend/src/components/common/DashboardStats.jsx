import React from "react";
import { Users, Clock, CalendarCheck, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Total Employees",
    value: "248",
    change: "+12 this month",
    icon: Users,
    gradient: "from-indigo-500 to-blue-600",
    bg: "from-indigo-50 to-blue-50",
    text: "text-indigo-600",
  },
  {
    title: "Present Today",
    value: "212",
    change: "85% attendance",
    icon: Clock,
    gradient: "from-emerald-500 to-green-600",
    bg: "from-emerald-50 to-green-50",
    text: "text-emerald-600",
  },
  {
    title: "On Leave",
    value: "18",
    change: "7 pending requests",
    icon: CalendarCheck,
    gradient: "from-orange-400 to-red-500",
    bg: "from-orange-50 to-red-50",
    text: "text-orange-600",
  },
  {
    title: "Avg Performance",
    value: "4.7",
    change: "+0.4 improvement",
    icon: TrendingUp,
    gradient: "from-purple-500 to-pink-600",
    bg: "from-purple-50 to-pink-50",
    text: "text-purple-600",
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
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} rounded-[2rem] p-6 shadow-lg border border-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group`}
          >
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/60 rounded-full group-hover:scale-125 transition duration-500"></div>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">
                  {stat.title}
                </p>

                <h2 className="text-4xl font-extrabold text-gray-900 mt-3">
                  {stat.value}
                </h2>

                <p className={`text-sm font-medium mt-3 ${stat.text}`}>
                  {stat.change}
                </p>
              </div>

              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:rotate-6 group-hover:scale-110 transition-all duration-300`}
              >
                <Icon className="text-white" size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;