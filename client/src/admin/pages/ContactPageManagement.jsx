import React, { useState, useEffect, useRef } from 'react';
import { Upload, Save, Loader2, Eye, Layout, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ContactPageManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({
    bannerTitle: '',
    bannerSubtitle: '',
    bannerImage: '',
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
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
      const res = await api.get('/page-content/contact');
      if (res.data) {
        const data = res.data;
        setContent({
          bannerTitle: data.bannerTitle || '',
          bannerSubtitle: data.bannerSubtitle || '',
          bannerImage: data.bannerImage || '',
        });
        if (data.bannerImage) {
          setBannerPreview(getFullUrl(data.bannerImage));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Contact Page settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Upload 5MB only');
        e.target.value = '';
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('bannerTitle', content.bannerTitle);
      formData.append('bannerSubtitle', content.bannerSubtitle);

      if (bannerFile) {
        formData.append('bannerImage', bannerFile);
      }

      await api.put('/page-content/contact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Contact Page updated successfully!');
      setBannerFile(null);
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
            <Layout className="w-6 h-6 text-primary-600" /> Contact Page Content
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Configure and customize your website's Contact Us page banner elements.</p>
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
                  placeholder="e.g. Contact Us"
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
                  placeholder="e.g. Have questions? We're here to help you plan your perfect stay."
                  rows={2}
                  className="bg-white font-medium text-gray-900"
                />
              </div>

              {/* Compact Banner Image Upload Dropzone */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-700">Hero Banner Image</Label>
                  <span className="text-[10px] text-gray-400">Max 5MB (16:9 recommended)</span>
                </div>
                <input
                  type="file"
                  ref={bannerInputRef}
                  onChange={handleBannerChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => bannerInputRef.current?.click()}
                  className="border border-dashed border-gray-300 rounded-xl p-2 text-center cursor-pointer hover:border-primary-500 transition-all bg-white overflow-hidden relative group h-24 flex flex-col items-center justify-center"
                >
                  {bannerPreview ? (
                    <div className="w-full h-full relative">
                      <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <Upload className="w-4 h-4 text-white mb-0.5" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Change Banner Image</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs font-semibold text-gray-700">Click to upload Banner Image</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="min-w-[150px] font-bold gap-2 text-xs sm:text-sm">
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
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                )}
                <div className="absolute inset-0 bg-black/35" />
                <div className="relative z-10 text-center">
                  <span className="text-[#d9f969] font-bold tracking-widest uppercase text-[8px] block mb-1">Get in Touch</span>
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

export default ContactPageManagement;
