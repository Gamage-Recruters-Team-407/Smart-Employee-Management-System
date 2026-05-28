// pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePasswordStrength = (pwd) => {
    const errors = [];
    
    if (pwd.length < 6) {
      errors.push('at least 6 characters');
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
    
    return errors;
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, text: '', color: '' };
    
    const errors = validatePasswordStrength(pwd);
    const strength = 4 - errors.length;
    
    if (strength <= 1) return { level: 1, text: 'Weak', color: 'text-red-600', width: '25%' };
    if (strength === 2) return { level: 2, text: 'Fair', color: 'text-yellow-600', width: '50%' };
    if (strength === 3) return { level: 3, text: 'Good', color: 'text-blue-600', width: '75%' };
    return { level: 4, text: 'Strong', color: 'text-green-600', width: '100%' };
  };

  // Step 1: Send Reset Code to Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.forgotPassword(email);
      setSuccessMessage(`Reset code sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Reset Password
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!resetCode.trim()) {
      setError('Please enter the reset code');
      return;
    }
    
    if (resetCode.length !== 6) {
      setError('Reset code must be 6 digits');
      return;
    }
    
    setLoading(true);
    
    try {
      // Verify the code
      await authAPI.verifyResetCode(email, resetCode);
      setStep(3);
      setSuccessMessage('Code verified! Please enter your new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    const errors = {};
    
    if (!newPassword) {
      errors.newPassword = 'Password is required';
    } else {
      const strengthErrors = validatePasswordStrength(newPassword);
      if (strengthErrors.length > 0) {
        errors.newPassword = `Password must contain: ${strengthErrors.join(', ')}`;
      }
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
      await authAPI.resetPasswordWithCode(email, resetCode, newPassword);
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
        </div>
        
        {step === 1 && (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a reset code
            </p>
          </>
        )}
        
        {step === 2 && (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Enter Reset Code
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
          </>
        )}
        
        {step === 3 && (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your new password below
            </p>
          </>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          
          {successMessage && (
            <div className="mb-4 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              <CheckCircle size={18} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          
          {error && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="you@company.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm"
                    disabled={loading}
                  />
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
                    Sending reset code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
              
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  <ArrowLeft size={16} />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Code Verification Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Code
                </label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="resetCode"
                    type="text"
                    value={resetCode}
                    onChange={(e) => {
                      setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-sm text-center text-2xl tracking-widest font-mono"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-100 transition duration-200 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Verifying code...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  ← Back to email
                </button>
                <div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Didn't receive code? Resend
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: New Password Form */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setFieldErrors(prev => ({ ...prev, newPassword: '' }));
                    }}
                    placeholder="Enter new password"
                    className={`w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      ${fieldErrors.newPassword ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
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
                {newPassword && (
                  <div className="mt-2">
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
                    <div className="mt-1 text-xs text-gray-500">
                      Requirements: 6+ chars, uppercase, lowercase, number
                    </div>
                  </div>
                )}
                
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.newPassword}</p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder="Confirm your new password"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                      ${fieldErrors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;