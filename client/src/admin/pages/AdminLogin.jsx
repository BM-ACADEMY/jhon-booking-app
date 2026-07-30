import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Unable to connect to server. Please try again later.");
      }

      if (!res.ok) throw new Error(data?.message || 'Login failed');
      if (data.user.role !== 'admin') throw new Error('Admin access required');
      login(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 lg:bg-slate-100 lg:justify-center lg:items-center lg:p-4">
      {/* MOBILE HEADER IMAGE */}
      <div
        className="relative w-full h-[25vh] md:h-[35vh] lg:hidden bg-cover bg-center shrink-0"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=764&auto=format&fit=crop)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
      </div>

      {/* FORM SECTION */}
      <div className="flex-grow w-full flex justify-center lg:items-center relative z-10 -mt-8 lg:mt-0 lg:max-w-md">
        <Card className="w-full rounded-t-[2.5rem] lg:rounded-2xl border-0 lg:border border-gray-100 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.15)] lg:shadow-xl bg-white p-2">
          
          <CardHeader className="text-center pb-4 pt-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary-600/20">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">The Balified Villa</CardTitle>
            <CardDescription className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Admin Panel Access</CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-lg mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    placeholder="admin@example.com"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold py-5 mt-4"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>

        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
