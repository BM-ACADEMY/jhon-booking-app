import { useState, useEffect, useRef } from 'react';
import { Film, Upload, Save, Eye, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const HeroManagement = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    titleLine1: '', // main title line 1
    titleLine2: '', // optional second line
    subtitle: '',
    videoUrl: '',
    backgroundImage: '',
    stats: [
      { label: 'Luxury Stays', value: '500+' },
      { label: 'Premium Suites', value: '24' },
      { label: 'Guest Rating', value: '4.9★' },
    ]
  });
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const fetchHero = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hero');
      if (res.data) {
        setForm({
          titleLine1: res.data.titleLine1,
          titleLine2: res.data.titleLine2,
          subtitle: res.data.subtitle,
          videoUrl: res.data.videoUrl,
          backgroundImage: res.data.backgroundImage,
          stats: res.data.stats && res.data.stats.length > 0 ? res.data.stats : [
            { label: 'Luxury Stays', value: '500+' },
            { label: 'Premium Suites', value: '24' },
            { label: 'Guest Rating', value: '4.9★' },
          ],
        });
        const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
        if (res.data.videoUrl) {
          setPreviewUrl(res.data.videoUrl.startsWith('http') ? res.data.videoUrl : `${baseUrl}${res.data.videoUrl}`);
        } else {
          setPreviewUrl('');
        }
        if (res.data.backgroundImage) {
          setImagePreviewUrl(res.data.backgroundImage.startsWith('http') ? res.data.backgroundImage : `${baseUrl}${res.data.backgroundImage}`);
        } else {
          setImagePreviewUrl('');
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
      const maxVideoSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxVideoSize) {
        toast.error('Video size cannot exceed 10MB');
        e.target.value = ''; // Reset input selection
        return;
      }
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setForm(prev => ({ ...prev, videoUrl: '' })); // Clear URL if video file is chosen
      setImageFile(null);
      setImagePreviewUrl('');
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('titleLine1', form.titleLine1);
      formData.append('titleLine2', form.titleLine2);
      formData.append('subtitle', form.subtitle);

      // Validation to ensure only one media asset is saved: prioritize video over image
      if (form.videoUrl && form.backgroundImage) {
        // If both URLs are set, clear the image URL to keep only video
        form.backgroundImage = '';
      } else if (!form.videoUrl && form.backgroundImage) {
        // If only image URL is set, ensure videoUrl is empty
        form.videoUrl = '';
      }
      formData.append('videoUrl', form.videoUrl);
      formData.append('backgroundImage', form.backgroundImage);
      formData.append('stats', JSON.stringify(form.stats));

      if (videoFile) {
        formData.append('video', videoFile);
      }
      if (imageFile) {
        formData.append('image', imageFile);
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title Line 1</label>
              <input
                type="text"
                name="titleLine1"
                value={form.titleLine1}
                onChange={handleChange}
                placeholder="e.g. Experience Luxury Like Never Before"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20 transition-all"
              />
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 mt-2">Title Line 2 (optional)</label>
              <input
                type="text"
                name="titleLine2"
                value={form.titleLine2}
                onChange={handleChange}
                placeholder="e.g. Premium Suites Await"
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Background Image URL (External)</label>
              <input
                type="url"
                name="backgroundImage"
                value={form.backgroundImage}
                onChange={(e) => {
                  handleChange(e);
                  setImagePreviewUrl(e.target.value);
                  setImageFile(null);
                }}
                placeholder="https://example.com/hero-image.jpg"
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
                <p className="text-xs text-gray-400 mt-1">MP4, WebM up to 10MB</p>
              </div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">Or Upload Local Image</label>
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const maxImageSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxImageSize) {
                      toast.error('Image size cannot exceed 5MB');
                      e.target.value = ''; // Reset input selection
                      return;
                    }
                    setImageFile(file);
                    setImagePreviewUrl(URL.createObjectURL(file));
                    setForm(prev => ({ ...prev, backgroundImage: '' }));
                    setVideoFile(null);
                    setPreviewUrl('');
                  }
                }}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => imageInputRef.current.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${imageFile ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200 hover:border-primary-300'}`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-2 ${imageFile ? 'text-primary-500' : 'text-gray-300'}`} />
                <p className="text-sm text-gray-600 font-medium">
                  {imageFile ? imageFile.name : 'Click to upload image or drag and drop'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 5MB</p>
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
              {imagePreviewUrl && (
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreviewUrl('');
                    setForm(prev => ({ ...prev, backgroundImage: '' }));
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-all cursor-pointer ml-2"
                >
                  <Trash2 className="w-4 h-4" /> Remove Image
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
            ) : imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Hero background"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
            )}

            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-8">
              <h2 className="text-white font-extrabold text-2xl leading-tight mb-2 drop-shadow-lg">
                <span className="text-white">
                  {form.titleLine1 || 'Experience Luxury Like'}
                </span>
                <br />
                <span className="text-[#d9f969]">
                  {form.titleLine2 || 'Never Before'}
                </span>
              </h2>
              <p className="text-gray-200 text-[10px] leading-relaxed max-w-xs mb-4 line-clamp-2">
                {form.subtitle || 'Your subtitle or description will appear here...'}
              </p>
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
