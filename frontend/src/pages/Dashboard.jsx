import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import DashboardStats from '../components/common/DashboardStats';
import RecentActivity from '../components/common/RecentActivity';
import Navbar from '../components/common/Navbar';
import { Menu, X } from 'lucide-react';
import { Outlet } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
    // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const attendanceId = localStorage.getItem('attendanceId');

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          userName={userData.name} 
          userRole={userData.role} 
          attendanceId={attendanceId}
        />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
