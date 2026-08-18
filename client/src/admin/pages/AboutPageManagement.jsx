import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Loader2, Trash2, Eye, Layout, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const AboutPageManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({
    bannerTitle: '',
    bannerSubtitle: '',
    bannerImage: '',
    storyTitle: '',
    storyContent: ['', '', ''],
    storyImages: ['', '', '', ''],
  });

  // Local file refs & previews
  const [existingBannerImages, setExistingBannerImages] = useState([]);
  const [newBannerFiles, setNewBannerFiles] = useState([]);
  const [newBannerPreviews, setNewBannerPreviews] = useState([]);
  
  const [storyFiles, setStoryFiles] = useState([null, null, null, null]);
  const [storyPreviews, setStoryPreviews] = useState(['', '', '', '']);

  const bannerInputRef = useRef(null);
  const storyInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const baseUrl = import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL !== 'undefined' ? import.meta.env.VITE_BASE_URL : '';

  const getFullUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    return `${baseUrl}${src}`;
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/page-content/about');
      if (res.data) {
        const data = res.data;
        setContent({
          bannerTitle: data.bannerTitle || '',
          bannerSubtitle: data.bannerSubtitle || '',
          bannerImage: data.bannerImage || '',
          storyTitle: data.storyTitle || '',
          storyContent: data.storyContent && data.storyContent.length > 0 ? data.storyContent : ['', '', ''],
          storyImages: data.storyImages && data.storyImages.length === 4 ? data.storyImages : ['', '', '', ''],
        });
        
        
        if (data.bannerImages && data.bannerImages.length > 0) {
          setExistingBannerImages(data.bannerImages.map(img => getFullUrl(img)));
        } else if (data.bannerImage) {
          setExistingBannerImages([getFullUrl(data.bannerImage)]);
        } else {
          setExistingBannerImages([]);
        }
        if (data.storyImages) {
          setStoryPreviews(data.storyImages.map(img => getFullUrl(img)));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load About Page settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleBannerChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const currentTotal = existingBannerImages.length + newBannerFiles.length;
    if (currentTotal + files.length > 3) {
      toast.error('You can only upload a maximum of 3 banner images.');
      e.target.value = '';
      return;
    }

    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    setNewBannerFiles(prev => [...prev, ...validFiles]);
    const previews = validFiles.map(f => URL.createObjectURL(f));
    setNewBannerPreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeExistingBannerImage = (index) => {
    const updated = [...existingBannerImages];
    updated.splice(index, 1);
    setExistingBannerImages(updated);
  };

  const removeNewBannerImage = (index) => {
    const updatedFiles = [...newBannerFiles];
    updatedFiles.splice(index, 1);
    setNewBannerFiles(updatedFiles);

    const updatedPreviews = [...newBannerPreviews];
    updatedPreviews.splice(index, 1);
    setNewBannerPreviews(updatedPreviews);
  };

  const handleStoryImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Upload 5MB only');
        e.target.value = '';
        return;
      }
      const updatedFiles = [...storyFiles];
      updatedFiles[index] = file;
      setStoryFiles(updatedFiles);

      const updatedPreviews = [...storyPreviews];
      updatedPreviews[index] = URL.createObjectURL(file);
      setStoryPreviews(updatedPreviews);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('bannerTitle', content.bannerTitle);
      formData.append('bannerSubtitle', content.bannerSubtitle);
      formData.append('storyTitle', content.storyTitle);
      formData.append('storyContent', JSON.stringify(content.storyContent));

      const relativeExisting = existingBannerImages.map(url => url.replace(baseUrl, ''));
      formData.append('existingBannerImages', JSON.stringify(relativeExisting));

      newBannerFiles.forEach((file) => {
        formData.append('bannerImages', file);
      });

      storyFiles.forEach((file, index) => {
        if (file) {
          formData.append(`storyImage${index}`, file);
        }
      });

      await api.put('/page-content/about', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('About Page updated successfully!');
      setNewBannerFiles([]);
      setNewBannerPreviews([]);
      setStoryFiles([null, null, null, null]);
      fetchContent();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary-600" /> About Page Content
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Configure and customize your website's About Us page elements.</p>
        </div>
        <div className="flex shrink-0">
          <Button onClick={handleSave} disabled={saving} className="min-w-[150px] font-bold gap-2 text-xs sm:text-sm">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Content
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Editor panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner Section Card */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-4 sm:p-5">
              <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" /> Hero Banner Section
              </CardTitle>
              <CardDescription className="text-xs">Configure the main title, description, and background banner image.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bannerTitle" className="text-xs font-bold">Banner Title</Label>
                <Input
                  id="bannerTitle"
                  value={content.bannerTitle}
                  onChange={(e) => setContent({ ...content, bannerTitle: e.target.value })}
                  placeholder="e.g. About Us"
                  required
                  className="bg-white font-medium text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerSubtitle" className="text-xs font-bold">Banner Subtitle</Label>
                <Textarea
                  id="bannerSubtitle"
                  value={content.bannerSubtitle}
                  onChange={(e) => setContent({ ...content, bannerSubtitle: e.target.value })}
                  placeholder="e.g. Discover our story and standard of hospitality"
                  rows={2}
                  className="bg-white font-medium text-gray-900"
                />
              </div>

              {/* Dynamic Banner Images Gallery */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-700">Hero Banner Slides</Label>
                  <span className="text-[10px] text-gray-400">Max 5MB per image (16:9 recommended)</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Existing Images */}
                  {existingBannerImages.map((src, idx) => (
                    <div key={`existing-${idx}`} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-video">
                      <img src={src} alt="Slide" className="w-full h-full object-cover" style={{ imageOrientation: 'from-image' }} />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="w-8 h-8 rounded-full"
                          onClick={() => removeExistingBannerImage(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* New Previews */}
                  {newBannerPreviews.map((src, idx) => (
                    <div key={`new-${idx}`} className="relative group rounded-lg overflow-hidden border border-green-500 aspect-video">
                      <img src={src} alt="New Slide" className="w-full h-full object-cover" style={{ imageOrientation: 'from-image' }} />
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">New</div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="w-8 h-8 rounded-full"
                          onClick={() => removeNewBannerImage(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>
                <div className="flex justify-start mt-4">
                  <Button type="button" variant="outline" className="border-primary-200 text-primary-700 hover:bg-primary-50" onClick={() => bannerInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Add Slide
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Story Section Card */}
          <Card className="border-gray-200/80 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-4 sm:p-5">
              <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" /> Our Story Section
              </CardTitle>
              <CardDescription className="text-xs">Edit the story title, content paragraphs, and grid images.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="storyTitle" className="text-xs font-bold">Section Title</Label>
                <Input
                  id="storyTitle"
                  value={content.storyTitle}
                  onChange={(e) => setContent({ ...content, storyTitle: e.target.value })}
                  placeholder="e.g. A New Standard of Hospitality"
                  required
                  className="bg-white font-medium text-gray-900"
                />
              </div>

              {content.storyContent.map((para, index) => (
                <div key={index} className="space-y-1.5">
                  <Label htmlFor={`para-${index}`} className="text-xs font-bold text-gray-700">Paragraph {index + 1}</Label>
                  <Textarea
                    id={`para-${index}`}
                    value={para}
                    onChange={(e) => {
                      const updated = [...content.storyContent];
                      updated[index] = e.target.value;
                      setContent({ ...content, storyContent: updated });
                    }}
                    placeholder={`Paragraph ${index + 1} details...`}
                    rows={2}
                    required
                    className="bg-white font-medium text-gray-900 text-xs sm:text-sm"
                  />
                </div>
              ))}

              {/* Story Images Compact Grid Upload */}
              <div className="space-y-2.5">
                <Label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Story Image Grid (4 Images)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="space-y-1 border border-gray-200/80 p-2 rounded-xl bg-gray-50/50">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Image {idx + 1}</span>
                      <input
                        type="file"
                        ref={storyInputRefs[idx]}
                        onChange={(e) => handleStoryImageChange(idx, e)}
                        accept="image/*"
                        className="hidden"
                      />
                      <div 
                        onClick={() => storyInputRefs[idx].current?.click()}
                        className="h-20 border border-dashed border-gray-300 rounded-lg flex flex-col justify-center items-center cursor-pointer hover:border-primary-500 transition-all bg-white overflow-hidden relative group"
                      >
                        {storyPreviews[idx] ? (
                          <div className="w-full h-full relative">
                            <img src={storyPreviews[idx]} alt={`Story ${idx + 1}`} className="w-full h-full object-cover rounded-md" />
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 rounded-md">
                              <Upload className="w-3.5 h-3.5 text-white mb-0.5" />
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider">Change</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-gray-400 mb-1" />
                            <span className="text-[10px] text-gray-600 font-semibold">Upload #{idx + 1}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Sidebar */}
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-sm sticky top-6">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-4">
              <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Preview Hero Banner */}
              <div className="w-full aspect-video rounded-xl bg-slate-950 overflow-hidden relative flex flex-col justify-center items-center p-4 border border-slate-800 shadow-sm">
                {existingBannerImages.length > 0 || newBannerPreviews.length > 0 ? (
                  <img src={existingBannerImages[0] || newBannerPreviews[0]} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 text-center">
                  <h2 className="text-white text-base sm:text-lg font-bold font-serif leading-tight">{content.bannerTitle || 'Banner Title'}</h2>
                  <p className="text-gray-200 text-[10px] font-light mt-1 max-w-[200px] mx-auto truncate">{content.bannerSubtitle}</p>
                </div>
              </div>

              {/* Preview Story details */}
              <div className="space-y-2.5 border-t border-gray-100 pt-4">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Our Story</span>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-gray-900">{content.storyTitle || 'Story Title'}</h4>
                <p className="text-[11px] text-gray-500 line-clamp-3 leading-relaxed font-light">
                  {content.storyContent[0]}
                </p>
                
                {/* Images grid mini preview */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200/60">
                      {storyPreviews[idx] && (
                        <img src={storyPreviews[idx]} alt="Grid thumb" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default AboutPageManagement;
