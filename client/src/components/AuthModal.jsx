import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const AuthModal = () => {
  const { authModal, setAuthModal, login } = useAuth();
  const navigate = useNavigate();
  
  // Tab states: 'login', 'register', 'otp'
  const isLogin = authModal === 'login';
  const isRegister = authModal === 'register';
  const isOtp = authModal === 'otp';
  
  // Login states
  const [loginForm, setLoginForm] = useState({ email: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register states
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // OTP states
  const [authEmail, setAuthEmail] = useState(""); // Stores email to verify
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Clear errors when toggling mode
  useEffect(() => {
    setLoginError("");
    setRegisterError("");
    setOtpError("");
  }, [authModal]);

  if (!authModal) return null;

  const handleLoginChange = (e) => setLoginForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setRegisterForm((p) => ({ ...p, phone: digitsOnly }));
      return;
    }
    setRegisterForm((p) => ({ ...p, [name]: value }));
  };

  const handleRequestOtp = async (endpointForm) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpointForm),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to request OTP");
      
      toast.success("OTP sent to your email!");
      setAuthEmail(endpointForm.email);
      setAuthModal('otp');
    } catch (err) {
      throw err;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await handleRequestOtp(loginForm);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);
    try {
      await handleRequestOtp(registerForm);
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, otp: otpCode }),
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Verification failed");
      
      login(data.user, data.token);
      toast.success("Authentication successful!");
      setAuthModal(null);
      const redirectTo = sessionStorage.getItem('redirect_after_login');
      if (redirectTo) {
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectTo);
      }
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-[1.25rem] w-full max-w-[440px] shadow-2xl relative p-8 animate-in fade-in zoom-in-95 duration-200">
        
        <button
          onClick={() => setAuthModal(null)}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-100 transition-colors z-20 cursor-pointer border-none"
        >
          <X className="w-5 h-5 text-gray-955" />
        </button>

        {isLogin && (
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Welcome back</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">Enter your email to receive a login OTP</p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Email</label>
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

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-6"
              >
                {loginLoading ? 'Sending OTP...' : 'Get OTP'}
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
        )}

        {isRegister && (
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Create Account</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">Join us today - no password required!</p>
            </div>

            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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

              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={registerForm.phone}
                  onChange={handleRegisterChange}
                  required
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white placeholder-gray-400 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-2"
              >
                {registerLoading ? 'Sending OTP...' : 'Get OTP'}
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

        {isOtp && (
          <div>
            <div className="text-left mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">Enter OTP</h2>
              <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed font-semibold">We have sent a 6-digit OTP code to {authEmail}.</p>
            </div>

            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                {otpError}
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 text-left mb-1.5">OTP Code</label>
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
                disabled={otpLoading}
                className="w-full flex items-center justify-center bg-[#003BDE] hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer text-sm mt-6"
              >
                {otpLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6 font-semibold">
              <button
                onClick={() => setAuthModal('login')}
                className="text-blue-600 hover:underline font-bold bg-transparent border-none cursor-pointer"
              >
                Change Email
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
