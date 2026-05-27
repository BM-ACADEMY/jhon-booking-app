import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, BedDouble, Star, ChevronLeft, ChevronRight, 
  Loader2, Folder, Tag, X, MapPin, Users, Home, Info, Image as ImageIcon, 
  Calendar, Check, Shield, Wifi, Car, Utensils, Coffee, Tv, Wind, Waves,
  Sparkles, Key, Zap, Heart
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../../api';
const SERVER_URL = import.meta.env.VITE_BASE_URL;

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PAGE_SIZE = 6;
const DEFAULT_ROOM_FORM = { 
  name: '', 
  category: '', 
  propertyType: '',
  description: '', 
  price: '', 
  originalPrice: '',
  priceUnit: 'night',
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  address: '',
  city: '',
  state: '',
  country: 'India',
  amenities: [], // [{ name, icon }]
  highlights: [], // [{ icon, text, subtext }]
  images: [], // [{ url, label }]
  isAvailable: true 
};

const ICON_LIST = [
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
const DEFAULT_CAT_FORM = { name: '', description: '', color: 'bg-gray-100 text-gray-700' };

const CATEGORY_COLORS = [
  'bg-gray-100 text-gray-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-yellow-100 text-yellow-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [priceUnits, setPriceUnits] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  
  const [newPropType, setNewPropType] = useState('');
  const [showPropTypeInput, setShowPropTypeInput] = useState(false);
  const [newPriceUnit, setNewPriceUnit] = useState({ name: '', label: '' });
  const [showPriceUnitInput, setShowPriceUnitInput] = useState(false);
  
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editRoomTarget, setEditRoomTarget] = useState(null);
  const [roomForm, setRoomForm] = useState(DEFAULT_ROOM_FORM);
  const [roomImages, setRoomImages] = useState([]); // File objects
  const [submittingRoom, setSubmittingRoom] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftId, setDraftId] = useState(null); // tracks in-progress draft _id
  const [draftPrompt, setDraftPrompt] = useState(null); // fetched draft to resume
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [viewRoomTarget, setViewRoomTarget] = useState(null);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editCatTarget, setEditCatTarget] = useState(null);
  const [catForm, setCatForm] = useState(DEFAULT_CAT_FORM);
  const [submittingCat, setSubmittingCat] = useState(false);
  const [deleteCatTarget, setDeleteCatTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // general, specs, features, location, photos
  const [activeMainTab, setActiveMainTab] = useState('rooms'); // rooms, settings

  const fetchData = async () => {
    try {
      setLoadingRooms(true);
      setLoadingCats(true);
      const [roomsRes, catsRes, typesRes, unitsRes] = await Promise.all([
        api.get('/rooms/admin/all'),
        api.get('/categories'),
        api.get('/property-types'),
        api.get('/price-units')
      ]);
      setRooms(roomsRes.data);
      setCategories(catsRes.data);
      setPropertyTypes(typesRes.data);
      setPriceUnits(unitsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoadingRooms(false);
      setLoadingCats(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [activeCategory, search]);

  const handleAddPropType = async () => {
    if (!newPropType.trim()) return;
    try {
      const res = await api.post('/property-types', { name: newPropType });
      setPropertyTypes(p => [...p, res.data]);
      setRoomForm(p => ({ ...p, propertyType: res.data.name }));
      setNewPropType('');
      setShowPropTypeInput(false);
      toast.success('Property type added');
    } catch (err) {
      toast.error('Error adding property type');
    }
  };
  const handleAddPriceUnit = async () => {
    if (!newPriceUnit.name.trim() || !newPriceUnit.label.trim()) return;
    try {
      const res = await api.post('/price-units', newPriceUnit);
      setPriceUnits(p => [...p, res.data]);
      setRoomForm(p => ({ ...p, priceUnit: res.data.name }));
      setNewPriceUnit({ name: '', label: '' });
      setShowPriceUnitInput(false);
      toast.success('Price unit added');
    } catch (err) {
      toast.error('Error adding price unit');
    }
  };

  const [editTypeTarget, setEditTypeTarget] = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [typeName, setTypeName] = useState('');

  const [editUnitTarget, setEditUnitTarget] = useState(null);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: '', label: '' });

  const handleSaveType = async () => {
    if (!typeName.trim()) return;
    try {
      if (editTypeTarget) {
        await api.put(`/property-types/${editTypeTarget._id}`, { name: typeName });
        toast.success('Property type updated');
      } else {
        const res = await api.post('/property-types', { name: typeName });
        setPropertyTypes(p => [...p, res.data]);
        toast.success('Property type added');
      }
      setShowTypeModal(false);
      fetchData();
    } catch (err) {
      toast.error('Error saving property type');
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm('Delete this property type?')) return;
    try {
      await api.delete(`/property-types/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name.trim() || !unitForm.label.trim()) return;
    try {
      if (editUnitTarget) {
        await api.put(`/price-units/${editUnitTarget._id}`, unitForm);
        toast.success('Price unit updated');
      } else {
        const res = await api.post('/price-units', unitForm);
        setPriceUnits(p => [...p, res.data]);
        toast.success('Price unit added');
      }
      setShowUnitModal(false);
      fetchData();
    } catch (err) {
      toast.error('Error saving price unit');
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm('Delete this price unit?')) return;
    try {
      await api.delete(`/price-units/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  // --- Category Handlers ---
  const openCatCreate = () => { setEditCatTarget(null); setCatForm(DEFAULT_CAT_FORM); setShowCatModal(true); };
  const openCatEdit = (c) => { setEditCatTarget(c); setCatForm({ name: c.name, description: c.description || '', color: c.color }); setShowCatModal(true); };
  
  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return toast.error('Category name is required');
    try {
      setSubmittingCat(true);
      if (editCatTarget) await api.put(`/categories/${editCatTarget._id}`, catForm);
      else await api.post('/categories', catForm);
      toast.success('Category saved!');
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCat = async () => {
    try {
      await api.delete(`/categories/${deleteCatTarget._id}`);
      toast.success('Category deleted');
      setDeleteCatTarget(null);
      if (activeCategory === deleteCatTarget.name) setActiveCategory('All');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // --- Room Handlers ---
  const openRoomCreate = async () => {
    setEditRoomTarget(null);
    setRoomImages([]);
    setDraftId(null);
    // Check for an existing draft to resume
    try {
      const res = await api.get('/rooms/admin/draft');
      if (res.data?._id) {
        setDraftPrompt(res.data);
        return; // show resume prompt instead of opening modal
      }
    } catch (_) { /* no draft found */ }
    setRoomForm({ ...DEFAULT_ROOM_FORM, category: categories[0]?.name || '', propertyType: propertyTypes[0]?.name || '' });
    setActiveTab('general');
    setShowRoomModal(true);
  };

  const resumeDraft = (draft) => {
    setDraftPrompt(null);
    setDraftId(draft._id);
    setEditRoomTarget(null); // treat as new (not edit mode) but with a draft id
    setRoomForm({
      name: draft.name || '',
      category: draft.category || categories[0]?.name || '',
      propertyType: draft.propertyType || propertyTypes[0]?.name || '',
      description: draft.description || '',
      price: draft.price || '',
      originalPrice: draft.originalPrice || '',
      priceUnit: draft.priceUnit || 'night',
      guests: draft.guests || 2,
      bedrooms: draft.bedrooms || 1,
      beds: draft.beds || 1,
      bathrooms: draft.bathrooms || 1,
      address: draft.address || '',
      city: draft.city || '',
      state: draft.state || '',
      country: draft.country || 'India',
      amenities: draft.amenities || [],
      highlights: draft.highlights || [],
      images: draft.images || [],
      isAvailable: draft.isAvailable ?? true,
    });
    setRoomImages([]);
    setActiveTab('general');
    setShowRoomModal(true);
  };

  const discardDraftAndCreate = () => {
    setDraftPrompt(null);
    setDraftId(null);
    setRoomForm({ ...DEFAULT_ROOM_FORM, category: categories[0]?.name || '', propertyType: propertyTypes[0]?.name || '' });
    setActiveTab('general');
    setShowRoomModal(true);
  };

  const openRoomEdit = (r) => {
    setEditRoomTarget(r);
    setDraftId(r.status === 'draft' ? r._id : null);
    setRoomForm({
      name: r.name,
      category: r.category,
      propertyType: r.propertyType || 'Entire Villa',
      description: r.description,
      price: r.price,
      originalPrice: r.originalPrice || '',
      priceUnit: r.priceUnit || 'night',
      guests: r.guests || r.capacity || 2,
      bedrooms: r.bedrooms || 1,
      beds: r.beds || 1,
      bathrooms: r.bathrooms || 1,
      address: r.address || '',
      city: r.city || '',
      state: r.state || '',
      country: r.country || 'India',
      amenities: r.amenities || [],
      highlights: r.highlights || [],
      images: r.images || [],
      isAvailable: r.isAvailable
    });
    setRoomImages([]);
    setActiveTab('general');
    setShowRoomModal(true);
  };

  const buildFormData = (status) => {
    const formData = new FormData();
    Object.keys(roomForm).forEach(key => {
      if (['amenities', 'highlights'].includes(key)) {
        formData.append(key, JSON.stringify(roomForm[key]));
      } else if (key === 'images') {
        formData.append('existingImages', JSON.stringify(roomForm[key]));
      } else {
        formData.append(key, roomForm[key]);
      }
    });
    formData.append('status', status);
    const newLabels = roomImages.map(img => img.label || '');
    formData.append('newImageLabels', JSON.stringify(newLabels));
    roomImages.forEach(img => formData.append('images', img.file));
    return formData;
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const formData = buildFormData('draft');
      let res;
      if (draftId) {
        res = await api.put(`/rooms/${draftId}`, formData);
      } else if (editRoomTarget) {
        res = await api.put(`/rooms/${editRoomTarget._id}`, formData);
      } else {
        // Need at least a name to create a draft
        if (!roomForm.name.trim()) { toast.error('Add a property name to save draft'); return; }
        // Provide required field defaults for draft
        if (!roomForm.category) formData.set('category', categories[0]?.name || 'Uncategorised');
        if (!roomForm.price) formData.set('price', '0');
        if (!roomForm.description) formData.set('description', 'Draft');
        res = await api.post('/rooms', formData);
        setDraftId(res.data._id);
      }
      toast.success('Draft saved ✓');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!roomForm.name.trim() || !roomForm.category || !roomForm.price) return toast.error('Please fill required fields (name, category, price)');
    try {
      setSubmittingRoom(true);
      const formData = buildFormData('published');
      if (draftId) {
        await api.put(`/rooms/${draftId}`, formData);
      } else if (editRoomTarget) {
        await api.put(`/rooms/${editRoomTarget._id}`, formData);
      } else {
        await api.post('/rooms', formData);
      }
      setDraftId(null);
      toast.success(editRoomTarget ? 'Room updated!' : 'Property published!');
      setShowRoomModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving room');
    } finally {
      setSubmittingRoom(false);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await api.delete(`/rooms/${deleteRoomTarget._id}`);
      toast.success('Room deleted');
      setDeleteRoomTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  // --- Filtering & Pagination ---
  const filteredRooms = rooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || r.category === activeCategory;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filteredRooms.length / PAGE_SIZE);
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page); };

  const getCatColor = (catName) => {
const cat = categories.find(c => c.name === catName);
    return cat ? cat.color : 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Property Management</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Control your listings and configurations</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveMainTab('rooms')} 
             className={`cursor-pointer px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeMainTab === 'rooms' ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
           >
             Rooms
           </button>
           <button 
             onClick={() => setActiveMainTab('settings')} 
             className={`cursor-pointer px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeMainTab === 'settings' ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
           >
             Settings
           </button>
          </div>
        </div>

      {activeMainTab === 'rooms' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar: Categories */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <h2 className="font-black text-gray-900 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary-500" /> Categories
                </h2>
                <button onClick={openCatCreate} className="cursor-pointer p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors" title="Add Category">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-1.5">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`cursor-pointer w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === 'All' ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" /> All Properties
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeCategory === 'All' ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                    {rooms.length}
                  </span>
                </button>

                {loadingCats ? (
                  <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
                ) : (
                  <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                    {categories.map((cat) => (
                      <div key={cat._id} className="group relative flex items-center">
                        <button
                          onClick={() => setActiveCategory(cat.name)}
                          className={`cursor-pointer flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            activeCategory === cat.name ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className={`w-2 h-2 rounded-full shadow-inner ${cat.color.split(' ')[0]}`} />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeCategory === cat.name ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                            {rooms.filter(r => r.category === cat.name).length}
                          </span>
                        </button>
                        {/* Category Actions (visible on hover) */}
                        <div className="absolute right-2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 border border-gray-100 z-10">
                           <button onClick={() => openCatEdit(cat)} className="cursor-pointer p-1 text-gray-500 hover:text-primary-600 transition-colors"><Edit2 className="w-3 h-3" /></button>
                           <button onClick={() => setDeleteCatTarget(cat)} className="cursor-pointer p-1 text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content: Rooms */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-full sm:w-80 shadow-sm focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-sm text-gray-700 placeholder-gray-400 outline-none w-full bg-transparent"
                />
              </div>
              <button onClick={openRoomCreate} className="cursor-pointer flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/20">
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>

            {/* Header & Meta */}
            <div className="flex items-center justify-between text-xs text-gray-500">
               <h1 className="text-xl font-black text-gray-900">{activeCategory === 'All' ? 'All Rooms' : `${activeCategory} Rooms`}</h1>
               <span>Showing <span className="font-bold text-gray-700">{filteredRooms.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filteredRooms.length)}</span> of <span className="font-bold text-gray-700">{filteredRooms.length}</span></span>
            </div>

        {/* Grid */}
        {loadingRooms ? (
           <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
        ) : filteredRooms.length === 0 ? (
           <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl">
             <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
             <p className="font-bold text-gray-500">No rooms found</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginatedRooms.map((room) => (
              <div key={room._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all overflow-hidden flex flex-col group">
                <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {room.images?.[0] ? (
                    <img src={(() => { const u = room.images[0]?.url || room.images[0]; return typeof u === 'string' && u.startsWith('http') ? u : `${SERVER_URL}${u}`; })()} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <BedDouble className="w-12 h-12 text-gray-300" />
                  )}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md bg-white/90 border border-white/20 ${getCatColor(room.category)}`}>
                      {room.category}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md border border-white/20 ${room.isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                      {room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-gray-900 text-base line-clamp-1 flex-1 pr-2">{room.name}</h3>
                    <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] font-bold text-gray-700">{room.rating || 'New'}</span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{room.description ? room.description.replace(/<[^>]*>/g, '') : 'No description provided.'}</p>

                  <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-xs text-gray-400 font-medium">Starting from</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">${room.price}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">/night</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-xs text-gray-400 font-medium flex items-center gap-1 justify-end"><BedDouble className="w-3.5 h-3.5"/> Sleeps {room.guests || room.capacity || '–'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                     <button onClick={() => setViewRoomTarget(room)} className="cursor-pointer flex items-center justify-center gap-1.5 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold rounded-xl transition-all border border-primary-200">
                       <Info className="w-3.5 h-3.5" /> View
                     </button>
                     <button onClick={() => openRoomEdit(room)} className="cursor-pointer flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200">
                       <Edit2 className="w-3.5 h-3.5" /> Edit
                     </button>
                     <button onClick={() => setDeleteRoomTarget(room)} className="cursor-pointer flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all border border-red-200">
                       <Trash2 className="w-3.5 h-3.5" /> Delete
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="cursor-pointer p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-primary-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1.5">
               {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                 <button
                   key={page}
                   onClick={() => goToPage(page)}
                   className={`cursor-pointer w-9 h-9 rounded-xl text-xs font-black transition-all border ${
                     currentPage === page
                       ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/25'
                       : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-primary-300 shadow-sm'
                   }`}
                 >
                   {page}
                 </button>
               ))}
            </div>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="cursor-pointer p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-primary-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        </div>
      </div>
    ) : (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Property Types Section */}
         <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-black text-gray-900 text-lg">Property Types</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Manage villa types, suites, etc.</p>
               </div>
               <button onClick={() => { setEditTypeTarget(null); setTypeName(''); setShowTypeModal(true); }} className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-all"><Plus className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {propertyTypes.map(t => (
                 <div key={t._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <span className="font-bold text-gray-700 text-sm">{t.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => { setEditTypeTarget(t); setTypeName(t.name); setShowTypeModal(true); }} className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm hover:text-blue-600"><Edit2 className="w-3.5 h-3.5"/></button>
                       <button onClick={() => handleDeleteType(t._id)} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Price Units Section */}
         <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-black text-gray-900 text-lg">Price Units</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Manage billing cycles (nightly, hourly, etc.)</p>
               </div>
               <button onClick={() => { setEditUnitTarget(null); setUnitForm({ name: '', label: '' }); setShowUnitModal(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"><Plus className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {priceUnits.map(u => (
                 <div key={u._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div>
                       <span className="font-bold text-gray-700 text-sm">{u.label}</span>
                       <p className="text-[9px] text-gray-400 font-bold uppercase italic">{u.name}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => { setEditUnitTarget(u); setUnitForm({ name: u.name, label: u.label }); setShowUnitModal(true); }} className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm hover:text-blue-600"><Edit2 className="w-3.5 h-3.5"/></button>
                       <button onClick={() => handleDeleteUnit(u._id)} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Categories Section */}
         <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <div>
                  <h3 className="font-black text-gray-900 text-lg">Room Categories</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Manage major groupings and display colors</p>
               </div>
               <button onClick={openCatCreate} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"><Plus className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {categories.map(c => (
                 <div key={c._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${c.color?.split(' ')[0] || 'bg-gray-400'}`} />
                       <span className="font-bold text-gray-700 text-sm">{c.name}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button onClick={() => openCatEdit(c)} className="p-1.5 bg-white text-blue-500 rounded-lg shadow-sm hover:text-blue-600"><Edit2 className="w-3.5 h-3.5"/></button>
                       <button onClick={() => setDeleteCatTarget(c)} className="p-1.5 bg-white text-red-500 rounded-lg shadow-sm hover:text-red-600"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    )}

      {/* --- Modals --- */}
      
      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-6 md:p-8 space-y-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-black text-gray-900 text-xl">{editRoomTarget ? 'Edit Property' : 'Add New Property'}</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Property details & Booking Configuration</p>
              </div>
              <button onClick={() => setShowRoomModal(false)} className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto scrollbar-hide">
              {[
                { id: 'general', label: 'General', icon: Info },
                { id: 'specs', label: 'Capacity', icon: Users },
                { id: 'features', label: 'Features', icon: Sparkles },
                { id: 'location', label: 'Location', icon: MapPin },
                { id: 'photos', label: 'Photos', icon: ImageIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[400px]">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Property Name *</label>
                    <input type="text" value={roomForm.name} onChange={(e) => setRoomForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-gray-50 focus:bg-white" placeholder="e.g. Villa Mandala Serenity" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Property Type</label>
                      {!showPropTypeInput ? (
                        <div className="flex gap-2">
                          <select value={roomForm.propertyType} onChange={(e) => {
                            if (e.target.value === 'ADD_NEW') setShowPropTypeInput(true);
                            else setRoomForm(p => ({ ...p, propertyType: e.target.value }));
                          }} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-all bg-gray-50 focus:bg-white cursor-pointer">
                            {propertyTypes.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
                            <option value="ADD_NEW">+ Add New Type...</option>
                          </select>
                        </div>
                      ) : (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-2">
                          <input type="text" value={newPropType} onChange={(e) => setNewPropType(e.target.value)} className="flex-1 border border-primary-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="New type name..." autoFocus />
                          <button onClick={handleAddPropType} className="bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 transition-all"><Check className="w-4 h-4"/></button>
                          <button onClick={() => setShowPropTypeInput(false)} className="bg-gray-100 text-gray-500 p-3 rounded-xl hover:bg-gray-200 transition-all"><X className="w-4 h-4"/></button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category *</label>
                      <select value={roomForm.category} onChange={(e) => setRoomForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 transition-all bg-gray-50 focus:bg-white cursor-pointer">
                        <option value="" disabled>Select category</option>
                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Discount Price ($) *</label>
                      <input type="number" value={roomForm.price} onChange={(e) => setRoomForm(p => ({ ...p, price: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="e.g. 200" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Original Price ($)</label>
                      <input type="number" value={roomForm.originalPrice} onChange={(e) => setRoomForm(p => ({ ...p, originalPrice: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="e.g. 250" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Price Unit</label>
                      {!showPriceUnitInput ? (
                        <select value={roomForm.priceUnit} onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') setShowPriceUnitInput(true);
                          else setRoomForm(p => ({ ...p, priceUnit: e.target.value }));
                        }} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white cursor-pointer">
                          {priceUnits.map(u => <option key={u._id} value={u.name}>{u.label}</option>)}
                          <option value="ADD_NEW">+ Add New Unit...</option>
                        </select>
                      ) : (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-2">
                           <div className="flex gap-2">
                              <input type="text" value={newPriceUnit.label} onChange={(e) => setNewPriceUnit(p => ({ ...p, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="flex-1 border border-primary-300 rounded-xl px-4 py-2 text-xs outline-none" placeholder="Label (e.g. Per Week)" />
                              <button onClick={handleAddPriceUnit} className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700"><Check className="w-4 h-4"/></button>
                              <button onClick={() => setShowPriceUnitInput(false)} className="bg-gray-100 text-gray-500 p-2 rounded-lg hover:bg-gray-200"><X className="w-4 h-4"/></button>
                           </div>
                           <p className="text-[9px] text-gray-400 font-bold px-1 italic">Identifier: {newPriceUnit.name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description (Rich Text)</label>
                    <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 quill-responsive-container">
                      <ReactQuill 
                        theme="snow" 
                        value={roomForm.description} 
                        onChange={(content) => setRoomForm(p => ({ ...p, description: content }))}
                        modules={quillModules}
                        formats={quillFormats}
                        className="bg-white"
                      />
                    </div>
                    <style dangerouslySetInnerHTML={{ __html: `
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
                    `}} />
                  </div>
                </div>
              )}

              {/* Specs Tab */}
              {activeTab === 'specs' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {[
                      { id: 'guests', label: 'Max Guests', icon: Users },
                      { id: 'bedrooms', label: 'Bedrooms', icon: BedDouble },
                      { id: 'beds', label: 'Total Beds', icon: BedDouble },
                      { id: 'bathrooms', label: 'Bathrooms', icon: Sparkles },
                    ].map(field => (
                      <div key={field.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                        <field.icon className="w-5 h-5 text-primary-500 mb-3" />
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{field.label}</label>
                        <input 
                          type="number" 
                          value={roomForm[field.id]} 
                          onChange={(e) => setRoomForm(p => ({ ...p, [field.id]: e.target.value }))} 
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-center text-sm font-black outline-none focus:border-primary-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
                    <h4 className="text-emerald-800 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Shield className="w-4 h-4" /> Guest Policies
                    </h4>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-emerald-900">Is this property currently available?</span>
                       <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={roomForm.isAvailable} onChange={(e) => setRoomForm(p => ({ ...p, isAvailable: e.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-emerald-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Features Tab (Highlights & Amenities) */}
              {activeTab === 'features' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Highlights Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-gray-900 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Key Highlights
                      </h4>
                      <button 
                        onClick={() => setRoomForm(p => ({ ...p, highlights: [...p.highlights, { icon: 'Star', text: '', subtext: '' }] }))}
                        className="cursor-pointer text-[10px] font-bold bg-primary-50 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-100 transition-all"
                      >
                        + Add Highlight
                      </button>
                    </div>
                    <div className="space-y-3">
                      {roomForm.highlights.map((h, i) => (
                        <div key={i} className="flex gap-3 items-start bg-gray-50 p-3 rounded-2xl border border-gray-100 group">
                           <div className="relative">
                              <select 
                                value={h.icon} 
                                onChange={(e) => {
                                  const next = [...roomForm.highlights];
                                  next[i].icon = e.target.value;
                                  setRoomForm(p => ({ ...p, highlights: next }));
                                }}
                                className="opacity-0 absolute inset-0 cursor-pointer z-10 w-full"
                              >
                                {ICON_LIST.map(ic => <option key={ic.name} value={ic.name}>{ic.name}</option>)}
                              </select>
                              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                                {(() => {
                                  const IconComp = ICON_LIST.find(ic => ic.name === h.icon)?.icon || Star;
                                  return <IconComp className="w-5 h-5" />;
                                })()}
                              </div>
                           </div>
                           <div className="flex-1 space-y-2">
                              <input 
                                type="text" 
                                placeholder="Main text (e.g. Great Location)" 
                                value={h.text}
                                onChange={(e) => {
                                  const next = [...roomForm.highlights];
                                  next[i].text = e.target.value;
                                  setRoomForm(p => ({ ...p, highlights: next }));
                                }}
                                className="w-full bg-transparent border-b border-gray-200 text-sm font-bold outline-none focus:border-primary-500" 
                              />
                              <input 
                                type="text" 
                                placeholder="Subtext (e.g. 95% of recent guests gave 5 stars)" 
                                value={h.subtext}
                                onChange={(e) => {
                                  const next = [...roomForm.highlights];
                                  next[i].subtext = e.target.value;
                                  setRoomForm(p => ({ ...p, highlights: next }));
                                }}
                                className="w-full bg-transparent border-b border-gray-200 text-[10px] outline-none focus:border-primary-400" 
                              />
                           </div>
                           <button onClick={() => setRoomForm(p => ({ ...p, highlights: p.highlights.filter((_, idx) => idx !== i) }))} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-gray-900 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" /> Amenities
                      </h4>
                      <button 
                        onClick={() => setRoomForm(p => ({ ...p, amenities: [...p.amenities, { name: '', icon: 'Check' }] }))}
                        className="cursor-pointer text-[10px] font-bold bg-primary-50 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-100 transition-all"
                      >
                        + Add Amenity
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roomForm.amenities.map((a, i) => (
                        <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100 group">
                           <div className="relative">
                              <select 
                                value={a.icon} 
                                onChange={(e) => {
                                  const next = [...roomForm.amenities];
                                  next[i].icon = e.target.value;
                                  setRoomForm(p => ({ ...p, amenities: next }));
                                }}
                                className="opacity-0 absolute inset-0 cursor-pointer z-10 w-full"
                              >
                                {ICON_LIST.map(ic => <option key={ic.name} value={ic.name}>{ic.name}</option>)}
                              </select>
                              <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                                {(() => {
                                  const IconComp = ICON_LIST.find(ic => ic.name === a.icon)?.icon || Check;
                                  return <IconComp className="w-4 h-4" />;
                                })()}
                              </div>
                           </div>
                           <input 
                              type="text" 
                              placeholder="Amenity name" 
                              value={a.name}
                              onChange={(e) => {
                                const next = [...roomForm.amenities];
                                next[i].name = e.target.value;
                                setRoomForm(p => ({ ...p, amenities: next }));
                              }}
                              className="flex-1 bg-transparent border-b border-gray-200 text-xs font-bold outline-none focus:border-primary-500" 
                            />
                           <button onClick={() => setRoomForm(p => ({ ...p, amenities: p.amenities.filter((_, idx) => idx !== i) }))} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Street Address</label>
                        <input type="text" value={roomForm.address} onChange={(e) => setRoomForm(p => ({ ...p, address: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="e.g. 123 Serenity Beach Rd" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">City</label>
                        <input type="text" value={roomForm.city} onChange={(e) => setRoomForm(p => ({ ...p, city: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="Puducherry" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Country</label>
                        <input type="text" value={roomForm.country} onChange={(e) => setRoomForm(p => ({ ...p, country: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="India" />
                      </div>
                   </div>
                   <div className="p-6 bg-primary-50 border border-primary-100 rounded-3xl flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm shadow-primary-500/10">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-primary-900 font-black text-sm">Availability Management</h4>
                        <p className="text-[10px] text-primary-700/70 font-bold uppercase tracking-wider mt-1">Calendar sync coming in the next update</p>
                      </div>
                   </div>
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     {/* Existing Images */}
                     {roomForm.images && roomForm.images.map((img, idx) => (
                       <div key={idx} className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-2">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden group shadow-sm">
                             <img src={img.url.startsWith('http') ? img.url : `${SERVER_URL}${img.url}`} alt="Preview" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => setRoomForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))} className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-all shadow-lg"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Image label (e.g. Kitchen)" 
                            value={img.label} 
                            onChange={(e) => {
                              const next = [...roomForm.images];
                              next[idx].label = e.target.value;
                              setRoomForm(p => ({ ...p, images: next }));
                            }}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-primary-500" 
                          />
                       </div>
                     ))}
                     {/* Local Previews */}
                     {roomImages.map((imgObj, idx) => (
                       <div key={`new-${idx}`} className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-2">
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden group shadow-sm">
                             <img src={URL.createObjectURL(imgObj.file)} alt="New Preview" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => setRoomImages(p => p.filter((_, i) => i !== idx))} className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-all shadow-lg"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                          <input 
                            type="text" 
                            placeholder="New label..." 
                            value={imgObj.label || ''} 
                            onChange={(e) => {
                              const next = [...roomImages];
                              next[idx].label = e.target.value;
                              setRoomImages(next);
                            }}
                            className="bg-white border border-primary-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-primary-500" 
                          />
                       </div>
                     ))}
                     {roomImages.length + (roomForm.images?.length || 0) < 12 && (
                       <label className="cursor-pointer aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 hover:bg-primary-50/30 transition-all group">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5" /></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                          <input type="file" multiple accept="image/*" onChange={(e) => {
                            const files = Array.from(e.target.files).map(f => ({ file: f, label: '' }));
                            setRoomImages(p => [...p, ...files]);
                          }} className="hidden" />
                       </label>
                     )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">Assign labels like "Master Bedroom" or "Dining Area" to help guests orient themselves.</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-100">
              <button onClick={() => setShowRoomModal(false)} className="cursor-pointer px-5 py-3.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
              <div className="flex gap-3 flex-1 justify-end">
                {!editRoomTarget && (
                  <button
                    onClick={handleSaveDraft}
                    disabled={savingDraft || submittingRoom}
                    className="cursor-pointer px-5 py-3.5 border border-amber-300 bg-amber-50 text-amber-700 text-sm font-bold rounded-2xl hover:bg-amber-100 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
                    {draftId ? 'Update Draft' : 'Save Draft'}
                  </button>
                )}
                <button
                  onClick={handleSaveRoom}
                  disabled={submittingRoom || savingDraft}
                  className="cursor-pointer px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-primary-500/25 disabled:opacity-50 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {submittingRoom && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editRoomTarget ? 'Save Changes' : 'Publish Property'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
             <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-gray-900 text-xl">{editCatTarget ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowCatModal(false)} className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category Name *</label>
              <input type="text" value={catForm.name} onChange={(e) => setCatForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-gray-50 focus:bg-white" placeholder="e.g. Penthouse" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</label>
              <textarea rows="2" value={catForm.description} onChange={(e) => setCatForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none bg-gray-50 focus:bg-white" placeholder="Short description..." />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Label Color</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatForm(p => ({ ...p, color: c }))}
                    className={`cursor-pointer w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${c.split(' ')[0]} ${c.split(' ')[1]} ${catForm.color === c ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent'}`}
                  >
                     <Tag className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

             <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowCatModal(false)} className="cursor-pointer flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleSaveCat} disabled={submittingCat} className="cursor-pointer flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
                {submittingCat && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Room Modal */}
      {deleteRoomTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 text-xl">Delete Room?</h3>
            <p className="text-sm text-gray-500">This will permanently remove <span className="font-bold text-gray-800">{deleteRoomTarget.name}</span>. This action cannot be undone.</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setDeleteRoomTarget(null)} className="cursor-pointer flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleDeleteRoom} className="cursor-pointer flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/20">Delete Room</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {deleteCatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Folder className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 text-xl">Delete Category?</h3>
            <p className="text-sm text-gray-500">Are you sure you want to delete <span className="font-bold text-gray-800">{deleteCatTarget.name}</span>? Rooms using this category might need to be updated.</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setDeleteCatTarget(null)} className="cursor-pointer flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleDeleteCat} className="cursor-pointer flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-500/20">Delete Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Property Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
             <h2 className="font-black text-gray-900 text-xl mb-6">{editTypeTarget ? 'Edit Type' : 'New Property Type'}</h2>
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Type Name</label>
                   <input type="text" value={typeName} onChange={(e) => setTypeName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="e.g. Luxury Villa" />
                </div>
                <div className="flex gap-3 pt-4">
                   <button onClick={() => setShowTypeModal(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Cancel</button>
                   <button onClick={handleSaveType} className="flex-[2] py-3 bg-primary-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary-500/20">Save Type</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Price Unit Modal */}
      {showUnitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
             <h2 className="font-black text-gray-900 text-xl mb-6">{editUnitTarget ? 'Edit Price Unit' : 'New Price Unit'}</h2>
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Display Label</label>
                   <input type="text" value={unitForm.label} onChange={(e) => setUnitForm(p => ({ ...p, label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary-500 bg-gray-50 focus:bg-white" placeholder="e.g. Per Stay" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">System Identifier</label>
                   <input type="text" value={unitForm.name} readOnly className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-gray-100 text-gray-400 cursor-not-allowed" />
                </div>
                <div className="flex gap-3 pt-4">
                   <button onClick={() => setShowUnitModal(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Cancel</button>
                   <button onClick={handleSaveUnit} className="flex-[2] py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-500/20">Save Unit</button>
                </div>
             </div>
          </div>
        </div>
      )}
      {/* Property View Detail Modal */}
      {viewRoomTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl p-0 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <h2 className="font-black text-gray-900 text-xl">{viewRoomTarget.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded-md">
                    {viewRoomTarget.category}
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {viewRoomTarget.propertyType}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewRoomTarget(null)} className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* Image Gallery Preview */}
              {viewRoomTarget.images?.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {viewRoomTarget.images.map((img, i) => (
                    <div key={i} className={`relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                      <img 
                        src={img.url.startsWith('http') ? img.url : `${SERVER_URL}${img.url}`} 
                        alt={img.label} 
                        className="w-full h-full object-cover aspect-video"
                      />
                      {img.label && (
                        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                          {img.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Left: Main Details */}
                <div className="md:col-span-2 space-y-8">
                  {/* Stats Bar */}
                  <div className="grid grid-cols-4 gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="text-center">
                      <Users className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                      <p className="text-sm font-black text-gray-900">{viewRoomTarget.guests || viewRoomTarget.capacity}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Guests</p>
                    </div>
                    <div className="text-center">
                      <BedDouble className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                      <p className="text-sm font-black text-gray-900">{viewRoomTarget.bedrooms}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Beds</p>
                    </div>
                    <div className="text-center">
                      <Sparkles className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                      <p className="text-sm font-black text-gray-900">{viewRoomTarget.bathrooms}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Baths</p>
                    </div>
                    <div className="text-center">
                      <Star className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className="text-sm font-black text-gray-900">{viewRoomTarget.rating?.toFixed(1) || 'New'}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Rating</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-primary-500" /> About Property
                    </h4>
                    <div 
                      className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: viewRoomTarget.description || 'No description provided.' }}
                    />
                  </div>

                  {/* Amenities & Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {viewRoomTarget.amenities?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {viewRoomTarget.amenities.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs font-bold">
                              <Check className="w-3 h-3" /> {a.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewRoomTarget.highlights?.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Highlights</h4>
                        <div className="space-y-3">
                          {viewRoomTarget.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                                <Star className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{h.text}</p>
                                {h.subtext && <p className="text-[10px] text-gray-500 leading-tight">{h.subtext}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Sidebar Info */}
                <div className="space-y-6">
                  {/* Pricing Card */}
                  <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-900/20">
                    <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Live Pricing</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-black">${viewRoomTarget.price}</h3>
                      {viewRoomTarget.originalPrice && (
                        <span className="text-gray-500 text-sm line-through">${viewRoomTarget.originalPrice}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">per {viewRoomTarget.priceUnit || 'night'}</p>
                    
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Availability</span>
                        <span className={`font-bold ${viewRoomTarget.isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                          {viewRoomTarget.isAvailable ? 'Instant Booking' : 'Not Available'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Status</span>
                        <span className={`font-black uppercase tracking-wider ${viewRoomTarget.status === 'published' ? 'text-primary-400' : 'text-amber-400'}`}>
                          {viewRoomTarget.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Location Detail
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                        <p className="font-bold text-gray-900">{viewRoomTarget.address || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City</p>
                          <p className="font-bold text-gray-900">{viewRoomTarget.city || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country</p>
                          <p className="font-bold text-gray-900">{viewRoomTarget.country || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setViewRoomTarget(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all"
              >
                Close View
              </button>
              <button 
                onClick={() => { setViewRoomTarget(null); openRoomEdit(viewRoomTarget); }}
                className="px-6 py-2.5 bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all"
              >
                Edit Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Resume Prompt */}
      {draftPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-7 h-7 text-amber-500" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-xl">Resume Draft?</h3>
              <p className="text-sm text-gray-500 mt-2">
                You have an unsaved draft: <span className="font-bold text-gray-800">"{draftPrompt.name || 'Untitled'}"</span>.
                Would you like to continue where you left off?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={discardDraftAndCreate}
                className="cursor-pointer flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Start Fresh
              </button>
              <button
                onClick={() => resumeDraft(draftPrompt)}
                className="cursor-pointer flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                Resume Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
