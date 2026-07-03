import { useState, useEffect, useRef } from 'react';
import { Film, Upload, Save, Eye, Loader2, Trash2, Plus, Edit, X, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const HeroManagement = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [heroId, setHeroId] = useState(null);
  

  // Slides state
  const [slides, setSlides] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' or 'mobile'

  // Modal state for Add/Edit slide
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null); // null if adding new
  const [slideForm, setSlideForm] = useState({
    titleLine1: '',
    titleLine2: '',
    subtitle: '',
    videoUrl: '',
    backgroundImage: '',
    mobileImage: '',
    mediaType: 'image', // 'image' or 'video'
  });

  // Modal file uploads
  const [videoFile, setVideoFile] = useState(null);
  const [desktopImageFile, setDesktopImageFile] = useState(null);
  const [mobileImageFile, setMobileImageFile] = useState(null);

  // Previews inside Modal
  const [videoPreview, setVideoPreview] = useState('');
  const [desktopPreview, setDesktopPreview] = useState('');
  const [mobilePreview, setMobilePreview] = useState('');

  const videoInputRef = useRef(null);
  const desktopImgInputRef = useRef(null);
  const mobileImgInputRef = useRef(null);

  const baseUrl = import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL !== 'undefined' ? import.meta.env.VITE_BASE_URL : '';

  const fetchHeroData = async () => {
    try { 
      setLoading(true);
      const res = await api.get('/hero');
      if (res.data) {
        setHeroId(res.data._id);

        if (res.data.slides && res.data.slides.length > 0) {
          setSlides(res.data.slides);
          setActivePreviewIndex(0);
        } else {
          setSlides([]);
        }
      }
    } catch (err) {
      console.error('Error fetching hero:', err);
      toast.error('Error loading Hero settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, []);


  // Open Modal for Add Slide
  const handleOpenAddModal = () => {
    setEditingSlideId(null);
    setSlideForm({
      titleLine1: '',
      titleLine2: '',
      subtitle: '',
      videoUrl: '',
      backgroundImage: '',
      mobileImage: '',
      mediaType: 'image',
    });
    setVideoFile(null);
    setDesktopImageFile(null);
    setMobileImageFile(null);
    setVideoPreview('');
    setDesktopPreview('');
    setMobilePreview('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit Slide
  const handleOpenEditModal = (slide) => {
    setEditingSlideId(slide._id);
    setSlideForm({
      titleLine1: slide.titleLine1 || '',
      titleLine2: slide.titleLine2 || '',
      subtitle: slide.subtitle || '',
      videoUrl: slide.videoUrl || '',
      backgroundImage: slide.backgroundImage || '',
      mobileImage: slide.mobileImage || '',
      mediaType: slide.videoUrl ? 'video' : 'image',
    });
    setVideoFile(null);
    setDesktopImageFile(null);
    setMobileImageFile(null);

    setVideoPreview(slide.videoUrl ? (slide.videoUrl.startsWith('http') ? slide.videoUrl : `${baseUrl}${slide.videoUrl}`) : '');
    setDesktopPreview(slide.backgroundImage ? (slide.backgroundImage.startsWith('http') ? slide.backgroundImage : `${baseUrl}${slide.backgroundImage}`) : '');
    setMobilePreview(slide.mobileImage ? (slide.mobileImage.startsWith('http') ? slide.mobileImage : `${baseUrl}${slide.mobileImage}`) : '');
    setIsModalOpen(true);
  };

  // Delete slide
  const handleDeleteSlide = async (slideId) => {
    if (window.confirm('Are you sure you want to delete this slide?')) {
      try {
        await api.delete(`/hero/slides/${slideId}`);
        toast.success('Slide deleted successfully!');
        fetchHeroData();
      } catch (err) {
        toast.error('Error deleting slide');
      }
    }
  };

  // Handle slide modal save
  const handleSaveSlide = async () => {
    if (!slideForm.titleLine1) {
      toast.error('Title Line 1 is required');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('titleLine1', slideForm.titleLine1);
      formData.append('titleLine2', slideForm.titleLine2);
      formData.append('subtitle', slideForm.subtitle);

      if (slideForm.mediaType === 'video') {
        formData.append('videoUrl', slideForm.videoUrl);
        formData.append('backgroundImage', '');
        formData.append('mobileImage', '');
        if (videoFile) {
          formData.append('video', videoFile);
        }
      } else {
        formData.append('videoUrl', '');
        formData.append('backgroundImage', slideForm.backgroundImage);
        formData.append('mobileImage', slideForm.mobileImage);
        if (desktopImageFile) {
          formData.append('image', desktopImageFile);
        }
        if (mobileImageFile) {
          formData.append('mobileImage', mobileImageFile);
        }
      }

      if (editingSlideId) {
        await api.put(`/hero/slides/${editingSlideId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Slide updated successfully!');
      } else {
        await api.post('/hero/slides', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Slide added successfully!');
      }

      setIsModalOpen(false);
      fetchHeroData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving slide');
    } finally {
      setSubmitting(false);
    }
  };

  const getMediaSource = (slide) => {
    if (!slide) return { type: 'none', src: '' };
    if (slide.videoUrl) {
      return {
        type: 'video',
        src: slide.videoUrl.startsWith('http') ? slide.videoUrl : `${baseUrl}${slide.videoUrl}`
      };
    }
    const imgSrc = previewViewport === 'mobile' && slide.mobileImage ? slide.mobileImage : slide.backgroundImage;
    return {
      type: 'image',
      src: imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`) : ''
    };
  };

  const activeSlide = slides[activePreviewIndex];
  const activeMedia = getMediaSource(activeSlide);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hero Slideshow Settings</h1>
          <p className="text-xs text-gray-500 mt-1">Add multiple homepage slides, configure desktop vs mobile banner images, and view simulated live previews.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Slides list and stats */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* SLIDES LIST */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Film className="w-5 h-5 text-primary-500" />
              Carousel Slides ({slides.length})
            </h2>

            {slides.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <Film className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">No slides configured yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Slide" to create your first slideshow banner.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {slides.map((slide, index) => {
                  const media = getMediaSource(slide);
                  const isAct = index === activePreviewIndex;
                  return (
                    <div 
                      key={slide._id} 
                      onClick={() => setActivePreviewIndex(index)}
                      className={`flex gap-4 items-center p-3 rounded-xl border transition-all cursor-pointer ${isAct ? 'border-primary-500 bg-primary-50/20 shadow-sm' : 'border-gray-100 hover:border-gray-300 bg-white'}`}
                    >
                      <div className="w-24 h-14 rounded-lg bg-gray-900 overflow-hidden relative shrink-0">
                        {slide.videoUrl ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-[10px] font-bold">
                            VIDEO
                          </div>
                        ) : slide.backgroundImage ? (
                          <img src={slide.backgroundImage.startsWith('http') ? slide.backgroundImage : `${baseUrl}${slide.backgroundImage}`} className="w-full h-full object-cover" alt="Slide thumb" />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Slide #{index + 1}</p>
                        <h4 className="text-sm font-bold text-gray-800 truncate">{slide.titleLine1} {slide.titleLine2}</h4>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{slide.subtitle || 'No subtitle description'}</p>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleOpenEditModal(slide)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSlide(slide._id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* LIVE SIMULATED PREVIEW */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col h-fit space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Live Banner Preview</h3>
            
            {/* Viewport simulation buttons */}
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button 
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1.5 rounded-md transition-all ${previewViewport === 'desktop' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1.5 rounded-md transition-all ${previewViewport === 'mobile' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeSlide ? (
            <div className="flex flex-col items-center">
              {/* Device Container */}
              <div 
                className={`overflow-hidden bg-gray-950 relative shadow-inner border border-gray-200 transition-all duration-300 rounded-2xl flex flex-col justify-center items-center ${previewViewport === 'mobile' ? 'w-[230px] h-[330px]' : 'w-full aspect-video'}`}
              >
                {activeMedia.type === 'video' ? (
                  <video
                    key={activeMedia.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={activeMedia.src} />
                  </video>
                ) : (
                  <img
                    key={activeMedia.src}
                    src={activeMedia.src}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in"
                  />
                )}

                <div className="absolute inset-0 bg-black/40" />

                <div className="relative z-10 text-center px-4">
                  <h2 className={`text-white font-serif leading-tight drop-shadow-md ${previewViewport === 'mobile' ? 'text-sm mb-1' : 'text-xl mb-2'}`}>
                    <span>{activeSlide.titleLine1}</span>
                    {activeSlide.titleLine2 && (
                      <>
                        <br />
                        <span className="text-[#d9f969]">{activeSlide.titleLine2}</span>
                      </>
                    )}
                  </h2>
                  <p className={`text-gray-200 leading-relaxed max-w-[200px] mx-auto drop-shadow-md ${previewViewport === 'mobile' ? 'text-[8px]' : 'text-[10px]'}`}>
                    {activeSlide.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <span className="text-xs font-bold text-gray-500">
                  Showing Slide {activePreviewIndex + 1} of {slides.length} ({previewViewport === 'desktop' ? 'Desktop View' : 'Mobile View'})
                </span>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400 text-xs">
              Select or create a slide to preview.
            </div>
          )}
        </div>
      </div>

      {/* SLIDE ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-gray-900">{editingSlideId ? 'Edit Slide' : 'Add New Slide'}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-gray-150 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                    <span>Title Line 1 *</span>
                    <span className="text-gray-400 font-medium">{(slideForm.titleLine1 || '').length}/30</span>
                  </label>
                  <input
                    type="text"
                    value={slideForm.titleLine1}
                    onChange={e => setSlideForm(p => ({ ...p, titleLine1: e.target.value }))}
                    maxLength={30}
                    placeholder="e.g. Experience Luxury Like"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                    <span>Title Line 2 (Colored/Optional)</span>
                    <span className="text-gray-400 font-medium">{(slideForm.titleLine2 || '').length}/30</span>
                  </label>
                  <input
                    type="text"
                    value={slideForm.titleLine2}
                    onChange={e => setSlideForm(p => ({ ...p, titleLine2: e.target.value }))}
                    maxLength={30}
                    placeholder="e.g. Never Before"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-all font-semibold text-[#849a21]"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Subtitle / Description</span>
                  <span className="text-gray-400 font-medium">{(slideForm.subtitle || '').length}/150</span>
                </label>
                <textarea
                  value={slideForm.subtitle}
                  onChange={e => setSlideForm(p => ({ ...p, subtitle: e.target.value }))}
                  maxLength={150}
                  rows={2}
                  placeholder="e.g. Discover our handpicked collection of world-class villas..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-all resize-none font-medium"
                />
              </div>

              {/* Media Toggle */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Media Type</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSlideForm(p => ({ ...p, mediaType: 'image' }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${slideForm.mediaType === 'image' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Responsive Images (Desktop & Mobile)
                  </button>
                  <button 
                    onClick={() => setSlideForm(p => ({ ...p, mediaType: 'video' }))}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${slideForm.mediaType === 'video' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Background Video (Desktop Only)
                  </button>
                </div>
              </div>

              {/* VIDEO FIELDS */}
              {slideForm.mediaType === 'video' ? (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">External Video URL</label>
                    <input
                      type="url"
                      value={slideForm.videoUrl}
                      onChange={e => {
                        setSlideForm(p => ({ ...p, videoUrl: e.target.value }));
                        setVideoPreview(e.target.value);
                        setVideoFile(null);
                      }}
                      placeholder="https://example.com/video.mp4"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Or Upload Local Video File</label>
                    <input 
                      type="file" 
                      ref={videoInputRef}
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 20 * 1024 * 1024) {
                            toast.error('Video file size exceeds 20MB limit');
                            return;
                          }
                          setVideoFile(file);
                          setVideoPreview(URL.createObjectURL(file));
                          setSlideForm(p => ({ ...p, videoUrl: '' }));
                        }
                      }}
                      accept="video/*" 
                      className="hidden" 
                    />
                    <div 
                      onClick={() => videoInputRef.current.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${videoFile ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Upload className="w-6 h-6 mx-auto mb-1.5 text-gray-400" />
                      <p className="text-xs font-bold text-gray-700">{videoFile ? videoFile.name : 'Click to select Video File'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">MP4, WebM up to 20MB</p>
                    </div>
                  </div>

                  {videoPreview && (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-gray-100">
                      <video key={videoPreview} src={videoPreview} autoPlay muted loop className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          setVideoFile(null);
                          setVideoPreview('');
                          setSlideForm(p => ({ ...p, videoUrl: '' }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // IMAGE FIELDS (Desktop & Mobile)
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Desktop image upload */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Desktop Background Image (Standard/Wide)</label>
                      <input 
                        type="file" 
                        ref={desktopImgInputRef}
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const fName = file.name.toLowerCase();
                            if (fName.endsWith('.heic') || fName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
                              toast.error('HEIC format is not supported.');
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Image upload limit is 5MB only.');
                              return;
                            }
                            setDesktopImageFile(file);
                            setDesktopPreview(URL.createObjectURL(file));
                            setSlideForm(p => ({ ...p, backgroundImage: '' }));
                          }
                        }}
                        accept="image/*" 
                        className="hidden" 
                      />
                      <div 
                        onClick={() => desktopImgInputRef.current.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${desktopImageFile ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                        <p className="text-[11px] font-bold text-gray-700 truncate">{desktopImageFile ? desktopImageFile.name : 'Upload Desktop WebP/JPG/PNG'}</p>
                        <p className="text-[9px] text-gray-400">Desktop View, up to 5MB</p>
                      </div>

                      {/* Desktop Preview */}
                      {desktopPreview && (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                          <img src={desktopPreview} className="w-full h-full object-cover" alt="Desktop Preview" />
                          <button 
                            onClick={() => {
                              setDesktopImageFile(null);
                              setDesktopPreview('');
                              setSlideForm(p => ({ ...p, backgroundImage: '' }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mobile image upload */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mobile Background Image (Tall/Square)</label>
                      <input 
                        type="file" 
                        ref={mobileImgInputRef}
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const fName = file.name.toLowerCase();
                            if (fName.endsWith('.heic') || fName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
                              toast.error('HEIC format is not supported.');
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Image upload limit is 5MB only.');
                              return;
                            }
                            setMobileImageFile(file);
                            setMobilePreview(URL.createObjectURL(file));
                            setSlideForm(p => ({ ...p, mobileImage: '' }));
                          }
                        }}
                        accept="image/*" 
                        className="hidden" 
                      />
                      <div 
                        onClick={() => mobileImgInputRef.current.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${mobileImageFile ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                        <p className="text-[11px] font-bold text-gray-700 truncate">{mobileImageFile ? mobileImageFile.name : 'Upload Mobile WebP/JPG/PNG'}</p>
                        <p className="text-[9px] text-gray-400">Mobile/Tablet View, up to 5MB</p>
                      </div>

                      {/* Mobile Preview */}
                      {mobilePreview && (
                        <div className="relative w-28 aspect-[3/4] mx-auto rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                          <img src={mobilePreview} className="w-full h-full object-cover" alt="Mobile Preview" />
                          <button 
                            onClick={() => {
                              setMobileImageFile(null);
                              setMobilePreview('');
                              setSlideForm(p => ({ ...p, mobileImage: '' }));
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Or external URLs */}
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Or External Desktop Image URL</label>
                      <input
                        type="url"
                        value={slideForm.backgroundImage}
                        onChange={e => {
                          setSlideForm(p => ({ ...p, backgroundImage: e.target.value }));
                          setDesktopPreview(e.target.value);
                          setDesktopImageFile(null);
                        }}
                        placeholder="https://example.com/desktop-image.jpg"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Or External Mobile Image URL</label>
                      <input
                        type="url"
                        value={slideForm.mobileImage}
                        onChange={e => {
                          setSlideForm(p => ({ ...p, mobileImage: e.target.value }));
                          setMobilePreview(e.target.value);
                          setMobileImageFile(null);
                        }}
                        placeholder="https://example.com/mobile-image.jpg"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end shrink-0 bg-gray-50 rounded-b-2xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={submitting}
                onClick={handleSaveSlide}
                className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {submitting ? 'Saving...' : 'Save Slide'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default HeroManagement;
