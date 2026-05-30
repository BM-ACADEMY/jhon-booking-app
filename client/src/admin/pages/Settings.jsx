import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Hotel, Save, Globe, Loader2, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, Clock } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

const parse24h = (timeStr) => {
  if (!timeStr) return { hour: '12', minute: '00', ampm: 'PM' };
  const parts = timeStr.split(':');
  if (parts.length < 2) return { hour: '12', minute: '00', ampm: 'PM' };
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { hour: String(h12), minute: m, ampm };
};

const convertTo24h = (hour, minute, ampm) => {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const hStr = String(h).padStart(2, '0');
  return `${hStr}:${minute}`;
};

const Settings = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [checkInHour, setCheckInHour] = useState('12');
  const [checkInMinute, setCheckInMinute] = useState('00');
  const [checkInAmPm, setCheckInAmPm] = useState('PM');

  const [checkOutHour, setCheckOutHour] = useState('12');
  const [checkOutMinute, setCheckOutMinute] = useState('00');
  const [checkOutAmPm, setCheckOutAmPm] = useState('AM');

  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        const d = res.data;
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setAddress(d.address || '');

        const checkInParsed = parse24h(d.checkInTime);
        setCheckInHour(checkInParsed.hour);
        setCheckInMinute(checkInParsed.minute);
        setCheckInAmPm(checkInParsed.ampm);

        const checkOutParsed = parse24h(d.checkOutTime);
        setCheckOutHour(checkOutParsed.hour);
        setCheckOutMinute(checkOutParsed.minute);
        setCheckOutAmPm(checkOutParsed.ampm);

        setFacebook(d.facebook || '');
        setInstagram(d.instagram || '');
        setTwitter(d.twitter || '');
        setLinkedin(d.linkedin || '');
      } catch (err) {
        toast.error('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const checkInTime = convertTo24h(checkInHour, checkInMinute, checkInAmPm);
      const checkOutTime = convertTo24h(checkOutHour, checkOutMinute, checkOutAmPm);

      await api.put('/settings', {
        email,
        phone,
        address,
        checkInTime,
        checkOutTime,
        facebook,
        instagram,
        twitter,
        linkedin
      });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Loading Settings...</p>
      </div>
    );
  }

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-2";

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="max-w-7xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Configuration Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your hotel details, booking timings, and social presence.</p>
        </div>

        {/* Form Layout: Side by Side on Desktop */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Left Column (Hotel Info & Booking Settings) */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">

            {/* Hotel Information Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                  <Hotel className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Hotel Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Contact Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contact@yourhotel.com"
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Complete Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-4 top-4" />
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Luxury Avenue, Resort City..."
                      required
                      className={`${inputClass} pl-10 resize-none`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Settings Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                  <SettingsIcon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Booking & Timings</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Check-in Time */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                    <Clock className="w-4 h-4 text-gray-500" /> Default Check-in
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={checkInHour}
                      onChange={(e) => setCheckInHour(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer"
                    >
                      {hoursList.map(h => <option key={h} value={h}>{h.padStart(2, '0')}</option>)}
                    </select>
                    <span className="flex items-center font-bold text-gray-400">:</span>
                    <select
                      value={checkInMinute}
                      onChange={(e) => setCheckInMinute(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer"
                    >
                      {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={checkInAmPm}
                      onChange={(e) => setCheckInAmPm(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* Check-out Time */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                    <Clock className="w-4 h-4 text-gray-500" /> Default Check-out
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={checkOutHour}
                      onChange={(e) => setCheckOutHour(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer"
                    >
                      {hoursList.map(h => <option key={h} value={h}>{h.padStart(2, '0')}</option>)}
                    </select>
                    <span className="flex items-center font-bold text-gray-400">:</span>
                    <select
                      value={checkOutMinute}
                      onChange={(e) => setCheckOutMinute(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer"
                    >
                      {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={checkOutAmPm}
                      onChange={(e) => setCheckOutAmPm(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all cursor-pointer"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Social Media & Actions) - Sticky on Desktop */}
          <div className="lg:col-span-4 space-y-6 sticky top-8">

            {/* Social Links Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Globe className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Social Media</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Facebook</label>
                  <div className="relative">
                    <Facebook className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="facebook.com/yourpage"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Instagram</label>
                  <div className="relative">
                    <Instagram className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="instagram.com/yourpage"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Twitter / X</label>
                  <div className="relative">
                    <Twitter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="twitter.com/yourpage"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>LinkedIn</label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/company/..."
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 active:scale-[0.98] cursor-pointer"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving Changes...' : 'Save All Settings'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-1">Changes will apply immediately across the system.</p>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
};

export default Settings;
