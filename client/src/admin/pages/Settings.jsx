import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Hotel, Save, Globe, Loader2 } from 'lucide-react';
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
        setEmail(d.email );
        setPhone(d.phone );
        setAddress(d.address );
        
        const checkInParsed = parse24h(d.checkInTime);
        setCheckInHour(checkInParsed.hour);
        setCheckInMinute(checkInParsed.minute);
        setCheckInAmPm(checkInParsed.ampm);

        const checkOutParsed = parse24h(d.checkOutTime);
        setCheckOutHour(checkOutParsed.hour);
        setCheckOutMinute(checkOutParsed.minute);
        setCheckOutAmPm(checkOutParsed.ampm);

        setFacebook(d.facebook );
        setInstagram(d.instagram );
        setTwitter(d.twitter );
        setLinkedin(d.linkedin );
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading configuration...</p>
      </div>
    );
  }

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-primary-500" />
          Hotel Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" 
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
            <textarea 
              rows={2} 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none animate-none" 
            />
          </div>
        </div>
      </div>

      {/* Booking Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary-500" />
          Booking Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Check-in Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Check-in Time</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Hour</span>
                <select 
                  value={checkInHour} 
                  onChange={(e) => setCheckInHour(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-primary-400 cursor-pointer bg-gray-50/50"
                >
                  {hoursList.map(h => (
                    <option key={h} value={h}>{h.padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Minute</span>
                <select 
                  value={checkInMinute} 
                  onChange={(e) => setCheckInMinute(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-primary-400 cursor-pointer bg-gray-50/50"
                >
                  {minutesList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">AM/PM</span>
                <select 
                  value={checkInAmPm} 
                  onChange={(e) => setCheckInAmPm(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 cursor-pointer bg-gray-50/50 font-bold text-gray-700"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Check-out Time */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Check-out Time</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Hour</span>
                <select 
                  value={checkOutHour} 
                  onChange={(e) => setCheckOutHour(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-primary-400 cursor-pointer bg-gray-50/50"
                >
                  {hoursList.map(h => (
                    <option key={h} value={h}>{h.padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Minute</span>
                <select 
                  value={checkOutMinute} 
                  onChange={(e) => setCheckOutMinute(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2.5 text-sm outline-none focus:border-primary-400 cursor-pointer bg-gray-50/50"
                >
                  {minutesList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">AM/PM</span>
                <select 
                  value={checkOutAmPm} 
                  onChange={(e) => setCheckOutAmPm(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 cursor-pointer bg-gray-50/50 font-bold text-gray-700"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-500" />
          Social Media Links
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Facebook</label>
            <input 
              type="url" 
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/yourpage" 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Instagram</label>
            <input 
              type="url" 
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourpage" 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Twitter</label>
            <input 
              type="url" 
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://twitter.com/yourpage" 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">LinkedIn</label>
            <input 
              type="url" 
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/yourpage" 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" 
            />
          </div>
        </div>
      </div>

      <button 
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save All Settings
      </button>
    </form>
  );
};

export default Settings;
