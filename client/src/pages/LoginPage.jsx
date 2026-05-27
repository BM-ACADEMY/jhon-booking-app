import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Hotel, Mail, Lock, Eye, EyeOff } from "lucide-react";
// Assuming useAuth is correctly exported from your context
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const target = user.role === "admin" ? "/admin" : from;
      navigate(target, { replace: true });
    }
  }, [user, navigate, from]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Server returned an invalid response. Is the backend URL configured correctly?");
      }

      if (!res.ok) throw new Error(data?.message || "Login failed");
      if (data.user.role === 'admin') throw new Error("Please use the admin login page");
      login(data.user, data.token);
      // navigation handled by useEffect after user state updates
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Removed overflow-hidden here to allow scrolling on mobile if needed
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 lg:bg-white">

      {/* IMAGE SECTION */}
      <div
        // Adjusted heights: 30vh on mobile, 40vh on tablets, full screen on desktop
        className="relative w-full h-[30vh] md:h-[40vh] lg:h-screen lg:w-1/2 bg-cover bg-center shrink-0"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30" />

        {/* Desktop Overlay Content */}
        <div className="hidden lg:flex absolute inset-0 p-12 flex-col justify-between z-10">

          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Hotel className="w-4 h-4 text-gray-900" />
            </div>
            <span className="text-white text-lg font-bold tracking-wide">The Balified Villa</span>
          </div>

          {/* Bottom Text */}
          <div className="max-w-lg mb-8">
            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              Find your sweet<br/>home away from<br/>home
            </h1>
            <p className="text-gray-200 text-lg mb-8">
              Schedule your visit and book your stay in just a clicks.
            </p>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="flex-grow w-full flex justify-center lg:items-center relative z-10 -mt-10 lg:mt-0">
        {/* Removed min-h-[65vh], added pb-12 for proper bottom spacing */}
        <div className="w-full bg-white rounded-t-[2.5rem] lg:rounded-none px-6 pt-8 pb-12 lg:p-12 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.15)] lg:shadow-none flex flex-col justify-center">

          {/* Mobile Drag Handle (Hidden on Desktop) */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 lg:hidden" />

          <div className="w-full max-w-md mx-auto">

            {/* Headers */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-500 text-sm">Welcome Back to The Balified Villa!</p>
            </div>

            {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
                  {loginError}
                </div>
              )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">
                  E-mail
                </label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">
                  Your Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider lg:hidden">
                    Password
                  </label>
                  <label className="hidden lg:block text-sm font-medium text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-end mt-4 mb-6">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-[#185adb] hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#185adb] hover:underline font-semibold">
                Sign Up
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
