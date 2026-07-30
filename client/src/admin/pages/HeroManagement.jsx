import { useState, useEffect, useRef } from 'react';
import { Film, Upload, Save, Eye, Loader2, Trash2, Plus, Edit, X, Monitor, Smartphone, Type, Palette, AlignLeft, AlignCenter, AlignRight, Check, RefreshCw, Italic } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

const FONT_FAMILY_MAP = {
  serif: { fontFamily: 'Georgia, serif' },
  playfair: { fontFamily: "'Playfair Display', Georgia, serif" },
  cinzel: { fontFamily: "'Cinzel', Trajan Pro, serif" },
  montserrat: { fontFamily: "'Montserrat', sans-serif" },
  mono: { fontFamily: 'monospace' },
  cursive: { fontFamily: 'cursive' },
  sans: { fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
};
const getFontFamilyStyle = (family) => FONT_FAMILY_MAP[family] || FONT_FAMILY_MAP.sans;

const TITLE_SIZE_MAP = {
  mobile: {
    small: 'text-[10px]',
    medium: 'text-[12px]',
    default: 'text-[14px]',
    large: 'text-[16px]',
    xlarge: 'text-[18px]',
    '2xlarge': 'text-[22px]',
  },
  desktop: {
    small: 'text-xs',
    medium: 'text-sm',
    default: 'text-xl',
    large: 'text-2xl',
    xlarge: 'text-3xl',
    '2xlarge': 'text-4xl',
  },
};
const getTitleSizeClass = (sizeKey, isMobile = false) => {
  const mode = isMobile ? 'mobile' : 'desktop';
  return TITLE_SIZE_MAP[mode][sizeKey] || TITLE_SIZE_MAP[mode].default;
};

const SUBTITLE_SIZE_MAP = {
  mobile: {
    small: 'text-[6px]',
    default: 'text-[8px]',
    large: 'text-[10px]',
    xlarge: 'text-[12px]',
  },
  desktop: {
    small: 'text-[9px]',
    default: 'text-[10px]',
    large: 'text-[12px]',
    xlarge: 'text-[14px]',
  },
};
const getSubtitleSizeClass = (sizeKey, isMobile = false) => {
  const mode = isMobile ? 'mobile' : 'desktop';
  return SUBTITLE_SIZE_MAP[mode][sizeKey] || SUBTITLE_SIZE_MAP[mode].default;
};

const WEIGHT_MAP = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};
const getWeightClass = (weightKey) => WEIGHT_MAP[weightKey] || WEIGHT_MAP.bold;

const ALIGN_MAP = {
  left: 'text-left items-start',
  right: 'text-right items-end',
  center: 'text-center items-center',
};
const getAlignClass = (alignKey) => ALIGN_MAP[alignKey] || ALIGN_MAP.center;

const HeroManagement = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [heroId, setHeroId] = useState(null);
  

  // Slides state
  const [slides, setSlides] = useState([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' or 'mobile'

  // Modal state for Add/Edit slide
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('content');
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // slideId pending delete
  const [slideForm, setSlideForm] = useState({
    titleLine1: '',
    titleLine2: '',
    subtitle: '',
    videoUrl: '',
    backgroundImage: '',
    mobileImage: '',
    mediaType: 'image', // 'image' or 'video'
    title1Color: '#ffffff',
    title1FontSize: 'default',
    title1FontWeight: 'bold',
    title2Color: '#d9f969',
    title2FontSize: 'default',
    title2FontWeight: 'bold',
    subtitleColor: '#ffffff',
    subtitleFontSize: 'default',
    subtitleFontWeight: 'medium',
    fontFamily: 'sans',
    textAlignment: 'center',
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
    setModalTab('content');
    setSlideForm({
      titleLine1: '',
      titleLine2: '',
      subtitle: '',
      videoUrl: '',
      backgroundImage: '',
      mobileImage: '',
      mediaType: 'image',
      title1Color: '#ffffff',
      title1FontSize: 'default',
      title1FontWeight: 'bold',
      title2Color: '#d9f969',
      title2FontSize: 'default',
      title2FontWeight: 'bold',
      subtitleColor: '#ffffff',
      subtitleFontSize: 'default',
      subtitleFontWeight: 'medium',
      fontFamily: 'sans',
      fontStyle: 'normal',
      title1FontStyle: 'normal',
      title2FontStyle: 'normal',
      subtitleFontStyle: 'normal',
      textAlignment: 'center',
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
    setModalTab('content');
    setSlideForm({
      titleLine1: slide.titleLine1 || '',
      titleLine2: slide.titleLine2 || '',
      subtitle: slide.subtitle || '',
      videoUrl: slide.videoUrl || '',
      backgroundImage: slide.backgroundImage || '',
      mobileImage: slide.mobileImage || '',
      mediaType: slide.videoUrl ? 'video' : 'image',
      title1Color: slide.title1Color || '#ffffff',
      title1FontSize: slide.title1FontSize || 'default',
      title1FontWeight: slide.title1FontWeight || 'bold',
      title2Color: slide.title2Color || '#d9f969',
      title2FontSize: slide.title2FontSize || 'default',
      title2FontWeight: slide.title2FontWeight || 'bold',
      subtitleColor: slide.subtitleColor || '#ffffff',
      subtitleFontSize: slide.subtitleFontSize || 'default',
      subtitleFontWeight: slide.subtitleFontWeight || 'medium',
      fontFamily: slide.fontFamily || 'sans',
      fontStyle: slide.fontStyle || 'normal',
      title1FontStyle: slide.title1FontStyle || 'normal',
      title2FontStyle: slide.title2FontStyle || 'normal',
      subtitleFontStyle: slide.subtitleFontStyle || 'normal',
      textAlignment: slide.textAlignment || 'center',
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
  const handleDeleteSlide = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/hero/slides/${deleteConfirmId}`);
      toast.success('Slide deleted successfully!');
      setDeleteConfirmId(null);
      fetchHeroData();
    } catch (err) {
      toast.error('Error deleting slide');
    }
  };

  // Handle slide modal save
  const handleSaveSlide = async () => {
    if (!slideForm.titleLine1) {
      toast.error('Title Line 1 is required');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('titleLine1', slideForm.titleLine1);
      formData.append('titleLine2', slideForm.titleLine2);
      formData.append('subtitle', slideForm.subtitle);
      formData.append('title1Color', slideForm.title1Color);
      formData.append('title1FontSize', slideForm.title1FontSize);
      formData.append('title1FontWeight', slideForm.title1FontWeight);
      formData.append('title2Color', slideForm.title2Color);
      formData.append('title2FontSize', slideForm.title2FontSize);
      formData.append('title2FontWeight', slideForm.title2FontWeight);
      formData.append('subtitleColor', slideForm.subtitleColor);
      formData.append('subtitleFontSize', slideForm.subtitleFontSize);
      formData.append('subtitleFontWeight', slideForm.subtitleFontWeight);
      formData.append('fontFamily', slideForm.fontFamily);
      formData.append('textAlignment', slideForm.textAlignment);

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
      setIsSaving(false);
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
      <Card className="flex flex-row justify-between items-center p-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hero Slideshow Settings</h1>
          <p className="text-xs text-gray-500 mt-1">Add multiple homepage slides, configure typography, desktop vs mobile banner images, and view simulated live previews.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="gap-2 font-bold">
          <Plus className="w-4 h-4" /> Add Slide
        </Button>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Slides list and stats */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* SLIDES LIST - SHADCN UI REDESIGN */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-gray-900 text-base">Carousel Slides</h2>
                <Badge variant="secondary" className="font-bold">{slides.length} Slides</Badge>
              </div>
              <Button onClick={handleOpenAddModal} size="sm" className="gap-1.5 font-bold">
                <Plus className="w-4 h-4" /> Add Slide
              </Button>
            </div>

            {slides.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <Film className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No slides configured yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add Slide" to create your first homepage banner.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Title & Subtitle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slides.map((slide, index) => {
                    const media = getMediaSource(slide);
                    const isAct = index === activePreviewIndex;
                    return (
                      <TableRow 
                        key={slide._id || index}
                        onClick={() => setActivePreviewIndex(index)}
                        className={`cursor-pointer transition-colors ${isAct ? 'bg-primary-50/30 font-semibold' : ''}`}
                      >
                        <TableCell className="font-bold text-gray-500">{index + 1}</TableCell>
                        <TableCell>
                          <div className="w-20 h-12 rounded-lg bg-gray-950 overflow-hidden relative border border-gray-200 shrink-0">
                            {slide.videoUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-[9px] font-black">
                                VIDEO
                              </div>
                            ) : slide.backgroundImage ? (
                              <img 
                                src={slide.backgroundImage.startsWith('http') ? slide.backgroundImage : `${baseUrl}${slide.backgroundImage}`} 
                                className="w-full h-full object-cover" 
                                alt="Slide thumb" 
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gray-200" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5 max-w-[200px] sm:max-w-[260px]">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {slide.titleLine1} <span className="text-primary-600">{slide.titleLine2}</span>
                            </p>
                            <p className="text-xs text-gray-500 truncate">{slide.subtitle || 'No subtitle description'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {slide.videoUrl ? (
                            <Badge variant="destructive" className="text-[10px] uppercase font-bold">Video</Badge>
                          ) : (
                            <Badge variant="default" className="text-[10px] uppercase font-bold">Image</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenEditModal(slide)}
                              className="h-8 px-2 text-gray-600 hover:text-primary-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteConfirmId(slide._id)}
                              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

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
                className={`overflow-hidden bg-gray-950 relative shadow-inner border-0 transition-all duration-300 rounded-2xl flex flex-col justify-center items-center ${previewViewport === 'mobile' ? 'w-[230px] h-[330px]' : 'w-full aspect-video'}`}
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

                <div 
                  className={`relative z-10 w-full px-4 flex flex-col ${getAlignClass(activeSlide.textAlignment)}`}
                  style={getFontFamilyStyle(activeSlide.fontFamily)}
                >
                  <h2 className="leading-tight drop-shadow-md">
                    <span 
                      style={{ color: activeSlide.title1Color || '#ffffff' }}
                      className={`${getTitleSizeClass(activeSlide.title1FontSize, previewViewport === 'mobile')} ${getWeightClass(activeSlide.title1FontWeight)} inline-block`}
                    >
                      {activeSlide.titleLine1}
                    </span>
                    {activeSlide.titleLine2 && (
                      <>
                        <br />
                        <span 
                          style={{ color: activeSlide.title2Color || '#d9f969' }}
                          className={`${getTitleSizeClass(activeSlide.title2FontSize, previewViewport === 'mobile')} ${getWeightClass(activeSlide.title2FontWeight)} inline-block`}
                        >
                          {activeSlide.titleLine2}
                        </span>
                      </>
                    )}
                  </h2>
                  <p 
                    style={{ color: activeSlide.subtitleColor || '#ffffff' }}
                    className={`leading-relaxed max-w-[240px] drop-shadow-md mt-1 ${getSubtitleSizeClass(activeSlide.subtitleFontSize, previewViewport === 'mobile')} ${getWeightClass(activeSlide.subtitleFontWeight)}`}
                  >
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

      {/* SLIDE ADD / EDIT MODAL WITH INTEGRATED INLINE STYLES & LIVE PREVIEW */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl  flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingSlideId ? 'Edit Slide' : 'Add New Slide'}</h3>
                <p className="text-xs text-gray-400">Configure content, typography, colors, and media with real-time preview</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* REAL-TIME DYNAMIC LIVE BANNER PREVIEW IN MODAL */}
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span>Live Banner Preview</span>
                  <span>Real-time Update</span>
                </div>
                <div className="w-full aspect-video rounded-xl bg-gray-950 overflow-hidden relative shadow-inner flex flex-col justify-center items-center">
                  {slideForm.mediaType === 'video' && (videoPreview || slideForm.videoUrl) ? (
                    <video
                      key={videoPreview || slideForm.videoUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src={videoPreview || slideForm.videoUrl} />
                    </video>
                  ) : (desktopPreview || slideForm.backgroundImage) ? (
                    <img
                      key={desktopPreview || slideForm.backgroundImage}
                      src={desktopPreview || slideForm.backgroundImage}
                      alt="Live Modal Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900" />
                  )}

                  <div className="absolute inset-0 bg-black/40" />

                  <div 
                    className={`relative z-10 w-full px-6 flex flex-col ${getAlignClass(slideForm.textAlignment)}`}
                    style={{ ...getFontFamilyStyle(slideForm.fontFamily), fontStyle: slideForm.fontStyle || 'normal' }}
                  >
                    <h2 className="leading-tight drop-shadow-md">
                      <span 
                        style={{ color: slideForm.title1Color || '#ffffff', fontStyle: slideForm.title1FontStyle || 'normal' }}
                        className={`${getTitleSizeClass(slideForm.title1FontSize, false)} ${getWeightClass(slideForm.title1FontWeight)} inline-block`}
                      >
                        {slideForm.titleLine1 || 'Your Title Line 1'}
                      </span>
                      {slideForm.titleLine2 && (
                        <>
                          <br />
                          <span 
                            style={{ color: slideForm.title2Color || '#d9f969', fontStyle: slideForm.title2FontStyle || 'normal' }}
                            className={`${getTitleSizeClass(slideForm.title2FontSize, false)} ${getWeightClass(slideForm.title2FontWeight)} inline-block`}
                          >
                            {slideForm.titleLine2}
                          </span>
                        </>
                      )}
                    </h2>
                    {slideForm.subtitle && (
                      <p 
                        style={{ color: slideForm.subtitleColor || '#ffffff', fontStyle: slideForm.subtitleFontStyle || 'normal' }}
                        className={`leading-relaxed max-w-md drop-shadow-md mt-1.5 ${getSubtitleSizeClass(slideForm.subtitleFontSize, false)} ${getWeightClass(slideForm.subtitleFontWeight)}`}
                      >
                        {slideForm.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* UNIFIED FORM WITH INTEGRATED INLINE STYLES */}
              <div className="space-y-5">

                {/* 1. TITLE LINE 1 + INLINE STYLES */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-primary-600" /> Title Line 1 *
                    </Label>
                    <span className="text-xs text-gray-400">{(slideForm.titleLine1 || '').length}/30</span>
                  </div>
                  <Input
                    type="text"
                    value={slideForm.titleLine1}
                    onChange={e => setSlideForm(p => ({ ...p, titleLine1: e.target.value }))}
                    maxLength={30}
                    placeholder="e.g. Experience Luxury Like"
                    className="font-semibold text-gray-900 bg-white"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={slideForm.title1Color}
                          onChange={e => setSlideForm(p => ({ ...p, title1Color: e.target.value }))}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0 bg-white"
                        />
                        <Input
                          type="text"
                          value={slideForm.title1Color}
                          onChange={e => setSlideForm(p => ({ ...p, title1Color: e.target.value }))}
                          className="uppercase font-mono text-xs text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Size</Label>
                      <Select value={slideForm.title1FontSize} onValueChange={val => setSlideForm(p => ({ ...p, title1FontSize: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="default">Standard</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xlarge">Extra Large</SelectItem>
                          <SelectItem value="2xlarge">Huge (2XL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Weight</Label>
                      <Select value={slideForm.title1FontWeight} onValueChange={val => setSlideForm(p => ({ ...p, title1FontWeight: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (400)</SelectItem>
                          <SelectItem value="medium">Medium (500)</SelectItem>
                          <SelectItem value="semibold">Semi Bold (600)</SelectItem>
                          <SelectItem value="bold">Bold (700)</SelectItem>
                          <SelectItem value="extrabold">Extra Bold (800)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Style</Label>
                      <div className="flex gap-1">
                        <Button type="button" size="sm"
                          variant={slideForm.title1FontStyle === 'italic' ? 'default' : 'outline'}
                          onClick={() => setSlideForm(p => ({ ...p, title1FontStyle: p.title1FontStyle === 'italic' ? 'normal' : 'italic' }))}
                          className="flex-1 gap-1 text-xs italic"
                        >
                          <Italic className="w-3 h-3" /> Italic
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. TITLE LINE 2 (HIGHLIGHT) + INLINE STYLES */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-primary-600" /> Title Line 2 (Colored Highlight)
                    </Label>
                    <span className="text-xs text-gray-400">{(slideForm.titleLine2 || '').length}/30</span>
                  </div>
                  <Input
                    type="text"
                    value={slideForm.titleLine2}
                    onChange={e => setSlideForm(p => ({ ...p, titleLine2: e.target.value }))}
                    maxLength={30}
                    placeholder="e.g. Never Before"
                    className="font-semibold text-gray-900 bg-white"
                    style={{ color: slideForm.title2Color }}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={slideForm.title2Color}
                          onChange={e => setSlideForm(p => ({ ...p, title2Color: e.target.value }))}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0 bg-white"
                        />
                        <Input
                          type="text"
                          value={slideForm.title2Color}
                          onChange={e => setSlideForm(p => ({ ...p, title2Color: e.target.value }))}
                          className="uppercase font-mono text-xs text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Size</Label>
                      <Select value={slideForm.title2FontSize} onValueChange={val => setSlideForm(p => ({ ...p, title2FontSize: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="default">Standard</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xlarge">Extra Large</SelectItem>
                          <SelectItem value="2xlarge">Huge (2XL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Weight</Label>
                      <Select value={slideForm.title2FontWeight} onValueChange={val => setSlideForm(p => ({ ...p, title2FontWeight: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (400)</SelectItem>
                          <SelectItem value="medium">Medium (500)</SelectItem>
                          <SelectItem value="semibold">Semi Bold (600)</SelectItem>
                          <SelectItem value="bold">Bold (700)</SelectItem>
                          <SelectItem value="extrabold">Extra Bold (800)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Style</Label>
                      <div className="flex gap-1">
                        <Button type="button" size="sm"
                          variant={slideForm.title2FontStyle === 'italic' ? 'default' : 'outline'}
                          onClick={() => setSlideForm(p => ({ ...p, title2FontStyle: p.title2FontStyle === 'italic' ? 'normal' : 'italic' }))}
                          className="flex-1 gap-1 text-xs italic"
                        >
                          <Italic className="w-3 h-3" /> Italic
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. SUBTITLE / DESCRIPTION + INLINE STYLES */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Subtitle / Description
                    </Label>
                    <span className="text-xs text-gray-400">{(slideForm.subtitle || '').length}/150</span>
                  </div>
                  <Textarea
                    value={slideForm.subtitle}
                    onChange={e => setSlideForm(p => ({ ...p, subtitle: e.target.value }))}
                    maxLength={150}
                    rows={2}
                    placeholder="e.g. Discover our handpicked collection of world-class villas..."
                    className="resize-none font-medium text-gray-900 bg-white"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={slideForm.subtitleColor}
                          onChange={e => setSlideForm(p => ({ ...p, subtitleColor: e.target.value }))}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0 bg-white"
                        />
                        <Input
                          type="text"
                          value={slideForm.subtitleColor}
                          onChange={e => setSlideForm(p => ({ ...p, subtitleColor: e.target.value }))}
                          className="uppercase font-mono text-xs text-gray-900 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Size</Label>
                      <Select value={slideForm.subtitleFontSize} onValueChange={val => setSlideForm(p => ({ ...p, subtitleFontSize: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="default">Standard</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xlarge">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Font Weight</Label>
                      <Select value={slideForm.subtitleFontWeight} onValueChange={val => setSlideForm(p => ({ ...p, subtitleFontWeight: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (400)</SelectItem>
                          <SelectItem value="medium">Medium (500)</SelectItem>
                          <SelectItem value="semibold">Semi Bold (600)</SelectItem>
                          <SelectItem value="bold">Bold (700)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Style</Label>
                      <div className="flex gap-1">
                        <Button type="button" size="sm"
                          variant={slideForm.subtitleFontStyle === 'italic' ? 'default' : 'outline'}
                          onClick={() => setSlideForm(p => ({ ...p, subtitleFontStyle: p.subtitleFontStyle === 'italic' ? 'normal' : 'italic' }))}
                          className="flex-1 gap-1 text-xs italic"
                        >
                          <Italic className="w-3 h-3" /> Italic
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. GLOBAL FONT FAMILY, FONT STYLE & ALIGNMENT */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Font Family */}
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-primary-600" /> Font Family
                      </Label>
                      <Select value={slideForm.fontFamily} onValueChange={val => setSlideForm(p => ({ ...p, fontFamily: val }))}>
                        <SelectTrigger className="text-xs text-gray-900 bg-white">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sans">System Sans (Modern Clean)</SelectItem>
                          <SelectItem value="serif">Classic Serif (Elegant)</SelectItem>
                          <SelectItem value="playfair">Playfair Display (Luxury)</SelectItem>
                          <SelectItem value="cinzel">Cinzel (Regal / Hotel)</SelectItem>
                          <SelectItem value="montserrat">Montserrat (Bold Modern)</SelectItem>
                          <SelectItem value="mono">Monospace (Technical)</SelectItem>
                          <SelectItem value="cursive">Cursive (Script)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Style: Normal / Italic */}
                    <div>
                      <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Italic className="w-3.5 h-3.5 text-primary-600" /> Font Style
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={slideForm.fontStyle === 'normal' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideForm(p => ({ ...p, fontStyle: 'normal' }))}
                          className="flex-1 gap-1.5 font-semibold"
                        >
                          <Type className="w-4 h-4" /> Normal
                        </Button>
                        <Button
                          type="button"
                          variant={slideForm.fontStyle === 'italic' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSlideForm(p => ({ ...p, fontStyle: 'italic' }))}
                          className="flex-1 gap-1.5 italic font-semibold"
                        >
                          <Italic className="w-4 h-4" /> Italic
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Text Alignment</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={slideForm.textAlignment === 'left' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSlideForm(p => ({ ...p, textAlignment: 'left' }))}
                        className="flex-1 gap-1"
                      >
                        <AlignLeft className="w-4 h-4" /> Left
                      </Button>
                      <Button
                        type="button"
                        variant={slideForm.textAlignment === 'center' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSlideForm(p => ({ ...p, textAlignment: 'center' }))}
                        className="flex-1 gap-1"
                      >
                        <AlignCenter className="w-4 h-4" /> Center
                      </Button>
                      <Button
                        type="button"
                        variant={slideForm.textAlignment === 'right' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSlideForm(p => ({ ...p, textAlignment: 'right' }))}
                        className="flex-1 gap-1"
                      >
                        <AlignRight className="w-4 h-4" /> Right
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 5. MEDIA TYPE & UPLOADS */}
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4">
                  <div>
                    <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Media Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={slideForm.mediaType === 'image' ? 'default' : 'outline'}
                        onClick={() => setSlideForm(p => ({ ...p, mediaType: 'image' }))}
                        className="flex-1 font-bold"
                      >
                        Responsive Images (Desktop & Mobile)
                      </Button>
                      {/* Background Video option temporarily hidden */}
                      {/*
                      <Button
                        type="button"
                        variant={slideForm.mediaType === 'video' ? 'default' : 'outline'}
                        onClick={() => setSlideForm(p => ({ ...p, mediaType: 'video' }))}
                        className="flex-1 font-bold"
                      >
                        Background Video (Desktop Only)
                      </Button>
                      */}
                    </div>
                  </div>

                  {slideForm.mediaType === 'video' ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">External Video URL</Label>
                        <Input
                          type="url"
                          value={slideForm.videoUrl}
                          onChange={e => {
                            setSlideForm(p => ({ ...p, videoUrl: e.target.value }));
                            setVideoPreview(e.target.value);
                            setVideoFile(null);
                          }}
                          placeholder="https://example.com/video.mp4"
                          className="font-semibold text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Or Upload Local Video File</Label>
                        <input 
                          type="file" 
                          ref={videoInputRef}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
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
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${videoFile ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        >
                          <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                          <p className="text-xs font-bold text-gray-700">{videoFile ? videoFile.name : 'Click to select Video File'}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">MP4, WebM up to 20MB</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Desktop Image File</Label>
                        <input 
                          type="file" 
                          ref={desktopImgInputRef}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Upload 5MB only');
                                e.target.value = '';
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
                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-500 transition-all bg-white overflow-hidden relative group"
                        >
                          {desktopPreview || slideForm.backgroundImage ? (
                            <div className="w-full h-24 relative">
                              <img src={desktopPreview || (slideForm.backgroundImage.startsWith('http') ? slideForm.backgroundImage : `${baseUrl}${slideForm.backgroundImage}`)} alt="Desktop Preview" className="w-full h-full object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                <Upload className="w-4 h-4 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change Image</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs font-bold text-gray-700 truncate">Upload Desktop Image</p>
                              <p className="text-[10px] text-gray-400">Desktop View up to 5MB</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Mobile Image File</Label>
                        <input 
                          type="file" 
                          ref={mobileImgInputRef}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Upload 5MB only');
                                e.target.value = '';
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
                          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-500 transition-all bg-white overflow-hidden relative group"
                        >
                          {mobilePreview || slideForm.mobileImage ? (
                            <div className="w-full h-24 relative">
                              <img src={mobilePreview || (slideForm.mobileImage.startsWith('http') ? slideForm.mobileImage : `${baseUrl}${slideForm.mobileImage}`)} alt="Mobile Preview" className="w-full h-full object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                <Upload className="w-4 h-4 text-white mb-1" />
                                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change Image</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs font-bold text-gray-700 truncate">Upload Mobile Image</p>
                              <p className="text-[10px] text-gray-400">Mobile View up to 5MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="font-semibold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSlide} 
                disabled={isSaving}
                className="font-bold gap-2 min-w-32"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Slide
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Red accent top bar */}
            {/* <div className="h-1.5 w-full bg-gradient-to-r from-red-500 to-rose-600" /> */}

            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-100 mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>

              {/* Heading */}
              <h3 className="text-center text-lg font-bold text-gray-900 mb-1">Delete Slide?</h3>
              <p className="text-center text-sm text-gray-500 mb-3">
                This action is permanent and cannot be undone.
              </p>

              {/* Slide title pill */}
              {(() => {
                const s = slides.find(sl => sl._id === deleteConfirmId);
                return s ? (
                  <p className="text-center text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5 truncate">
                    "{s.titleLine1}{s.titleLine2 ? ' ' + s.titleLine2 : ''}"
                  </p>
                ) : <div className="mb-5" />;
              })()}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 font-semibold"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 font-bold bg-red-600 hover:bg-red-700 text-white gap-2"
                  onClick={handleDeleteSlide}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroManagement;
