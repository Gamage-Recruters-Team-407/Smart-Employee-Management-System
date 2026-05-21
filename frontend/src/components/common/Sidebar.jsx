import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Clock, Calendar, DollarSign, Award, Settings } from 'lucide-react';

const Sidebar = ({ isOpen, toggle }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Employees', path: '/employees' },
    { icon: Clock, label: 'Attendance', path: '/attendance' },
    { icon: Calendar, label: 'Leaves', path: '/leaves' },
    { icon: DollarSign, label: 'Payroll', path: '/payroll' },
    { icon: Award, label: 'Performance', path: '/performance' },
  ];

  return (
    <div className={`${isOpen ? 'w-64' : 'w-0 lg:w-20'} transition-all duration-300 bg-white border-r h-full overflow-hidden`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <span className={`${isOpen ? 'block' : 'hidden lg:block'} font-bold text-2xl`}>SEMS</span>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${active ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}
              >
                <Icon size={20} />
                <span className={`${isOpen ? 'block' : 'hidden lg:block'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;