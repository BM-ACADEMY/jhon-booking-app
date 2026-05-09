import { Settings as SettingsIcon, Hotel, Mail, Globe, Save } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-5 max-w-2xl">
      {/* General Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-primary-500" />
          Hotel Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hotel Name</label>
            <input type="text" defaultValue="Jhon Luxury Hotel" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Email</label>
            <input type="email" defaultValue="info@jhonhotel.com" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
            <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
            <textarea rows={2} defaultValue="123 Luxury Lane, Beverly Hills, CA 90210" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none" />
          </div>
        </div>
      </div>

      {/* Booking Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary-500" />
          Booking Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Check-in Time</label>
            <input type="time" defaultValue="14:00" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Check-out Time</label>
            <input type="time" defaultValue="11:00" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
              <option>INR (₹)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment Gateway</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400">
              <option>Stripe</option>
              <option>Razorpay</option>
            </select>
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
          {['Facebook', 'Instagram', 'Twitter', 'LinkedIn'].map((platform) => (
            <div key={platform}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{platform}</label>
              <input type="url" placeholder={`https://${platform.toLowerCase()}.com/yourpage`} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
        <Save className="w-4 h-4" />
        Save All Settings
      </button>
    </div>
  );
};

export default Settings;
