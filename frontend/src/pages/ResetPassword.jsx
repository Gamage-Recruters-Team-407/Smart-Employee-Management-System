// pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    // Verify token on component mount
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setError('Invalid or missing reset token');
        setVerifying(false);
        return;
      }
      
      try {
        await authAPI.verifyResetToken(token);
        setIsTokenValid(true);
      } catch (err) {
        const errorMessage = err.response?.data?.message;
        if (errorMessage?.includes('expired')) {
          setError('This reset link has expired. Please request a new one.');
        } else {
          setError('Invalid reset link. Please request a new one.');
        }
        setIsTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyToken();
  }, [token]);

  // Password strength validation
  const validatePasswordStrength = (pwd) => {
    const errors = [];
    
    if (pwd.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push('one special character');
    }
    
    return errors;
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, text: '', color: '' };
    
    const errors = validatePasswordStrength(pwd);
    const strength = 5 - errors.length;
    
    if (strength <= 2) return { level: 1, text: 'Weak', color: 'text-red-600', bg: 'bg-red-100', width: '25%' };
    if (strength === 3) return { level: 2, text: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100', width: '50%' };
    if (strength === 4) return { level: 3, text: 'Good', color: 'text-blue-600', bg: 'bg-blue-100', width: '75%' };
    return { level: 4, text: 'Strong', color: 'text-green-600', bg: 'bg-green-100', width: '100%' };
  };

  const validateForm = () => {
    const errors = {};
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else {
      const strengthErrors = validatePasswordStrength(password);
      if (strengthErrors.length > 0) {
        errors.password = `Password must contain: ${strengthErrors.join(', ')}`;
      }
    }
    
    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message;
      
      if (errorMessage?.includes('expired')) {
        setError('This reset link has expired. Please request a new one.');
        setIsTokenValid(false);
      } else if (errorMessage?.includes('invalid')) {
        setError('Invalid reset link. Please request a new one.');
        setIsTokenValid(false);
      } else {
        setError(errorMessage || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  // Show loading while verifying token
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
            <div className="text-center">
              <Loader2 size={40} className="animate-spin text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verifying Reset Link...
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we verify your reset link.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invalid Reset Link
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {error || 'This password reset link is invalid or has expired.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-md transition duration-200 text-sm"
                >
                  Request New Reset Link
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 rounded-xl transition duration-200 text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Password Reset Successful!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your password has been successfully reset.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-blue-700">
                  Redirecting you to login page in a few seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-md transition duration-200 text-sm"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create New Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="Enter new password"
                  className={`w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                    ${fieldErrors.password ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.level === 1 ? 'bg-red-500' : passwordStrength.level === 2 ? 'bg-yellow-500' : passwordStrength.level === 3 ? 'bg-blue-500' : 'bg-green-500'}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  
                  {/* Password requirements checklist */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} className={password.length >= 8 ? 'text-green-500' : 'text-gray-300'} />
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} className={/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'} />
                      <span>Uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} className={/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-300'} />
                      <span>Lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} className={/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-300'} />
                      <span>Number</span>
                    </div>
                    <div className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle size={12} className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : 'text-gray-300'} />
                      <span>Special character</span>
                    </div>
                  </div>
                </div>
              )}
              
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>
            
            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="Confirm your new password"
                  className={`w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                    ${fieldErrors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>
            
            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield size={16} className="text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  For security, this reset link will expire in 1 hour. Make sure to choose a strong password you haven't used before.
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-100 transition duration-200 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;