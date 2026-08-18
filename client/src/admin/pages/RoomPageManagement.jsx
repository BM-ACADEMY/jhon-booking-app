import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Loader2, Trash2, Eye, Layout, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const RoomPageManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({
    bannerTitle: '',
    bannerSubtitle: '',
    bannerImage: '',
  });

  const [existingBannerImages, setExistingBannerImages] = useState([]);
  const [newBannerFiles, setNewBannerFiles] = useState([]);
  const [newBannerPreviews, setNewBannerPreviews] = useState([]);
  const bannerInputRef = useRef(null);

  const baseUrl = import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL !== 'undefined' ? import.meta.env.VITE_BASE_URL : '';

  const getFullUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    return `${baseUrl}${src}`;
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.get('/page-content/rooms');
      if (res.data) {
        const data = res.data;
        setContent({
          bannerTitle: data.bannerTitle || '',
          bannerSubtitle: data.bannerSubtitle || '',
          bannerImage: data.bannerImage || '',
        });
        if (data.bannerImages && data.bannerImages.length > 0) {
          setExistingBannerImages(data.bannerImages.map(img => getFullUrl(img)));
        } else if (data.bannerImage) {
          setExistingBannerImages([getFullUrl(data.bannerImage)]);
        } else {
          setExistingBannerImages([]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Room Page settings');
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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('bannerTitle', content.bannerTitle);
      formData.append('bannerSubtitle', content.bannerSubtitle);

      const relativeExisting = existingBannerImages.map(url => url.replace(baseUrl, ''));
      formData.append('existingBannerImages', JSON.stringify(relativeExisting));

      newBannerFiles.forEach((file) => {
        formData.append('bannerImages', file);
      });

      await api.put('/page-content/rooms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Room Page updated successfully!');
      setNewBannerFiles([]);
      setNewBannerPreviews([]);
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
            <Layout className="w-6 h-6 text-primary-600" /> Room Page Content
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Configure and customize your website's Room page banner elements.</p>
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
                  placeholder="e.g. Our Rooms"
                  className="bg-white font-medium text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerSubtitle" className="text-xs font-bold">Banner Subtitle</Label>
                <Textarea
                  id="bannerSubtitle"
                  value={content.bannerSubtitle}
                  onChange={(e) => setContent({ ...content, bannerSubtitle: e.target.value })}
                  placeholder="e.g. Find the perfect room for your stay."
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
        </div>

        {/* Live Preview Sidebar */}
        <div className="space-y-6">
          <Card className="border-gray-200/80 shadow-sm sticky top-6">
            <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-4">
              <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="w-full aspect-video rounded-xl bg-slate-950 overflow-hidden relative flex flex-col justify-center items-center p-4 border border-slate-800 shadow-sm">
                {existingBannerImages.length > 0 || newBannerPreviews.length > 0 ? (
                  <img src={existingBannerImages[0] || newBannerPreviews[0]} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-black/35" />
                <div className="relative z-10 text-center">
                  <span className="text-[#d9f969] font-bold tracking-widest uppercase text-[8px] block mb-1">Our Accommodations</span>
                  <h2 className="text-white text-base sm:text-lg font-bold font-serif leading-tight">{content.bannerTitle || 'Banner Title'}</h2>
                  <p className="text-gray-200 text-[10px] font-light mt-1.5 max-w-[200px] mx-auto line-clamp-2">{content.bannerSubtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default RoomPageManagement;
