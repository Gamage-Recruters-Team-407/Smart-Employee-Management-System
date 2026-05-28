import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ userName, userRole }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    </header>
  );
};

export default Navbar;