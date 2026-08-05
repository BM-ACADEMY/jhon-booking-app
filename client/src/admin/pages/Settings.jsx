import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Hotel, Save, Globe, Loader2, Mail, Phone,
  MapPin, Facebook, Instagram, Twitter, Linkedin, Clock, Percent,
  Edit2, X, Check, ShieldCheck, Plus, Trash2, HelpCircle
} from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

const parse24h = (timeStr) => {
  if (!timeStr) return { hour: '12', minute: '00', ampm: 'PM' };
  const parts = timeStr.split(':');
  if (parts.length < 2) return { hour: '12', minute: '00', ampm: 'PM' };
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { hour: String(h12), minute: m, ampm };
};

const convertTo24h = (hour, minute, ampm) => {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const hStr = String(h).padStart(2, '0');
  return `${hStr}:${minute}`;
};

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Original data backup for Cancel action
  const [originalData, setOriginalData] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [checkInHour, setCheckInHour] = useState('12');
  const [checkInMinute, setCheckInMinute] = useState('00');
  const [checkInAmPm, setCheckInAmPm] = useState('PM');

  const [checkOutHour, setCheckOutHour] = useState('12');
  const [checkOutMinute, setCheckOutMinute] = useState('00');
  const [checkOutAmPm, setCheckOutAmPm] = useState('AM');

  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const [cancelDurationHrs, setCancelDurationHrs] = useState(24);
  const [advancePercent1Day, setAdvancePercent1Day] = useState(100);
  const [advancePercent2Day, setAdvancePercent2Day] = useState(50);
  const [advancePercent3Day, setAdvancePercent3Day] = useState(40);
  const [advancePercent4Day, setAdvancePercent4Day] = useState(30);
  const [advancePercent5To7Days, setAdvancePercent5To7Days] = useState(25);
  const [advancePercentAbove7Days, setAdvancePercentAbove7Days] = useState(20);
  const [taxRules, setTaxRules] = useState([]);

  const populateForm = (d) => {
    setEmail(d.email || '');
    setPhone(d.phone || '');
    setAddress(d.address || '');

    const checkInParsed = parse24h(d.checkInTime);
    setCheckInHour(checkInParsed.hour);
    setCheckInMinute(checkInParsed.minute);
    setCheckInAmPm(checkInParsed.ampm);

    const checkOutParsed = parse24h(d.checkOutTime);
    setCheckOutHour(checkOutParsed.hour);
    setCheckOutMinute(checkOutParsed.minute);
    setCheckOutAmPm(checkOutParsed.ampm);

    setFacebook(d.facebook || '');
    setInstagram(d.instagram || '');
    setTwitter(d.twitter || '');
    setLinkedin(d.linkedin || '');
    setCancelDurationHrs(d.cancelDurationHrs !== undefined ? d.cancelDurationHrs : 24);
    setAdvancePercent1Day(d.advancePercent1Day !== undefined ? d.advancePercent1Day : 100);
    setAdvancePercent2Day(d.advancePercent2Day !== undefined ? d.advancePercent2Day : 50);
    setAdvancePercent3Day(d.advancePercent3Day !== undefined ? d.advancePercent3Day : 40);
    setAdvancePercent4Day(d.advancePercent4Day !== undefined ? d.advancePercent4Day : 30);
    setAdvancePercent5To7Days(d.advancePercent5To7Days !== undefined ? d.advancePercent5To7Days : 25);
    setAdvancePercentAbove7Days(d.advancePercentAbove7Days !== undefined ? d.advancePercentAbove7Days : 20);
    setTaxRules(d.taxRules ? JSON.parse(JSON.stringify(d.taxRules)) : []);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const d = res.data;
      setOriginalData(d);
      populateForm(d);
    } catch (err) {
      toast.error('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
      const checkInTime = convertTo24h(checkInHour, checkInMinute, checkInAmPm);
      const checkOutTime = convertTo24h(checkOutHour, checkOutMinute, checkOutAmPm);

      const cleanedTaxRules = taxRules.map(r => ({
        minAmount: r.minAmount === '' ? 0 : Number(r.minAmount),
        maxAmount: r.maxAmount === '' ? 0 : Number(r.maxAmount),
        taxPercent: r.taxPercent === '' ? 0 : Number(r.taxPercent)
      }));

      const payload = {
        email,
        phone,
        address,
        checkInTime,
        checkOutTime,
        facebook,
        instagram,
        twitter,
        linkedin,
        cancelDurationHrs: cancelDurationHrs === '' ? 24 : Number(cancelDurationHrs),
        advancePercent1Day: advancePercent1Day === '' ? 100 : Number(advancePercent1Day),
        advancePercent2Day: advancePercent2Day === '' ? 50 : Number(advancePercent2Day),
        advancePercent3Day: advancePercent3Day === '' ? 40 : Number(advancePercent3Day),
        advancePercent4Day: advancePercent4Day === '' ? 30 : Number(advancePercent4Day),
        advancePercent5To7Days: advancePercent5To7Days === '' ? 25 : Number(advancePercent5To7Days),
        advancePercentAbove7Days: advancePercentAbove7Days === '' ? 20 : Number(advancePercentAbove7Days),
        taxRules: cleanedTaxRules
      };

      const res = await api.put('/settings', payload);
      setOriginalData(res.data);
      populateForm(res.data);
      setIsEditing(false);
      toast.success('Configuration settings updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTaxRule = () => {
    setTaxRules(prev => [...prev, { minAmount: 0, maxAmount: 10000, taxPercent: 12 }]);
  };

  const handleRemoveTaxRule = (index) => {
    setTaxRules(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleTaxRuleChange = (index, field, value) => {
    setTaxRules(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading Settings...</p>
      </div>
    );
  }

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 pb-20">
      {/* Top Sticky Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap truncate">
              <SettingsIcon className="w-5 h-5 text-primary-600 shrink-0" />
              <span className="truncate whitespace-nowrap">Configuration Settings</span>
            </h1>
            <Badge variant="secondary" className={`whitespace-nowrap shrink-0 ${isEditing ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {isEditing ? 'Editing Mode' : 'Read-Only Mode'}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate">
            Manage contact details, social media links, advance rules, and tax slabs.
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
              Edit Settings
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

        {/* 1. Contact Details & Footer Info */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              Contact Details & Footer Info
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Official email address, phone number, and physical address shown on website footer and contact page.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Contact Email */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  Official Email Address
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. info@balifiedvilla.com"
                    className="border-gray-300 text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary-600 shrink-0" />
                    {email || 'Not provided'}
                  </div>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="border-gray-300 text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary-600 shrink-0" />
                    {phone || 'Not provided'}
                  </div>
                )}
              </div>

            </div>

            {/* Physical Address */}
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Physical Property Address
              </Label>
              {isEditing ? (
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter complete villa location address..."
                  className="w-full bg-white border border-gray-300 rounded-xl p-3 text-xs sm:text-sm text-gray-900 outline-none focus:border-primary-500 font-medium resize-none"
                />
              ) : (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 flex items-start gap-2.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <span>{address || 'Not provided'}</span>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* 3. Social Media Links */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-600" />
              Social Media & Footer Handles
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Configure official social media profile URLs linked in the website header and footer.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Instagram */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  Instagram URL
                </Label>
                {isEditing ? (
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                    className="border-gray-300 text-xs sm:text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {instagram || 'Not configured'}
                  </div>
                )}
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook URL
                </Label>
                {isEditing ? (
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="border-gray-300 text-xs sm:text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {facebook || 'Not configured'}
                  </div>
                )}
              </div>

              {/* Twitter / X */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Twitter className="w-4 h-4 text-sky-500" />
                  Twitter / X URL
                </Label>
                {isEditing ? (
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="https://x.com/yourhandle"
                    className="border-gray-300 text-xs sm:text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {twitter || 'Not configured'}
                  </div>
                )}
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Linkedin className="w-4 h-4 text-blue-700" />
                  LinkedIn URL
                </Label>
                {isEditing ? (
                  <Input
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/company/yourhandle"
                    className="border-gray-300 text-xs sm:text-sm font-medium"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 truncate">
                    {linkedin || 'Not configured'}
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 4. Advance Payment Percentage Rules */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Percent className="w-5 h-5 text-primary-600" />
              Advance Payment Percentage Rules
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Define advance payment percentages collected during Razorpay online checkout based on stay duration.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className="text-xs font-bold text-gray-700">1 Night Stay Advance (%)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={advancePercent1Day}
                    onChange={(e) => setAdvancePercent1Day(e.target.value)}
                    className="border-gray-300 font-bold text-sm bg-white"
                  />
                ) : (
                  <div className="text-lg font-black text-gray-900">{advancePercent1Day}%</div>
                )}
              </div>

              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className="text-xs font-bold text-gray-700">2 Nights Stay Advance (%)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={advancePercent2Day}
                    onChange={(e) => setAdvancePercent2Day(e.target.value)}
                    className="border-gray-300 font-bold text-sm bg-white"
                  />
                ) : (
                  <div className="text-lg font-black text-gray-900">{advancePercent2Day}%</div>
                )}
              </div>

              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className="text-xs font-bold text-gray-700">3 Nights Stay Advance (%)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={advancePercent3Day}
                    onChange={(e) => setAdvancePercent3Day(e.target.value)}
                    className="border-gray-300 font-bold text-sm bg-white"
                  />
                ) : (
                  <div className="text-lg font-black text-gray-900">{advancePercent3Day}%</div>
                )}
              </div>

              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className="text-xs font-bold text-gray-700">4 Nights Stay Advance (%)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={advancePercent4Day}
                    onChange={(e) => setAdvancePercent4Day(e.target.value)}
                    className="border-gray-300 font-bold text-sm bg-white"
                  />
                ) : (
                  <div className="text-lg font-black text-gray-900">{advancePercent4Day}%</div>
                )}
              </div>

              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className="text-xs font-bold text-gray-700">5 – 7 Nights Stay Advance (%)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={advancePercent5To7Days}
                    onChange={(e) => setAdvancePercent5To7Days(e.target.value)}
                    className="border-gray-300 font-bold text-sm bg-white"
                  />
                ) : (
                  <div className="text-lg font-black text-gray-900">{advancePercent5To7Days}%</div>
                )}
              </div>

              <div className="space-y-2 p-4 bg-gray-50/80 border border-gray-200 rounded-xl">
                <Label className="text-xs font-bold text-gray-700">8+ Nights Stay Advance (%)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={advancePercentAbove7Days}
                    onChange={(e) => setAdvancePercentAbove7Days(e.target.value)}
                    className="border-gray-300 font-bold text-sm bg-white"
                  />
                ) : (
                  <div className="text-lg font-black text-gray-900">{advancePercentAbove7Days}%</div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 5. Tax & GST Rules */}
        <Card className="border border-gray-200 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                GST & Tax Rules Slabs
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Dynamic tax percentage rules applied automatically based on daily per-room rates.
              </CardDescription>
            </div>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTaxRule}
                className="gap-1.5 text-xs font-bold border-gray-300 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add Tax Rule
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {taxRules.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                No tax rules configured. Click "Add Tax Rule" to set up GST slabs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50/60">
                      <TableHead className="py-3 px-4 font-bold text-xs">Min Amount (₹)</TableHead>
                      <TableHead className="py-3 px-4 font-bold text-xs">Max Amount (₹)</TableHead>
                      <TableHead className="py-3 px-4 font-bold text-xs">Tax Percentage (%)</TableHead>
                      {isEditing && <TableHead className="py-3 px-4 text-right w-20">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRules.map((rule, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50/50">
                        <TableCell className="py-3 px-4">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={rule.minAmount}
                              onChange={(e) => handleTaxRuleChange(idx, 'minAmount', e.target.value)}
                              className="border-gray-300 text-xs sm:text-sm font-semibold h-9"
                            />
                          ) : (
                            <span className="font-bold text-gray-900">₹{Number(rule.minAmount).toLocaleString('en-IN')}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={rule.maxAmount}
                              onChange={(e) => handleTaxRuleChange(idx, 'maxAmount', e.target.value)}
                              className="border-gray-300 text-xs sm:text-sm font-semibold h-9"
                            />
                          ) : (
                            <span className="font-bold text-gray-900">₹{Number(rule.maxAmount).toLocaleString('en-IN')}</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={rule.taxPercent}
                              onChange={(e) => handleTaxRuleChange(idx, 'taxPercent', e.target.value)}
                              className="border-gray-300 text-xs sm:text-sm font-bold h-9"
                            />
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                              {rule.taxPercent}% Tax
                            </Badge>
                          )}
                        </TableCell>
                        {isEditing && (
                          <TableCell className="py-3 px-4 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveTaxRule(idx)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </form>
    </div>
  );
};

export default Settings;
