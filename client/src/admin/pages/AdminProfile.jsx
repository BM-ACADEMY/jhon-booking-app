import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Lock, Save, Loader2, Shield } from 'lucide-react';
import api from '../../api';

const AdminProfile = () => {
  const { user, updateUserData } = useAuth();

  const [name, setName] = useState(user?.name );
  const [email, setEmail] = useState(user?.email );
  const [phone, setPhone] = useState(user?.phone );
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
        toast.success('Admin profile updated successfully!');
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
    <div className="space-y-6 max-w-2xl">
      {/* Profile details form card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xl uppercase shadow-inner">
            {name ? name[0] : 'A'}
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 text-base flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-primary-500" />
              Administrator Profile
            </h2>
            <p className="text-xs text-gray-400 font-medium">Update your account name, email address, contact number, or login credentials</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary-400 focus-within:bg-white transition-all">
                <User className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                  className="bg-transparent text-sm text-gray-650 placeholder-gray-400 outline-none w-full font-medium"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary-400 focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jhon.com"
                  className="bg-transparent text-sm text-gray-650 placeholder-gray-400 outline-none w-full font-medium"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary-400 focus-within:bg-white transition-all">
                <Phone className="w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-transparent text-sm text-gray-650 placeholder-gray-400 outline-none w-full font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Settings */}
          <div className="border-t border-gray-100 pt-5 space-y-4">
            <h3 className="font-semibold text-gray-800 text-sm">Security Credentials</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary-400 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-sm text-gray-650 placeholder-gray-400 outline-none w-full font-medium"
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary-400 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-sm text-gray-650 placeholder-gray-400 outline-none w-full font-medium"
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
