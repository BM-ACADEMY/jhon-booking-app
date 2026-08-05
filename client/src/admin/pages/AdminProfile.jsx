import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Lock, Save, Loader2, Shield, Edit2, X, Check, Key } from 'lucide-react';
import api from '../../api';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AdminProfile = () => {
  const { user, updateUserData } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleCancel = () => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
    setPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap truncate">
              <User className="w-5 h-5 text-primary-600 shrink-0" />
              <span className="truncate whitespace-nowrap">Administrator Profile</span>
            </h1>
            <Badge variant="secondary" className={`whitespace-nowrap shrink-0 ${isEditing ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {isEditing ? 'Editing Mode' : 'Read-Only Mode'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">
            Manage your personal admin account details and security credentials.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {!isEditing ? (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="gap-1.5 text-xs font-semibold border-gray-300"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* User Identity Card */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-3xl shadow-inner shrink-0 uppercase border border-primary-200">
              {name ? name.charAt(0) : 'A'}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{name || 'Admin User'}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{email || 'admin@example.com'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold gap-1 text-[11px]">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  System Administrator
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details Card */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Your name, contact email, and phone number registered on the system.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name..."
                    className="border-gray-300 text-sm font-semibold"
                    required
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900">
                    {name || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  Email Address
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="border-gray-300 text-sm font-semibold"
                    required
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900">
                    {email || 'Not specified'}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="border-gray-300 text-sm font-semibold"
                    required
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900">
                    {phone || 'Not specified'}
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Security Credentials Card */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary-600" />
              Security Credentials
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Update your account password to maintain security.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            {!isEditing ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 flex items-center justify-between">
                <span>Password is encrypted and protected. Click <strong>Edit Profile</strong> to change password.</span>
                <Badge variant="outline" className="border-gray-300 text-gray-600 font-bold">Encrypted</Badge>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* New Password */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    New Password
                  </Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep unchanged"
                    className="border-gray-300 text-sm font-semibold"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="border-gray-300 text-sm font-semibold"
                  />
                </div>

              </div>
            )}
          </CardContent>
        </Card>

      </form>
    </div>
  );
};

export default AdminProfile;
