import { useState } from 'react';
import { Film, Upload, Save, Eye } from 'lucide-react';

const HeroManagement = () => {
  const [form, setForm] = useState({
    title: 'Experience Luxury Like Never Before',
    subtitle: 'Discover our handpicked collection of world-class rooms and suites designed for comfort and elegance.',
    ctaPrimaryText: 'Book Now',
    ctaSecondaryText: 'Explore Rooms',
    videoUrl: '',
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Form */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Film className="w-5 h-5 text-primary-500" />
            Hero Section Content
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Main Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subtitle / Description</label>
            <textarea
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Primary CTA Text</label>
              <input
                type="text"
                name="ctaPrimaryText"
                value={form.ctaPrimaryText}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Secondary CTA Text</label>
              <input
                type="text"
                name="ctaSecondaryText"
                value={form.ctaSecondaryText}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Background Video URL</label>
            <input
              type="url"
              name="videoUrl"
              value={form.videoUrl}
              onChange={handleChange}
              placeholder="https://example.com/hero-video.mp4"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Or Upload Video File</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">MP4, WebM up to 100MB</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Save className="w-4 h-4" /> Save Changes
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors">
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 text-sm">Live Preview</h3>
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 aspect-video flex flex-col items-center justify-center text-center p-6 relative">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 space-y-3">
              <h2 className="text-white font-bold text-lg leading-tight">{form.title}</h2>
              <p className="text-gray-300 text-xs leading-relaxed max-w-xs">{form.subtitle}</p>
              <div className="flex gap-2 justify-center pt-2">
                <span className="px-4 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-full">{form.ctaPrimaryText}</span>
                <span className="px-4 py-1.5 border border-white/50 text-white text-xs font-medium rounded-full">{form.ctaSecondaryText}</span>
              </div>
            </div>
            {!form.videoUrl && (
              <div className="absolute inset-0 flex items-end justify-center pb-3">
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Film className="w-3 h-3" /> No video uploaded
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Preview of hero section appearance</p>
        </div>
      </div>
    </div>
  );
};

export default HeroManagement;
