import {
  Star, Shield, Wifi, Car, Utensils, Coffee, Tv, Wind, Waves,
  Sparkles, Key, Zap, Heart, Check, Info, Home, MapPin
} from 'lucide-react';

export const SERVER_URL = import.meta.env.VITE_BASE_URL;

/** Prefix relative uploads with the server url (same rule as the old page). */
export const imageSrc = (img) => {
  const u = typeof img === 'string' ? img : img?.url;
  if (!u) return '';
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

export const parseGoogleMapLink = (link) => {
  if (!link) return '';
  const trimmed = link.trim();
  const iframeMatch = trimmed.match(/src="([^"]+)"/);
  if (iframeMatch) return iframeMatch[1];
  if (trimmed.includes('/maps/embed') || trimmed.includes('output=embed')) return trimmed;
  const placeMatch = trimmed.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  try {
    const urlObj = new URL(trimmed);
    const q = urlObj.searchParams.get('q');
    if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  } catch (_) { /* not a parseable url */ }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};

export const DEFAULT_ROOM_FORM = {
  name: '',
  category: '',
  propertyType: 'Entire Villa',
  description: '',
  price: '',
  originalPrice: '',
  priceUnit: 'night',
  guests: 2,
  maxAdults: 2,
  maxChildren: 0,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  showers: 0,
  size: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  mapLink: '',
  amenities: [], // [{ name, icon }]
  highlights: [], // [{ icon, text, subtext }]
  images: [], // [{ url, label }]
  isAvailable: true,
  datePrices: [],
  blockedDates: []
};

export const ICON_LIST = [
  { name: 'Star', icon: Star },
  { name: 'Shield', icon: Shield },
  { name: 'Wifi', icon: Wifi },
  { name: 'Car', icon: Car },
  { name: 'Utensils', icon: Utensils },
  { name: 'Coffee', icon: Coffee },
  { name: 'Tv', icon: Tv },
  { name: 'Wind', icon: Wind },
  { name: 'Waves', icon: Waves },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Key', icon: Key },
  { name: 'Zap', icon: Zap },
  { name: 'Heart', icon: Heart },
  { name: 'Check', icon: Check },
  { name: 'Info', icon: Info },
  { name: 'Home', icon: Home },
  { name: 'MapPin', icon: MapPin },
];

export const getIconComp = (name, fallback = Star) =>
  ICON_LIST.find((ic) => ic.name === name)?.icon || fallback;

export const DEFAULT_CAT_FORM = { name: '', description: '', color: 'bg-gray-100 text-gray-700' };

export const CATEGORY_COLORS = [
  'bg-gray-100 text-gray-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-yellow-100 text-yellow-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

/** Build the multipart payload sent to POST /rooms and PUT /rooms/:id. */
export const buildFormData = (roomForm, roomImages, status) => {
  const formData = new FormData();
  Object.keys(roomForm).forEach((key) => {
    if (['amenities', 'highlights', 'datePrices', 'blockedDates'].includes(key)) {
      formData.append(key, JSON.stringify(roomForm[key] || []));
    } else if (key === 'images') {
      formData.append('existingImages', JSON.stringify(roomForm[key] || []));
    } else {
      formData.append(key, roomForm[key]);
    }
  });
  formData.append('status', status);
  const newLabels = (roomImages || []).map((img) => img.label || '');
  formData.append('newImageLabels', JSON.stringify(newLabels));
  (roomImages || []).forEach((img) => formData.append('images', img.file));
  return formData;
};

/** Compare a DB date value (ISO string / Date / date-only string) to a `YYYY-MM-DD` string. */
export const matchDate = (dbDate, targetDateStr) => {
  if (!dbDate) return false;
  let dbDateStr = '';
  if (typeof dbDate === 'string') {
    if (dbDate.includes('T')) {
      const d = new Date(dbDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dbDateStr = `${yyyy}-${mm}-${dd}`;
    } else {
      dbDateStr = dbDate.substring(0, 10);
    }
  } else if (dbDate instanceof Date) {
    const yyyy = dbDate.getFullYear();
    const mm = String(dbDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dbDate.getDate()).padStart(2, '0');
    dbDateStr = `${yyyy}-${mm}-${dd}`;
  } else {
    const d = new Date(dbDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dbDateStr = `${yyyy}-${mm}-${dd}`;
  }
  return dbDateStr === targetDateStr;
};

export const formatCompactPrice = (price) => {
  const p = Number(price) || 0;
  if (p >= 10000000) return `${(p / 10000000).toFixed(p % 10000000 === 0 ? 0 : 1)}Cr`;
  if (p >= 100000) return `${(p / 100000).toFixed(p % 100000 === 0 ? 0 : 1)}L`;
  if (p >= 1000) return `${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}K`;
  return p.toString();
};

/** Custom price for a `YYYY-MM-DD` date, falling back to the base price. */
export const getDatePrice = (form, dateStr) => {
  const found = form?.datePrices?.find((dp) => matchDate(dp.date, dateStr));
  return found ? found.price : form?.price || 0;
};

export const hasCustomPrice = (form, dateStr) =>
  !!form?.datePrices?.some((dp) => matchDate(dp.date, dateStr));

/** Reason string if the `YYYY-MM-DD` date falls inside a blocked range, otherwise null. */
export const getBlockedReason = (blockedDates, dateStr) => {
  if (!blockedDates || !Array.isArray(blockedDates)) return null;
  const targetTime = new Date(dateStr + 'T00:00:00').getTime();
  const found = blockedDates.find((block) => {
    const start = new Date(block.startDate);
    const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const end = new Date(block.endDate);
    const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return targetTime >= startTime && targetTime <= endTime;
  });
  return found ? (found.reason || 'Blocked') : null;
};

/** Local-time `YYYY-MM-DD` for a Date (never use toISOString here — it shifts by TZ). */
export const toDateStr = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const fromDateStr = (str) => (str ? new Date(`${str}T00:00:00`) : null);

/** Map a room document (or draft) onto the flat form shape. */
export const roomToForm = (r, fallbackCategory = '') => ({
  name: r?.name || '',
  category: r?.category || fallbackCategory,
  propertyType: r?.propertyType || 'Entire Villa',
  description: r?.description || '',
  price: r?.price ?? '',
  originalPrice: r?.originalPrice || '',
  priceUnit: r?.priceUnit || 'night',
  guests: r?.guests || r?.capacity || 2,
  maxAdults: r?.maxAdults || 2,
  maxChildren: r?.maxChildren || 0,
  bedrooms: r?.bedrooms || 1,
  beds: r?.beds || 1,
  bathrooms: r?.bathrooms || 1,
  showers: r?.showers || 0,
  size: r?.size || '',
  address: r?.address || '',
  city: r?.city || '',
  state: r?.state || '',
  country: r?.country || 'India',
  mapLink: r?.mapLink || '',
  amenities: r?.amenities || [],
  highlights: r?.highlights || [],
  images: r?.images || [],
  isAvailable: r?.isAvailable ?? true,
  datePrices: r?.datePrices || [],
  blockedDates: r?.blockedDates || []
});

export const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image'],
    ['clean']
  ],
};

export const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image'
];

export const QUILL_RESPONSIVE_CSS = `
  .quill-responsive-container .ql-container {
    min-height: 200px;
    max-height: 400px;
    overflow-y: auto;
    font-family: inherit;
    font-size: 14px;
  }
  .quill-responsive-container .ql-editor {
    min-height: 200px;
  }
  @media (max-width: 640px) {
    .quill-responsive-container .ql-toolbar {
      display: flex;
      flex-wrap: wrap;
    }
  }
`;
