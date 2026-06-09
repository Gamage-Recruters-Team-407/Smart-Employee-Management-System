import { useState, useEffect } from 'react';
import { Users, Clock, CalendarCheck, TrendingUp } from 'lucide-react';
import API from '../../services/api';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0, presentToday: 0, onLeave: 0, avgPerformance: 0
  });

  useEffect(() => {
    API.get('/dashboard/stats')
      .then(res => setStats(res.data.data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  const cards = [
    { title: "Total Employees", value: stats.totalEmployees, icon: Users, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
    { title: "Present Today", value: stats.presentToday, icon: Clock, iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    { title: "On Leave", value: stats.onLeave, icon: CalendarCheck, iconBg: "bg-orange-100", iconColor: "text-orange-500" },
    { title: "Avg Performance", value: stats.avgPerformance, icon: TrendingUp, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
              <p className="text-4xl font-bold text-gray-800">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.iconBg}`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;