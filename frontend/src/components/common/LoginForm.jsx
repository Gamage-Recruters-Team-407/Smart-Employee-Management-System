import { useState } from "react";
import { Eye, EyeOff, Loader2, AlertCircle, User, Mail, Lock } from "lucide-react";

const AuthForm = ({ mode, onSubmit, loading, error, onClearError }) => {
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
    
    if (!formData.password) {
      errs.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    if (isSignUp && formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    
    return errs;
  };

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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 animate-shake">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Name (Sign Up වලදී පමණක් පෙන්වයි) */}
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
      </div>

      {/* Confirm Password (Sign Up වලදී පමණක් පෙන්වයි) */}
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

      {/* Remember me & Forgot Password (Sign In වලදී පමණක් පෙන්වයි) */}
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
          <a href="#" className="text-indigo-600 hover:underline text-xs font-semibold">
            Forgot password?
          </a>
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
    </form>
  );
};

export default AuthForm;