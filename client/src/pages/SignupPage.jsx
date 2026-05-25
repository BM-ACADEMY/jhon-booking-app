import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const perks = [
  'Free cancellation on all bookings',
  'Member-only discounts up to 20%',
  'Early check-in when available',
  'Dedicated concierge support',
  'Complimentary birthday upgrade',
];

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
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-gray-950 via-primary-950 to-gray-900 flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #e6a83b 0%, transparent 50%)' }}
        />
        <div className="relative z-10 max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mb-6 shadow-xl shadow-primary-500/30">
            <Hotel className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Join Jhon Booking<br />
            <span className="text-primary-400">for Free</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Create your account and unlock exclusive benefits reserved for our members.
          </p>

          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <p className="text-sm text-gray-300">{perk}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                {['bg-blue-500', 'bg-rose-500', 'bg-emerald-500'].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold`}>
                    {['E', 'J', 'T'][i]}
                  </div>
                ))}
              </div>
              <p className="text-gray-300 text-sm">
                <span className="text-white font-semibold">500+</span> guests joined this month
              </p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 h-1.5 bg-primary-400 rounded-full" />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">4.9 / 5 average guest satisfaction</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Jhon Booking</p>
              <p className="text-gray-400 text-xs">Luxury Hotel</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-500 text-sm mb-7">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign in
              </Link>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Smith"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 555-0000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${
                      strength.label === 'Weak' ? 'text-red-500' :
                      strength.label === 'Fair' ? 'text-yellow-600' :
                      strength.label === 'Good' ? 'text-blue-600' : 'text-green-600'
                    }`}>{strength.label} password</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm outline-none focus:ring-2 transition-all ${
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-gray-200 focus:border-primary-400 focus:ring-primary-400/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-primary-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-primary-600 hover:underline font-medium">Terms of Service</a> and{' '}
                  <a href="#" className="text-primary-600 hover:underline font-medium">Privacy Policy</a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-1"
              >
                {loading ? 'Creating account...' : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Secure registration. Your data is encrypted and never shared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
