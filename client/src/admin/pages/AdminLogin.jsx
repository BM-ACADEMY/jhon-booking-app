import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Server returned an invalid response. Is the backend URL configured correctly?");
      }

      if (!res.ok) throw new Error(data?.message || 'Login failed');
      if (data.user.role !== 'admin') throw new Error('Admin access required');
      login(data.user, data.token);
      // navigation handled by useEffect after login
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 lg:bg-slate-100 lg:justify-center lg:items-center lg:p-4">

      {/* IMAGE SECTION - HIDDEN ON DESKTOP (lg:hidden) */}
      <div
        className="relative w-full h-[30vh] md:h-[40vh] lg:hidden bg-cover bg-center shrink-0"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=764&auto=format&fit=crop)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
      </div>

      {/* FORM SECTION */}
      <div className="flex-grow w-full flex justify-center lg:items-center relative z-10 -mt-10 lg:mt-0 lg:max-w-md">
        <div className="w-full bg-white rounded-t-[2.5rem] lg:rounded-2xl px-6 pt-8 pb-12 lg:p-10 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.15)] lg:shadow-xl flex flex-col justify-center">

          {/* Desktop Logo (Visible only on lg) */}
          <div className="hidden lg:block text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#185adb] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/20">
              <Hotel className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">The Balified Villa</h1>
            <p className="text-gray-500 text-sm mt-1">Admin Panel</p>
          </div>

          {/* Mobile Drag Handle (Hidden on Desktop) */}
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 lg:hidden" />

          <div className="w-full max-w-md mx-auto">

            {/* Headers */}
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to access the admin dashboard</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 lg:hidden">
                  Email
                </label>
                <label className="hidden lg:block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    placeholder="admin@example.com"
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#185adb] focus:ring-1 focus:ring-[#185adb] transition-all bg-white"
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
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#185adb] focus:ring-1 focus:ring-[#185adb] transition-all bg-white"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center bg-[#185adb] hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-lg transition-colors mt-6"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-8">
              Secured access. For authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
