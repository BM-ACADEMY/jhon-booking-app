import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Lock, Save, Loader2, Shield } from 'lucide-react';
import api from '../../api';

const AdminProfile = () => {
  const { user, updateUserData } = useAuth();

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

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-2";

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="max-w-4xl space-y-8">

        {/* Header Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Administrator Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details and security credentials.</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Avatar Header */}
          <div className="px-6 sm:px-8 py-8 border-b border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center font-bold text-3xl shadow-inner flex-shrink-0 uppercase">
              {name ? name.charAt(0) : 'A'}
            </div>
            <div className="text-center sm:text-left mt-1">
              <h2 className="text-xl font-semibold text-gray-900">{name || 'Admin User'}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{email || 'admin@example.com'}</p>
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100">
                <Shield className="w-3.5 h-3.5" /> System Administrator
              </span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">

            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-5">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Full Name */}
                <div>
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className={labelClass}>Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="sm:col-span-2">
                  <label className={labelClass}>Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-5">Security Credentials</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* New Password */}
                <div>
                  <label className={labelClass}>New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className={inputClass}
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={inputClass}
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 active:scale-[0.98] cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
