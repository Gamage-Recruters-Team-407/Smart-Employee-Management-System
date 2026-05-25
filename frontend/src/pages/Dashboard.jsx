import React, { useState } from 'react';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import { Outlet } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get user data safely from local or session storage
  let userData = {};
  try {
    let rawUser = localStorage.getItem('user');
    if (rawUser === 'undefined') {
      localStorage.removeItem('user');
      rawUser = null;
    }
    if (!rawUser) {
      rawUser = sessionStorage.getItem('user');
      if (rawUser === 'undefined') {
        sessionStorage.removeItem('user');
        rawUser = null;
      }
    }
    if (rawUser) {
      userData = JSON.parse(rawUser);
    }
  } catch (e) {
    console.error("Failed to parse user data:", e);
  }
  
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar 
          userName={userData.name} 
          userRole={userData.role} 
        />

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
