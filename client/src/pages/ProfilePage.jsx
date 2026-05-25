import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Lock, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error('Name, Email, and Phone Number are required');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/auth/profile', {
        name,
        email,
        phone,
        ...(password ? { password } : {})
      });

      if (res.data.user) {
        updateUserData(res.data.user);
        toast.success('Profile updated successfully!');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back navigation */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm mb-6 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-black text-2xl uppercase">
                  {name ? name[0] : 'U'}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pt-14 pb-8 space-y-6">
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-tight">Edit Profile</h1>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">Manage your account information and password settings</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 focus-within:border-violet-500 focus-within:bg-white transition-all">
                  <User className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 focus-within:border-violet-500 focus-within:bg-white transition-all">
                  <Mail className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@jhon.com"
                    className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 focus-within:border-violet-500 focus-within:bg-white transition-all">
                  <Phone className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-123-4567"
                    className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <h3 className="font-extrabold text-sm text-gray-800">Change Password</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 focus-within:border-violet-500 focus-within:bg-white transition-all">
                      <Lock className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400"
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                    <div className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 focus-within:border-violet-500 focus-within:bg-white transition-all">
                      <Lock className="w-4.5 h-4.5 text-gray-400 flex-shrink-0" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400"
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
