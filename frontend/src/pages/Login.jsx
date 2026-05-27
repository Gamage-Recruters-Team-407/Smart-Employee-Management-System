import { useState, useEffect } from "react";
import { useNavigate, useLocation,  } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthForm from "../components/common/LoginForm";

const Login = () => {
  //  'signin' හෝ 'signup' තෝරාගැනීමට state එකක්
  const [activeTab, setActiveTab] = useState("signin");

  // AuthContext එකේ register function එකක් ඇති බව/නැතහොත් එකතු කළ හැක
  const { login, register, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (data) => {
    try {
      if (activeTab === "signup") {
        // Sign Up ක්‍රියාවලිය
        if (register) {
          await register(data.name, data.email, data.password);
        } else {
          console.log("Register function details:", data);
          alert("Register function is not connected to AuthContext yet!");
        }
      } else {
        // Sign In ක්‍රියාවලිය
        await login(data.email, data.password, data.rememberMe);
      }

      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch {
      // Error handles inside context
    }
  };

  const handleGoogleSignUp = () => {
    // Redirect to backend Google OAuth endpoint
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    window.location.href = `${apiBase}/auth/google`;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearError(); // Tab එක මාරු වන විට පැරණි API errors අයින් කරන්න
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">

      {/*  වම් පැත්ත: Advanced UI Illustration Section (Visible on desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>

        {/* Branding */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">SEMS</span>
        </div>

        {/* Core Content & Image */}
        <div className="my-auto max-w-lg relative z-10 text-center md:text-left">
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
              alt="Employee Management Dashboard"
              className="rounded-xl w-full h-auto object-cover opacity-95 mix-blend-normal"
            />
          </div>
          <h2 className="text-white text-3xl font-extrabold tracking-tight sm:text-4xl">
            Manage your workforce <span className="text-indigo-200">smartly.</span>
          </h2>
          <p className="mt-4 text-indigo-100 text-base leading-relaxed">
            Optimize attendance, automate payroll processing, evaluate performance, and streamline leave approvals all within a secure workplace gateway.
          </p>
        </div>

        {/* Footer info inside illustration */}
        <div className="text-indigo-200/60 text-xs relative z-10">
          &copy; {new Date().getFullYear()} SEMS Portal. All rights reserved.
        </div>
      </div>

      {/*  දකුණු පැත්ත: Form Section (Login & Signup Cards) */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12 bg-white sm:px-6 lg:px-16 xl:px-24">
        <div className="w-full max-w-sm lg:w-96">

          {/* Mobile Only Header View */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md mb-3">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SEMS Portal</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeTab === "signin" ? "Welcome back" : "Get started absolutely free"}
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              {activeTab === "signin" ? "Enter your workspace credentials." : "Create your staff account to join."}
            </p>
          </div>

          {/*  SIGN IN / SIGN UP TAB SELECTOR */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => handleTabChange("signin")}
              className={`w-1/2 text-center py-2 text-xs font-semibold rounded-lg transition duration-150
                ${activeTab === "signin"
                  ? "bg-white text-indigo-600 shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-900"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => handleTabChange("signup")}
              className={`w-1/2 text-center py-2 text-xs font-semibold rounded-lg transition duration-150
                ${activeTab === "signup"
                  ? "bg-white text-indigo-600 shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-900"}`}
            >
              Register / Sign Up
            </button>
          </div>

          {/* DYNAMIC AUTH FORM AREA */}
          <AuthForm
            mode={activeTab}
            onSubmit={handleSubmit}
            onGoogleSignUp={handleGoogleSignUp}
            loading={loading}
            error={error}
            onClearError={clearError}
          />

          {/* Bottom helper text toggle */}
          <div className="mt-6 text-center text-xs">
            <span className="text-gray-500">
              {activeTab === "signin" ? "New to SEMS? " : "Already have an account? "}
            </span>
            <button
              onClick={() => handleTabChange(activeTab === "signin" ? "signup" : "signin")}
              className="text-indigo-600 hover:underline font-semibold"
            >
              {activeTab === "signin" ? "Sign Up" : "Sign In here"}
            </button>
          </div>

          {/* Mobile Only Footer */}
          <p className="md:hidden text-center text-xxs text-gray-400 mt-10">
            &copy; {new Date().getFullYear()} SEMS &mdash; Secure Portal
          </p>

        </div>
      </div>

    </div>
  );
};

export default Login;
