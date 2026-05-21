import React from 'react';
import { Users, Clock, CalendarCheck, TrendingUp } from 'lucide-react';

const stats = [
  { title: "Total Employees", value: "248", icon: Users, color: "indigo" },
  { title: "Present Today", value: "212", icon: Clock, color: "green" },
  { title: "On Leave", value: "18", icon: CalendarCheck, color: "orange" },
  { title: "Avg Performance", value: "4.7", icon: TrendingUp, color: "purple" },
];

const DashboardStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {stats.map((stat, i) => (
      <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-gray-500">{stat.title}</p>
            <p className="text-4xl font-bold mt-3">{stat.value}</p>
          </div>
          <stat.icon className={`w-10 h-10 text-${stat.color}-600`} />
        </div>
      </div>
    ))}
  </div>
);

export default DashboardStats;