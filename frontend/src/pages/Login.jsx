import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, User, Mail, Lock } from "lucide-react";

const validatePasswordStrength = (password) => {
  if (!password) {
    return "Password is required.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  // Reject purely numeric passwords (like "123456")
  if (/^\d+$/.test(password)) {
    return "Password cannot be all numbers. Please include letters or special characters.";
  }

  // Reject repeating single characters (like "111111")
  const repeatingRegex = /^(.)\1+$/;
  if (repeatingRegex.test(password)) {
    return "Password cannot consist of repeating characters.";
  }

  // If shorter than 8 characters, require a mix of letters and numbers/special characters
  if (password.length < 8) {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumberOrSpecial = /[^a-zA-Z]/.test(password);
    if (!hasLetter || !hasNumberOrSpecial) {
      return "Passwords shorter than 8 characters must contain a mix of letters and numbers/special characters.";
    }
  }

  // Blacklist specific very common weak passwords of length 6 or 7
  const weakBlacklist = ["123456", "qwerty", "abcdef", "1234567"];
  if (weakBlacklist.includes(password.toLowerCase())) {
    return "This password is too weak and commonly used. Please choose a stronger password.";
  }

  return "";
};

const AuthForm = ({
  mode,
  onSubmit,
  onGoogleSignUp,
  loading,
  error,
  onClearError,
}) => {
  const isSignUp = mode === "signup";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (isSignUp && !formData.name.trim()) {
      errs.name = "Full Name is required.";
    }

    if (!formData.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Enter a valid email address.";
    }

    if (isSignUp) {
      const passwordError = validatePasswordStrength(formData.password);
      if (passwordError) {
        errs.password = passwordError;
      }
    } else {
      if (!formData.password) {
        errs.password = "Password is required.";
      }
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  };

  const password = formData.password || "";
  const isLengthValid = password.length >= 6;
  const isNotAllNumbers = password.length === 0 || /[^0-9]/.test(password);
  const isNotRepeating = password.length === 0 || !/^(.)\1+$/.test(password);
  const isMixValid = password.length === 0 || password.length >= 8 || (/[a-zA-Z]/.test(password) && /[^a-zA-Z]/.test(password));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (error) onClearError();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    if (isSignUp) {
      onSubmit({ name: formData.name.trim(), email: formData.email.trim(), password: formData.password });
    } else {
      onSubmit({ email: formData.email.trim(), password: formData.password, rememberMe: formData.rememberMe });
    }
  };

  const handleGoogleClick = () => {
    if (onGoogleSignUp) {
      onGoogleSignUp();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 animate-shake">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Name (Sign Up ) */}
      {isSignUp && (
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                ${fieldErrors.name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
            />
          </div>
          {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
          Email address
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
          />
        </div>
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full pl-11 pr-12 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              ${fieldErrors.password ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}

        {/* Real-time Dynamic Password Requirement Checklist */}
        {isSignUp && password.length > 0 && (
          <div className="mt-2.5 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5 animate-fadeIn">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Password Requirements</p>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={isLengthValid ? "text-green-600 flex items-center gap-1.5" : "text-gray-400 flex items-center gap-1.5"}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] border ${isLengthValid ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 bg-white"}`}>
                  ✓
                </span>
                At least 6 characters
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={isNotAllNumbers ? "text-green-600 flex items-center gap-1.5" : "text-gray-400 flex items-center gap-1.5"}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] border ${isNotAllNumbers ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 bg-white"}`}>
                  ✓
                </span>
                Cannot be all numbers
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={isNotRepeating ? "text-green-600 flex items-center gap-1.5" : "text-gray-400 flex items-center gap-1.5"}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] border ${isNotRepeating ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 bg-white"}`}>
                  ✓
                </span>
                Cannot consist of repeating characters
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className={isMixValid ? "text-green-600 flex items-center gap-1.5" : "text-gray-400 flex items-center gap-1.5"}>
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] border ${isMixValid ? "border-green-200 bg-green-50 text-green-600" : "border-gray-200 bg-white"}`}>
                  ✓
                </span>
                Letters & numbers mix (if under 8 characters)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password (Sign Up ) */}
      {isSignUp && (
        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                ${fieldErrors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50/50 focus:bg-white"}`}
            />
          </div>
          {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>}
        </div>
      )}

      {/* Remember me & Forgot Password (Sign In) */}
      {!isSignUp && (
        <div className="flex items-center justify-between text-sm py-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600"
            />
            <span className="text-gray-600 text-xs font-medium">Remember me</span>
          </label>
          {/* Uses React Router Link instead of modal */}
          <Link
            to="/forgot-password"
            className="text-indigo-600 hover:underline text-xs font-semibold"
          >
            Forgot password?
          </Link>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-100 transition duration-200 text-sm"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {isSignUp ? "Creating Account..." : "Signing in..."}
          </>
        ) : (
          isSignUp ? "Create Account" : "Sign In"
        )}
      </button>

      {/* Google OAuth Button - Both Sign In and Sign Up */}
      <>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium py-3 rounded-xl shadow-sm transition duration-200 text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isSignUp ? "Sign up with Google" : "Sign in with Google"}
        </button>
      </>
    </form>
  );
};

export default AuthForm;
