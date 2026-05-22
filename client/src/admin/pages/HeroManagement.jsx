import { useState, useEffect, useRef } from 'react';
import { Film, Upload, Save, Eye, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const HeroManagement = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    ctaPrimaryText: '',
    ctaSecondaryText: '',
    videoUrl: '',
    stats: [
      { label: 'Luxury Stays', value: '500+' },
      { label: 'Premium Suites', value: '24' },
      { label: 'Guest Rating', value: '4.9★' },
    ]
  });
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  const fetchHero = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hero');
      if (res.data) {
        setForm({
          title: res.data.title || '',
          subtitle: res.data.subtitle || '',
          ctaPrimaryText: res.data.ctaPrimaryText || '',
          ctaSecondaryText: res.data.ctaSecondaryText || '',
          videoUrl: res.data.videoUrl || '',
          stats: res.data.stats && res.data.stats.length > 0 ? res.data.stats : [
            { label: 'Luxury Stays', value: '500+' },
            { label: 'Premium Suites', value: '24' },
            { label: 'Guest Rating', value: '4.9★' },
          ],
        });
        if (res.data.videoUrl) {
          const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
          setPreviewUrl(res.data.videoUrl.startsWith('http') ? res.data.videoUrl : `${baseUrl}${res.data.videoUrl}`);
        }
      }
    } catch (err) {
      console.error('Error fetching hero:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHero();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  
  const handleStatChange = (index, field, value) => {
    const newStats = [...form.stats];
    newStats[index][field] = value;
    setForm(p => ({ ...p, stats: newStats }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setForm(prev => ({ ...prev, videoUrl: '' })); // Clear URL if file is chosen
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('subtitle', form.subtitle);
      formData.append('ctaPrimaryText', form.ctaPrimaryText);
      formData.append('ctaSecondaryText', form.ctaSecondaryText);
      formData.append('videoUrl', form.videoUrl);
      formData.append('stats', JSON.stringify(form.stats));
      
      if (videoFile) {
        formData.append('video', videoFile);
      }

      await api.post('/hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Hero section updated successfully!');
      fetchHero();
      setVideoFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating hero');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (window.confirm('Are you sure you want to delete the current video?')) {
      try {
        await api.delete('/hero/video');
        toast.success('Video deleted');
        setForm(prev => ({ ...prev, videoUrl: '' }));
        setPreviewUrl('');
        setVideoFile(null);
      } catch (err) {
        toast.error('Error deleting video');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Form */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Film className="w-5 h-5 text-primary-500" />
            Hero Section Content
          </h2>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Main Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Experience Luxury Like Never Before"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subtitle / Description</label>
              <textarea
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                rows={3}
                placeholder="Tell your story in a few sentences..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 resize-none transition-all"
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Secondary CTA Text</label>
                <input
                  type="text"
                  name="ctaSecondaryText"
                  value={form.ctaSecondaryText}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-all"
                />
              </div>
            </div>

            {/* Stats Management */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Hero Statistics</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {form.stats.map((stat, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Stat #{idx + 1}</p>
                    <div>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                        placeholder="Value (e.g. 500+)"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-primary-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                        placeholder="Label (e.g. Stays)"
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] uppercase font-semibold outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Background Video URL (External)</label>
              <input
                type="url"
                name="videoUrl"
                value={form.videoUrl}
                onChange={(e) => {
                  handleChange(e);
                  setPreviewUrl(e.target.value);
                  setVideoFile(null);
                }}
                placeholder="https://example.com/hero-video.mp4"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Or Upload Local Video</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${videoFile ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200 hover:border-primary-300'}`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${videoFile ? 'text-primary-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-600 font-medium">
                  {videoFile ? videoFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-400 mt-1">MP4, WebM up to 500MB</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                disabled={submitting}
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary-500/20 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              {previewUrl && (
                <button 
                  onClick={handleDeleteVideo}
                  className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Remove Video
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Live Preview</h3>
          <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-video relative group">
            {previewUrl ? (
              <video
                key={previewUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={previewUrl} />
              </video>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
            
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-white font-extrabold text-2xl leading-tight mb-2 drop-shadow-lg">
                {form.title || 'Your Title Here'}
              </h2>
              <p className="text-gray-200 text-[10px] leading-relaxed max-w-xs mb-4 line-clamp-2">
                {form.subtitle || 'Your subtitle or description will appear here...'}
              </p>
              <div className="flex gap-2 justify-center">
                <span className="px-5 py-1.5 bg-primary-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-primary-500/30">
                  {form.ctaPrimaryText || 'CTA 1'}
                </span>
                <span className="px-5 py-1.5 border border-white/50 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
                  {form.ctaSecondaryText || 'CTA 2'}
                </span>
              </div>
            </div>

            {!previewUrl && (
              <div className="absolute inset-0 flex items-end justify-center pb-4">
                <span className="text-white/50 text-[10px] flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full">
                  <Film className="w-3 h-3" /> No background video
                </span>
              </div>
            )}
          </div>
          <div className="mt-6 space-y-4 flex-1">
            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
              <h4 className="text-xs font-bold text-primary-700 mb-1 flex items-center gap-1.5">
                <Eye className="w-3 h-3" /> Real-time Feedback
              </h4>
              <p className="text-[10px] text-primary-600 leading-relaxed">
                Changes made in the form are instantly reflected in this preview. This represents how it will look on your public website.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 mb-1">Performance Tip</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                For best results, use videos under 10MB in .mp4 or .webm format. Local uploads are stored securely in your server's uploads folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroManagement;
