import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck, Save, Loader2, Edit2, X, FileText
} from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { quillModules, quillFormats, QUILL_RESPONSIVE_CSS } from '../rooms/utils';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const LegalManagement = () => {
  const { type } = useParams(); // 'terms' or 'privacy'
  const isTerms = type === 'terms';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Original data backup for Cancel action
  const [originalData, setOriginalData] = useState(null);

  // Form states
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  const populateForm = (d) => {
    setTermsAndConditions(d.termsAndConditions || '');
    setPrivacyPolicy(d.privacyPolicy || '');
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const d = res.data;
      setOriginalData(d);
      populateForm(d);
      setIsEditing(false); // Reset edit mode on tab/type change
    } catch (err) {
      toast.error('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch or reset editing state when URL route parameter changes
  useEffect(() => {
    fetchSettings();
  }, [type]);

  const handleCancelEdit = () => {
    if (originalData) {
      populateForm(originalData);
    }
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = isTerms 
        ? { termsAndConditions } 
        : { privacyPolicy };

      const res = await api.put('/settings', payload);
      setOriginalData(res.data);
      populateForm(res.data);
      setIsEditing(false);
      toast.success(`${isTerms ? 'Terms & Conditions' : 'Privacy Policy'} updated successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Loading {isTerms ? 'Terms & Conditions' : 'Privacy Policy'}...
        </p>
      </div>
    );
  }

  const pageTitle = isTerms ? 'Terms & Conditions' : 'Privacy Policy';
  const pageSubtitle = isTerms 
    ? 'Manage Terms & Conditions page content for property booking.' 
    : 'Manage Privacy Policy page content and user data policies.';

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-20">
      {/* Top Sticky Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap truncate">
              {isTerms ? (
                <FileText className="w-5 h-5 text-primary-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0" />
              )}
              <span className="truncate whitespace-nowrap">{pageTitle}</span>
            </h1>
            <Badge variant="secondary" className={`whitespace-nowrap shrink-0 ${isEditing ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {isEditing ? 'Editing Mode' : 'Read-Only Mode'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {pageSubtitle}
          </p>
        </div>

        {/* Edit / Save Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {!isEditing ? (
            <Button
              type="button"
              onClick={() => setIsEditing(true)}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit Content
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
                className="gap-1.5 text-xs font-semibold border-gray-300"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              {isTerms ? (
                <FileText className="w-5 h-5 text-primary-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-primary-600 shrink-0" />
              )}
              {pageTitle} Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-6">
            <style>{QUILL_RESPONSIVE_CSS}</style>

            {isTerms ? (
              <div className="space-y-4">
                <Label className="text-xs font-bold text-gray-700">
                  Terms & Conditions Content
                </Label>
                {isEditing ? (
                  <div className="quill-responsive-container overflow-hidden shadow-sm">
                    <ReactQuill
                      theme="snow"
                      value={termsAndConditions}
                      onChange={setTermsAndConditions}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                ) : (
                  <div 
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 min-h-[300px] overflow-y-auto prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: termsAndConditions || '<p class="text-gray-400 italic">No terms and conditions defined yet.</p>' }}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-xs font-bold text-gray-700">
                  Privacy Policy Content
                </Label>
                {isEditing ? (
                  <div className="quill-responsive-container overflow-hidden shadow-sm">
                    <ReactQuill
                      theme="snow"
                      value={privacyPolicy}
                      onChange={setPrivacyPolicy}
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                ) : (
                  <div 
                    className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 min-h-[300px] overflow-y-auto prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: privacyPolicy || '<p class="text-gray-400 italic">No privacy policy defined yet.</p>' }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default LegalManagement;
