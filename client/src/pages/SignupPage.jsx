import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      login(data.user, data.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
    if (p.length < 10) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-1/2' };
    if (p.length < 14) return { label: 'Good', color: 'bg-blue-400', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 lg:bg-white">

      {/* IMAGE SECTION */}
      <div
        className="relative w-full h-[30vh] md:h-[40vh] lg:h-screen lg:w-1/2 bg-cover bg-center shrink-0"
        // Replace with your actual background image
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=764&auto=format&fit=crop)' }}
      >
        {/* Dark gradient overlay (Matches Login Page) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30" />

        {/* Desktop Overlay Content (Matches Login Page perfectly) */}
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
              Schedule your visit and book your stay in just a few clicks.
            </p>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="flex-grow w-full flex justify-center lg:items-center relative z-10 -mt-10 lg:mt-0">
        <div className="w-full bg-white rounded-t-[2.5rem] lg:rounded-none px-6 pt-8 pb-12 lg:p-12 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.15)] lg:shadow-none flex flex-col justify-center">

          {/* Mobile Drag Handle (Hidden on Desktop) */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 lg:hidden" />

          <div className="w-full max-w-md mx-auto">

            {/* Headers */}
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-[#185adb] hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">Full Name</label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Smith"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">Email Address</label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
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

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">Phone Number</label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 555-0000"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">Password</label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Min. 6 characters"
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
                {strength && (
                  <div className="mt-2.5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-xs mt-1.5 font-medium ${
                      strength.label === 'Weak' ? 'text-red-500' :
                      strength.label === 'Fair' ? 'text-yellow-600' :
                      strength.label === 'Good' ? 'text-blue-600' : 'text-green-600'
                    }`}>{strength.label} password</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">Confirm Password</label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter password"
                    className={`w-full pl-11 pr-12 py-3 border rounded-lg text-sm outline-none focus:ring-1 transition-all bg-white ${
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-blue-600 focus:ring-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer pt-3 pb-2">
                <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#185adb] focus:ring-[#185adb] flex-shrink-0" />
                <span className="text-sm text-gray-600 leading-tight">
                  I agree to the{' '}
                  <a href="#" className="text-[#185adb] hover:underline font-medium">Terms of Service</a> and{' '}
                  <a href="#" className="text-[#185adb] hover:underline font-medium">Privacy Policy</a>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-[#185adb] hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors mt-2"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Secure registration. Your data is encrypted and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
