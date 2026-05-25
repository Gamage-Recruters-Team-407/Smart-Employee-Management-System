import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock } from 'lucide-react';
import SessionTracker from '../../utils/sessionTracker.js';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ userName, userRole, attendanceId }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sessionStatus, setSessionStatus] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  
  // Create session tracker instance (15 minutes timeout)
  const sessionTracker = new SessionTracker(15 * 60 * 1000);

  useEffect(() => {
    // Initialize session tracking
    sessionTracker.startTracking();

    // Set what to do when user becomes inactive
    sessionTracker.setOnInactiveCallback(() => {
      setShowWarning(true);
      handleAutoLogout();
    });

    // Update session status display every 30 seconds
    const statusInterval = setInterval(() => {
      setSessionStatus(sessionTracker.getStatus());
    }, 30000);

    // Cleanup when component unmounts
    return () => {
      clearInterval(statusInterval);
      sessionTracker.stopTracking();
    };
  }, []);

  /**
   * Handle manual logout when user clicks logout button
   */
  const handleLogout = async () => {
    try {
      // Call Context logout (handles check-out and backend invalidation)
      await logout();

      // Clear local storage specific to dashboard session
      localStorage.removeItem('attendanceId');

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if API fails
      navigate('/login');
    }
  };

  /**
   * Handle auto-logout due to inactivity
   */
  const handleAutoLogout = async () => {
    try {
      // Mark employee as inactive in backend
      if (attendanceId) {
        await api.post('/attendance/mark-inactive', {
          attendanceId: attendanceId,
        });
      }

      // Call Context logout to clear Auth state and sync with local storage
      await logout();
      localStorage.removeItem('attendanceId');

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Auto logout error:', error);
      navigate('/login');
    }
  };

  /**
   * Get user initials for avatar
   */
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  };

  return (
    <header className="bg-white shadow-sm z-10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Session Status Indicator */}
        {sessionStatus && (
          <div className="flex items-center gap-2 text-sm">
            {/* Clock icon changes color based on status */}
            <Clock 
              size={18} 
              className={sessionStatus.isActive ? 'text-green-600' : 'text-red-600'} 
            />
            {/* Status text */}
            <span className={sessionStatus.isActive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {sessionStatus.isActive ? '🟢 Active' : '🔴 Inactive'}
            </span>
          </div>
        )}

        {/* User Information */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-medium text-gray-800">{userName || 'User'}</p>
            <p className="text-sm text-gray-500">{userRole || 'Employee'}</p>
          </div>
          {/* User Avatar */}
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
            {getInitials(userName)}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
          title="Logout from the system"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Inactivity Warning Popup */}
      {showWarning && (
        <div className="fixed top-4 right-4 bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="font-bold text-lg">⚠️ Session Expired</p>
          <p className="text-sm">You were logged out due to inactivity (15 minutes)</p>
        </div>
      )}
    </header>
  );
};

export default Navbar;