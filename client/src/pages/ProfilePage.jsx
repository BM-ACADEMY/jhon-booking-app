import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-[#eaf0f5] pt-28 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* Header Section */}
        <div className="mb-8 relative">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-3">Manage your account information and preferences</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Profile</h2>

          <form onSubmit={handleSubmit}>

            {/* Avatar & Summary Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-gray-200 rounded-xl p-5 mb-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#E8E8FF] text-[#4F46E5] flex items-center justify-center text-2xl font-semibold flex-shrink-0">
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{name || 'Your Name'}</h3>
                  <p className="text-sm text-gray-500">{email || 'your.email@example.com'}</p>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="border border-gray-200 rounded-xl p-5 sm:p-6 mb-6">
              <h3 className="text-md font-semibold text-gray-900 mb-5">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                    required
                  />
                </div>

                {/* Blank space to match design grid if needed */}
                <div className="hidden sm:block"></div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-600 mb-1.5">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9934917445"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50"
                    required
                  />
                </div>

              </div>
            </div>

            {/* Security / Password Card */}
            <div className="border border-gray-200 rounded-xl p-5 sm:p-6 mb-8">
              <h3 className="text-md font-semibold text-gray-900 mb-5">Security</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-600 mb-1.5">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50 placeholder-gray-400"
                    minLength={6}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1.5">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={saving}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50 placeholder-gray-400"
                    minLength={6}
                  />
                </div>

              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
