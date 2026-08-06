import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logoImg from '../../assets/LogoBalified.png';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      
      toast.success('Successfully logged in as Admin!');
      login(data.user, data.token);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-cover bg-center select-none"
      style={{ 
        backgroundImage: `url('https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=2000&q=80')` 
      }}
    >
      {/* Soft gradient overlay for better contrast and depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-transparent to-white/10 pointer-events-none" />

      {/* Glassmorphic decorative grid lines (orbital circles) like the mockup */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-white/10" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-white/10" />
        <div className="absolute w-[1000px] h-[1000px] rounded-full border border-white/10" />
      </div>

      {/* Main glassmorphism container */}
      <div className="relative w-full max-w-[440px] px-6 py-12 md:py-16 z-10">
        <div className="w-full bg-white/30 backdrop-blur-2xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between">
          
          <div>
            {/* Header Icon Section using website logo */}
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-md border border-white/50 mb-5 overflow-hidden p-2">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Welcome back</h2>
              <p className="text-gray-600 text-sm mt-1.5 font-medium">Please enter your details to sign in.</p>
              <div className="inline-block mt-3 px-3 py-1 bg-white/40 border border-white/30 rounded-full text-[10px] uppercase tracking-wider font-bold text-gray-700">
                Admin Portal Only
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 text-xs font-bold uppercase tracking-wider pl-1">
                  E-Mail Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    placeholder="Enter your email..."
                    className="w-full pl-11 pr-4 py-3.5 bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl placeholder:text-gray-500 text-gray-800 font-medium focus:bg-white/60 focus:border-white/80 transition-all outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 text-xs font-bold uppercase tracking-wider pl-1">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    required
                    placeholder="Enter your password..."
                    className="w-full pl-11 pr-12 py-3.5 bg-white/40 backdrop-blur-md border border-white/40 rounded-2xl placeholder:text-gray-500 text-gray-800 font-medium focus:bg-white/60 focus:border-white/80 transition-all outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-transparent z-10"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </Button>
                </div>
              </div>


              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-6 rounded-2xl mt-4 shadow-lg shadow-black/10 hover:shadow-black/20 transition-all active:scale-[0.98]"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
