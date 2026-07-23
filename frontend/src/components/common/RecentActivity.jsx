import { useState, useEffect } from 'react';
import { Clock, Calendar, Activity } from 'lucide-react';
import API from '../../services/api';

const iconMap = {
  attendance: { icon: Clock, bg: "bg-emerald-50", color: "text-emerald-600" },
  leave: { icon: Calendar, bg: "bg-orange-50", color: "text-orange-600" },
  default: { icon: Activity, bg: "bg-indigo-50", color: "text-indigo-600" },
};

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    API.get('/dashboard/activity')
      .then(res => setActivities(res.data.data))
      .catch(err => console.error('Failed to fetch activity:', err));
  }, []);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-gray-800">Recent Activity</h3>
        <span className="text-xs text-gray-400">{activities.length} events</span>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-400 text-sm">No recent activity.</p>
        ) : (
          activities.map((a, i) => {
            const style = iconMap[a.type] || iconMap.default;
            const Icon = style.icon;
            return (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                  <Icon className={`w-4 h-4 ${style.color}`} />
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{a.name}</span> {a.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivity;