import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const AuthModal = () => {
  const { authModal, setAuthModal, login } = useAuth();
  const navigate = useNavigate();
  
  // Tab states: 'login', 'register', 'forgot', 'otp', 'reset'
  const isLogin = authModal === 'login';
  const isForgot = authModal === 'forgot';
  const isOtp = authModal === 'otp';
  const isReset = authModal === 'reset';
  
  // Login states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register states
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  // Forgot password & OTP & Reset states
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Clear errors when toggling mode
  useEffect(() => {
    setLoginError("");
    setRegisterError("");
    setForgotError("");
  }, [authModal]);

  if (!authModal) return null;

  const handleLoginChange = (e) => setLoginForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleRegisterChange = (e) => setRegisterForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) throw new Error(data?.message || "Login failed");
      if (data.user.role === 'admin') throw new Error("Please use the admin login page");
      
      login(data.user, data.token);
      toast.success("Welcome back!");
      setAuthModal(null);
      const redirectTo = sessionStorage.getItem('redirect_after_login');
      if (redirectTo) {
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectTo);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      return setRegisterError('Passwords do not match');
    }
    if (registerForm.password.length < 6) {
      return setRegisterError('Password must be at least 6 characters');
    }
    setRegisterLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: registerForm.name, 
          email: registerForm.email, 
          phone: registerForm.phone, 
          password: registerForm.password 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      login(data.user, data.token);
      toast.success("Account created successfully!");
      setAuthModal(null);
      const redirectTo = sessionStorage.getItem('redirect_after_login');
      if (redirectTo) {
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectTo);
      }
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) throw new Error(data?.message || "Failed to request OTP");
      toast.success("OTP sent to your email!");
      setAuthModal('otp');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpCode }),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) throw new Error(data?.message || "Verification failed");
      toast.success("OTP verified!");
      setAuthModal('reset');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    if (newPassword !== confirmPassword) {
      return setForgotError("Passwords do not match");
    }
    if (newPassword.length < 6) {
      return setForgotError("Password must be at least 6 characters");
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: otpCode, password: newPassword }),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) throw new Error(data?.message || "Reset failed");
      login(data.user, data.token);
      toast.success("Password reset successfully!");
      setAuthModal(null);
      
      // Reset state
      setForgotEmail("");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-[1.25rem] w-full max-w-[440px] shadow-2xl relative p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => setAuthModal(null)}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-100 transition-colors z-20 cursor-pointer border-none"
        >
          <X className="w-5 h-5 text-gray-955" />
        </button>

        {isLogin ? (
          /* ================= LOGIN FORM ================= */
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Please log in</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">You seem to be logged out - let's fix that!</p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                    placeholder="********"
                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot password row */}
              <div className="flex justify-end text-[13px] font-semibold mt-4 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthModal('forgot')}
                  className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer font-semibold"
                >
                  Forgot password
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm"
              >
                {loginLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-semibold">
              Don’t have an account?{' '}
              <button
                onClick={() => setAuthModal('register')}
                className="text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </div>
        ) : isForgot ? (
          /* ================= FORGOT PASSWORD FORM ================= */
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Forgot password</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">Enter your email to receive a reset OTP code</p>
            </div>

            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-6"
              >
                {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-semibold">
              Already a member?{' '}
              <button
                onClick={() => setAuthModal('login')}
                className="text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        ) : isOtp ? (
          /* ================= OTP VERIFICATION FORM ================= */
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Enter OTP</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed font-semibold">We have sent a 6-digit OTP code to {forgotEmail}.</p>
            </div>

            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-bold tracking-widest text-center"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-6"
              >
                {forgotLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-semibold">
              Back to{' '}
              <button
                onClick={() => setAuthModal('login')}
                className="text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        ) : isReset ? (
          /* ================= RESET PASSWORD FORM ================= */
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">New Password</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">Enter your new password below</p>
            </div>

            {forgotError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onCopy={(e) => e.preventDefault()}
                    required
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showResetConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onCopy={(e) => e.preventDefault()}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm outline-none focus:ring-1 transition-all bg-white ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(!showResetConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center"
                  >
                    {showResetConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-6"
              >
                {forgotLoading ? 'Resetting password...' : 'Reset password'}
              </button>
            </form>
          </div>
        ) : (
          /* ================= REGISTER FORM ================= */
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Please register</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">You seem to be new here - let's fix that!</p>
            </div>

            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={registerForm.name}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  required
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Min. 6 characters"
                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center"
                  >
                    {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showRegisterConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Re-enter password"
                    className={`w-full pl-4 pr-12 py-3 border rounded-xl text-sm outline-none focus:ring-1 transition-all bg-white ${
                      registerForm.confirmPassword && registerForm.confirmPassword !== registerForm.password
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirm(!showRegisterConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center"
                  >
                    {showRegisterConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={registerLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-2"
              >
                {registerLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-semibold">
              Already a member?{' '}
              <button
                onClick={() => setAuthModal('login')}
                className="text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
