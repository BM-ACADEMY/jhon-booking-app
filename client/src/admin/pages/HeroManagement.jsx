import { useState, useEffect, useRef } from 'react';
import { Film, Upload, Save, Eye, Loader2, Trash2, Plus, Edit, X, Monitor, Smartphone, Type, Palette, AlignLeft, AlignCenter, AlignRight, Check, RefreshCw, Italic, Sparkles } from 'lucide-react';
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
  TableRow,
  TableCell,
  TableHead,
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
  const [modalPreviewViewport, setModalPreviewViewport] = useState('desktop'); // 'desktop' or 'mobile' inside modal

  // Modal state for Add/Edit slide
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [slideForm, setSlideForm] = useState({
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
    title1FontStyle: 'normal',
    title2Color: '#d9f969',
    title2FontSize: 'default',
    title2FontWeight: 'bold',
    title2FontStyle: 'normal',
    subtitleColor: '#ffffff',
    subtitleFontSize: 'default',
    subtitleFontWeight: 'medium',
    subtitleFontStyle: 'normal',
    fontFamily: 'sans',
    fontStyle: 'normal',
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
      title1FontStyle: 'normal',
      title2Color: '#d9f969',
      title2FontSize: 'default',
      title2FontWeight: 'bold',
      title2FontStyle: 'normal',
      subtitleColor: '#ffffff',
      subtitleFontSize: 'default',
      subtitleFontWeight: 'medium',
      subtitleFontStyle: 'normal',
      fontFamily: 'sans',
      fontStyle: 'normal',
      textAlignment: 'center',
    });
    setVideoFile(null);
    setDesktopImageFile(null);
    setMobileImageFile(null);
    setVideoPreview('');
    setDesktopPreview('');
    setMobilePreview('');
    setModalPreviewViewport('desktop');
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
      title1Color: slide.title1Color || '#ffffff',
      title1FontSize: slide.title1FontSize || 'default',
      title1FontWeight: slide.title1FontWeight || 'bold',
      title1FontStyle: slide.title1FontStyle || 'normal',
      title2Color: slide.title2Color || '#d9f969',
      title2FontSize: slide.title2FontSize || 'default',
      title2FontWeight: slide.title2FontWeight || 'bold',
      title2FontStyle: slide.title2FontStyle || 'normal',
      subtitleColor: slide.subtitleColor || '#ffffff',
      subtitleFontSize: slide.subtitleFontSize || 'default',
      subtitleFontWeight: slide.subtitleFontWeight || 'medium',
      subtitleFontStyle: slide.subtitleFontStyle || 'normal',
      fontFamily: slide.fontFamily || 'sans',
      fontStyle: slide.fontStyle || 'normal',
      textAlignment: slide.textAlignment || 'center',
    });
    setVideoFile(null);
    setDesktopImageFile(null);
    setMobileImageFile(null);

    setVideoPreview(slide.videoUrl ? (slide.videoUrl.startsWith('http') ? slide.videoUrl : `${baseUrl}${slide.videoUrl}`) : '');
    setDesktopPreview(slide.backgroundImage ? (slide.backgroundImage.startsWith('http') ? slide.backgroundImage : `${baseUrl}${slide.backgroundImage}`) : '');
    setMobilePreview(slide.mobileImage ? (slide.mobileImage.startsWith('http') ? slide.mobileImage : `${baseUrl}${slide.mobileImage}`) : '');
    setModalPreviewViewport('desktop');
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
      formData.append('title1FontStyle', slideForm.title1FontStyle || 'normal');
      formData.append('title2Color', slideForm.title2Color);
      formData.append('title2FontSize', slideForm.title2FontSize);
      formData.append('title2FontWeight', slideForm.title2FontWeight);
      formData.append('title2FontStyle', slideForm.title2FontStyle || 'normal');
      formData.append('subtitleColor', slideForm.subtitleColor);
      formData.append('subtitleFontSize', slideForm.subtitleFontSize);
      formData.append('subtitleFontWeight', slideForm.subtitleFontWeight);
      formData.append('subtitleFontStyle', slideForm.subtitleFontStyle || 'normal');
      formData.append('fontFamily', slideForm.fontFamily);
      formData.append('fontStyle', slideForm.fontStyle || 'normal');
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

  const getModalMediaSource = () => {
    if (slideForm.mediaType === 'video') {
      return { type: 'video', src: videoPreview || slideForm.videoUrl };
    }
    const imgSrc = modalPreviewViewport === 'mobile' && (mobilePreview || slideForm.mobileImage) 
      ? (mobilePreview || (slideForm.mobileImage.startsWith('http') ? slideForm.mobileImage : `${baseUrl}${slideForm.mobileImage}`))
      : (desktopPreview || (slideForm.backgroundImage.startsWith('http') ? slideForm.backgroundImage : `${baseUrl}${slideForm.backgroundImage}`));
    
    return { type: 'image', src: imgSrc };
  };

  const activeSlide = slides[activePreviewIndex];
  const activeMedia = getMediaSource(activeSlide);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Card - Fully Responsive */}
      <Card className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 gap-4 border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Film className="w-5 h-5 text-primary-600" /> Hero Slideshow Settings
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage homepage banners, custom typography, mobile/desktop media, and live previews.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} className="gap-2 font-bold shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Slide
        </Button>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Slides list */}
        <div className="xl:col-span-3 space-y-6">
          <Card className="p-4 sm:p-6 space-y-4 border-gray-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-gray-900 text-base">Carousel Slides</h2>
                <Badge variant="secondary" className="font-bold">{slides.length} Slides</Badge>
              </div>
              <Button onClick={handleOpenAddModal} size="sm" className="gap-1.5 font-bold w-full sm:w-auto">
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
              /* Responsive Table Wrapper */
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <Table>
                  <TableHeader className="bg-gray-50/60">
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="w-24">Preview</TableHead>
                      <TableHead>Title & Subtitle</TableHead>
                      <TableHead className="w-20">Type</TableHead>
                      <TableHead className="text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slides.map((slide, index) => {
                      const isAct = index === activePreviewIndex;
                      return (
                        <TableRow 
                          key={slide._id || index}
                          onClick={() => setActivePreviewIndex(index)}
                          className={`cursor-pointer transition-colors ${isAct ? 'bg-primary-50/40 font-semibold' : ''}`}
                        >
                          <TableCell className="font-bold text-gray-500 text-xs">{index + 1}</TableCell>
                          <TableCell>
                            <div className="w-16 h-10 sm:w-20 sm:h-12 rounded-lg bg-gray-950 overflow-hidden relative border border-gray-200 shrink-0">
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
                            <div className="space-y-0.5 max-w-[150px] sm:max-w-[240px]">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                {slide.titleLine1} <span className="text-primary-600">{slide.titleLine2}</span>
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">{slide.subtitle || 'No description'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {slide.videoUrl ? (
                              <Badge variant="destructive" className="text-[9px] uppercase font-bold px-1.5 py-0.5">Video</Badge>
                            ) : (
                              <Badge variant="default" className="text-[9px] uppercase font-bold px-1.5 py-0.5">Image</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleOpenEditModal(slide)}
                                className="h-8 w-8 p-0 text-gray-600 hover:text-primary-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setDeleteConfirmId(slide._id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
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
              </div>
            )}
          </Card>
        </div>

        {/* Live Banner Preview Panel */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 sm:p-5 flex flex-col h-fit space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary-600" /> Live Banner Preview
            </h3>
            
            {/* Viewport simulation buttons */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1.5 rounded-md transition-all text-xs font-semibold flex items-center gap-1 ${previewViewport === 'desktop' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Monitor className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Desktop</span>
              </button>
              <button 
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1.5 rounded-md transition-all text-xs font-semibold flex items-center gap-1 ${previewViewport === 'mobile' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {activeSlide ? (
            <div className="flex flex-col items-center">
              {/* Device Container */}
              <div 
                className={`overflow-hidden bg-gray-950 relative shadow-inner border-0 transition-all duration-300 rounded-xl flex flex-col justify-center items-center ${previewViewport === 'mobile' ? 'w-[220px] h-[310px]' : 'w-full aspect-video'}`}
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
                  style={{ ...getFontFamilyStyle(activeSlide.fontFamily), fontStyle: activeSlide.fontStyle || 'normal' }}
                >
                  <h2 className="leading-tight drop-shadow-md">
                    <span 
                      style={{ color: activeSlide.title1Color || '#ffffff', fontStyle: activeSlide.title1FontStyle || 'normal' }}
                      className={`${getTitleSizeClass(activeSlide.title1FontSize, previewViewport === 'mobile')} ${getWeightClass(activeSlide.title1FontWeight)} inline-block`}
                    >
                      {activeSlide.titleLine1}
                    </span>
                    {activeSlide.titleLine2 && (
                      <>
                        <br />
                        <span 
                          style={{ color: activeSlide.title2Color || '#d9f969', fontStyle: activeSlide.title2FontStyle || 'normal' }}
                          className={`${getTitleSizeClass(activeSlide.title2FontSize, previewViewport === 'mobile')} ${getWeightClass(activeSlide.title2FontWeight)} inline-block`}
                        >
                          {activeSlide.titleLine2}
                        </span>
                      </>
                    )}
                  </h2>
                  <p 
                    style={{ color: activeSlide.subtitleColor || '#ffffff', fontStyle: activeSlide.subtitleFontStyle || 'normal' }}
                    className={`leading-relaxed max-w-[240px] drop-shadow-md mt-1 ${getSubtitleSizeClass(activeSlide.subtitleFontSize, previewViewport === 'mobile')} ${getWeightClass(activeSlide.subtitleFontWeight)}`}
                  >
                    {activeSlide.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-[11px] font-semibold text-gray-500">
                  Slide {activePreviewIndex + 1} of {slides.length} ({previewViewport === 'desktop' ? 'Desktop View' : 'Mobile View'})
                </span>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-400 text-xs">
              Select or create a slide to preview.
            </div>
          )}
        </div>
      </div>

      {/* SHADCN DIALOG - CENTER MODE SCROLLABLE SLIDE EDIT/ADD MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-gray-200">
          
          {/* Fixed Header */}
          <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-white shrink-0 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {editingSlideId ? 'Edit Slide' : 'Add New Slide'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Configure banner text, typography, colors, and media with live preview
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Center Scrollable Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* SHADCN STYLED LIVE BANNER PREVIEW IN MODAL */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Preview</span>
                </div>

                {/* Viewport toggle inside modal preview */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalPreviewViewport('desktop')}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${modalPreviewViewport === 'desktop' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Monitor className="w-3 h-3" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalPreviewViewport('mobile')}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${modalPreviewViewport === 'mobile' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Smartphone className="w-3 h-3" /> Mobile
                  </button>
                </div>
              </div>

              {/* Preview Canvas */}
              <div className={`overflow-hidden bg-gray-950 relative shadow-inner rounded-lg flex flex-col justify-center items-center transition-all duration-300 ${modalPreviewViewport === 'mobile' ? 'max-w-[240px] h-[300px] mx-auto' : 'w-full aspect-video'}`}>
                {getModalMediaSource().type === 'video' && getModalMediaSource().src ? (
                  <video
                    key={getModalMediaSource().src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={getModalMediaSource().src} />
                  </video>
                ) : getModalMediaSource().src ? (
                  <img
                    key={getModalMediaSource().src}
                    src={getModalMediaSource().src}
                    alt="Live Modal Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-slate-700 animate-pulse" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40" />

                <div 
                  className={`relative z-10 w-full px-4 flex flex-col ${getAlignClass(slideForm.textAlignment)}`}
                  style={{ ...getFontFamilyStyle(slideForm.fontFamily), fontStyle: slideForm.fontStyle || 'normal' }}
                >
                  <h2 className="leading-tight drop-shadow-md">
                    <span 
                      style={{ color: slideForm.title1Color || '#ffffff', fontStyle: slideForm.title1FontStyle || 'normal' }}
                      className={`${getTitleSizeClass(slideForm.title1FontSize, modalPreviewViewport === 'mobile')} ${getWeightClass(slideForm.title1FontWeight)} inline-block`}
                    >
                      {slideForm.titleLine1 || 'Your Title Line 1'}
                    </span>
                    {slideForm.titleLine2 && (
                      <>
                        <br />
                        <span 
                          style={{ color: slideForm.title2Color || '#d9f969', fontStyle: slideForm.title2FontStyle || 'normal' }}
                          className={`${getTitleSizeClass(slideForm.title2FontSize, modalPreviewViewport === 'mobile')} ${getWeightClass(slideForm.title2FontWeight)} inline-block`}
                        >
                          {slideForm.titleLine2}
                        </span>
                      </>
                    )}
                  </h2>
                  {slideForm.subtitle && (
                    <p 
                      style={{ color: slideForm.subtitleColor || '#ffffff', fontStyle: slideForm.subtitleFontStyle || 'normal' }}
                      className={`leading-relaxed max-w-xs drop-shadow-md mt-1 ${getSubtitleSizeClass(slideForm.subtitleFontSize, modalPreviewViewport === 'mobile')} ${getWeightClass(slideForm.subtitleFontWeight)}`}
                    >
                      {slideForm.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* UNIFIED FORM WITH SHADCN STYLING */}
            <div className="space-y-5">

              {/* 1. TITLE LINE 1 */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-primary-600" /> Title Line 1 *
                  </Label>
                  <span className="text-[10px] text-gray-400 font-mono">{(slideForm.titleLine1 || '').length}/30</span>
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
                    <Button type="button" size="sm"
                      variant={slideForm.title1FontStyle === 'italic' ? 'default' : 'outline'}
                      onClick={() => setSlideForm(p => ({ ...p, title1FontStyle: p.title1FontStyle === 'italic' ? 'normal' : 'italic' }))}
                      className="w-full gap-1 text-xs italic"
                    >
                      <Italic className="w-3 h-3" /> Italic
                    </Button>
                  </div>
                </div>
              </div>

              {/* 2. TITLE LINE 2 (HIGHLIGHT) */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary-600" /> Title Line 2 (Colored Highlight)
                  </Label>
                  <span className="text-[10px] text-gray-400 font-mono">{(slideForm.titleLine2 || '').length}/30</span>
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
                    <Button type="button" size="sm"
                      variant={slideForm.title2FontStyle === 'italic' ? 'default' : 'outline'}
                      onClick={() => setSlideForm(p => ({ ...p, title2FontStyle: p.title2FontStyle === 'italic' ? 'normal' : 'italic' }))}
                      className="w-full gap-1 text-xs italic"
                    >
                      <Italic className="w-3 h-3" /> Italic
                    </Button>
                  </div>
                </div>
              </div>

              {/* 3. SUBTITLE / DESCRIPTION */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Subtitle / Description
                  </Label>
                  <span className="text-[10px] text-gray-400 font-mono">{(slideForm.subtitle || '').length}/150</span>
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
                    <Button type="button" size="sm"
                      variant={slideForm.subtitleFontStyle === 'italic' ? 'default' : 'outline'}
                      onClick={() => setSlideForm(p => ({ ...p, subtitleFontStyle: p.subtitleFontStyle === 'italic' ? 'normal' : 'italic' }))}
                      className="w-full gap-1 text-xs italic"
                    >
                      <Italic className="w-3 h-3" /> Italic
                    </Button>
                  </div>
                </div>
              </div>

              {/* 4. GLOBAL FONT FAMILY, FONT STYLE & ALIGNMENT */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* 5. MEDIA TYPE & COMPACT DROPZONES */}
              <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Media Source</Label>
                  <div className="inline-flex rounded-lg bg-gray-200/60 p-0.5 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSlideForm(p => ({ ...p, mediaType: 'image' }))}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${slideForm.mediaType === 'image' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Responsive Images
                    </button>
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
                        onClick={() => videoInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${videoFile ? 'border-primary-500 bg-primary-50/10' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                        <p className="text-xs font-bold text-gray-700">{videoFile ? videoFile.name : 'Click to select Video File'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">MP4, WebM up to 20MB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* COMPACT RESPONSIVE DESKTOP & MOBILE IMAGE DROPZONES */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Desktop Image */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Desktop Image</Label>
                        <span className="text-[9px] text-gray-400">Max 5MB</span>
                      </div>
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
                        onClick={() => desktopImgInputRef.current?.click()}
                        className="border border-dashed border-gray-300 rounded-xl p-2 text-center cursor-pointer hover:border-primary-500 transition-all bg-white overflow-hidden relative group h-20 flex flex-col items-center justify-center"
                      >
                        {desktopPreview || slideForm.backgroundImage ? (
                          <div className="w-full h-full relative">
                            <img src={desktopPreview || (slideForm.backgroundImage.startsWith('http') ? slideForm.backgroundImage : `${baseUrl}${slideForm.backgroundImage}`)} alt="Desktop Preview" className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                              <Upload className="w-3.5 h-3.5 text-white mb-0.5" />
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider">Change Desktop Image</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400 mb-1" />
                            <p className="text-xs font-semibold text-gray-700 truncate">Upload Desktop Image</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Image */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Mobile Image</Label>
                        <span className="text-[9px] text-gray-400">Max 5MB</span>
                      </div>
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
                        onClick={() => mobileImgInputRef.current?.click()}
                        className="border border-dashed border-gray-300 rounded-xl p-2 text-center cursor-pointer hover:border-primary-500 transition-all bg-white overflow-hidden relative group h-20 flex flex-col items-center justify-center"
                      >
                        {mobilePreview || slideForm.mobileImage ? (
                          <div className="w-full h-full relative">
                            <img src={mobilePreview || (slideForm.mobileImage.startsWith('http') ? slideForm.mobileImage : `${baseUrl}${slideForm.mobileImage}`)} alt="Mobile Preview" className="w-full h-full object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                              <Upload className="w-3.5 h-3.5 text-white mb-0.5" />
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider">Change Mobile Image</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-gray-400 mb-1" />
                            <p className="text-xs font-semibold text-gray-700 truncate">Upload Mobile Image</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-row justify-end gap-2.5 shrink-0">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="font-semibold text-xs"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSaveSlide} 
              disabled={isSaving}
              className="font-bold gap-2 text-xs min-w-28"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Save Slide
                </>
              )}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* SHADCN DIALOG - DELETE CONFIRMATION */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm p-6 text-center rounded-2xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-100 mx-auto mb-3">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>

          <DialogTitle className="text-center text-base font-bold text-gray-900">Delete Slide?</DialogTitle>
          <DialogDescription className="text-center text-xs text-gray-500 mt-1">
            This slide will be permanently removed.
          </DialogDescription>

          {(() => {
            const s = slides.find(sl => sl._id === deleteConfirmId);
            return s ? (
              <div className="mt-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg p-2 truncate">
                "{s.titleLine1}{s.titleLine2 ? ' ' + s.titleLine2 : ''}"
              </div>
            ) : null;
          })()}

          <DialogFooter className="flex flex-row justify-center gap-2 mt-4 pt-0 border-t-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 font-semibold text-xs"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 font-bold bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs"
              onClick={handleDeleteSlide}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeroManagement;
