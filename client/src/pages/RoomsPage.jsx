import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Search, BedDouble, Star, Users, Bath, ArrowRight, Loader2,
  MapPin, CalendarDays, Heart, ChevronLeft, ChevronRight,
  Home, Trees, Tent, Warehouse, Compass, Building2, Waves,
  SlidersHorizontal, Check, X, Building, Hotel, Info
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../api';

const SERVER_URL = 'http://localhost:5000';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const categoryIcons = {
  'Cabin': Home,
  'Country Side': Trees,
  'Tiny Homes': Tent,
  'Farm Houses': Warehouse,
  'Camping': Compass,
  'Iconic Cities': Building2,
  'Lake Front': Waves,
  'All': BedDouble
};

const getCategoryIcon = (catName) => {
  return categoryIcons[catName] || BedDouble;
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return new Date(dateStr);
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
};

const formatDateLocal = (date) => {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Sub-component for individual card image carousel
const ImageCarousel = ({ images, roomName }) => {
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c + 1) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        <BedDouble className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img 
        src={getImageUrl(images[current])} 
        alt={`${roomName} - View ${current + 1}`}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      {images.length > 1 && hovered && (
        <>
          <button 
            onClick={prev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all z-10 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button 
            onClick={next}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all z-10 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        </>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, idx) => (
            <span 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full transition-all ${current === idx ? 'bg-white scale-125' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RoomsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL Query parameters states
  const queryCheckIn = searchParams.get('checkIn') || '';
  const queryCheckOut = searchParams.get('checkOut') || '';
  const queryGuests = searchParams.get('guests') || '1';

  // Search input states (local copy before clicking "Update Search")
  const [checkInInput, setCheckInInput] = useState(queryCheckIn ? parseLocalDate(queryCheckIn) : null);
  const [checkOutInput, setCheckOutInput] = useState(queryCheckOut ? parseLocalDate(queryCheckOut) : null);
  const [guestsInput, setGuestsInput] = useState(queryGuests);

  // Sync inputs with URL parameters changes (e.g. searching from Home Page)
  useEffect(() => {
    setCheckInInput(queryCheckIn ? parseLocalDate(queryCheckIn) : null);
    setCheckOutInput(queryCheckOut ? parseLocalDate(queryCheckOut) : null);
    setGuestsInput(queryGuests);
  }, [queryCheckIn, queryCheckOut, queryGuests]);

  // General Page Data States
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Sorting
  const [sortBy, setSortBy] = useState('latest'); // latest, price-asc, price-desc, rating

  // Sidebar Filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterBedrooms, setFilterBedrooms] = useState('Any');
  const [filterBeds, setFilterBeds] = useState('Any');
  const [filterBathrooms, setFilterBathrooms] = useState('Any');
  const [filterPropertyType, setFilterPropertyType] = useState('Any');

  // Wishlist Heart toggles (from global Auth state)
  const { user, toggleUserWishlist } = useAuth();
  const wishlist = user?.wishlist || [];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Load Rooms & Categories from database
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [roomsRes, catsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/categories')
        ]);
        setRooms(roomsRes.data);
        setCategories(['All', ...catsRes.data.map(c => c.name)]);
      } catch (e) {
        console.error('Error fetching rooms page data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Update URL Search Parameters on form submit
  const handleUpdateSearch = (e) => {
    if (e) e.preventDefault();
    const params = {};
    if (checkInInput) params.checkIn = formatDateLocal(checkInInput);
    if (checkOutInput) params.checkOut = formatDateLocal(checkOutInput);
    if (guestsInput) params.guests = guestsInput;
    setSearchParams(params);
  };

  // Helper: Clear all sidebar filters
  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setFilterBedrooms('Any');
    setFilterBeds('Any');
    setFilterBathrooms('Any');
    setFilterPropertyType('Any');
  };

  const activeFilterCount = 
    (minPrice !== '' ? 1 : 0) + 
    (maxPrice !== '' ? 1 : 0) + 
    (filterBedrooms !== 'Any' ? 1 : 0) +
    (filterBeds !== 'Any' ? 1 : 0) +
    (filterBathrooms !== 'Any' ? 1 : 0) +
    (filterPropertyType !== 'Any' ? 1 : 0);

  // Toggle wishlist state
  const toggleWishlist = async (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleUserWishlist(id);
  };

  // Calculate nights
  const calculateNights = () => {
    if (queryCheckIn && queryCheckOut) {
      const start = parseLocalDate(queryCheckIn);
      const end = parseLocalDate(queryCheckOut);
      const diff = end - start;
      if (diff > 0) {
        return Math.round(diff / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  };
  const totalNights = calculateNights();

  // Advanced Local Filtering
  const filteredRooms = rooms.filter(room => {
    // 1. Category Pill Filter
    if (activeCategory !== 'All' && room.category !== activeCategory) return false;

    // 2. Guests capacity
    const searchGuestsCount = parseInt(queryGuests, 10) || 1;
    if (room.guests < searchGuestsCount) return false;

    // 3. Overlap with unavailable dates
    if (queryCheckIn && queryCheckOut) {
      const start = parseLocalDate(queryCheckIn);
      const end = parseLocalDate(queryCheckOut);
      if (room.unavailableDates && room.unavailableDates.length > 0) {
        const hasOverlap = room.unavailableDates.some(dateStr => {
          const unavailableDate = new Date(dateStr);
          return unavailableDate >= start && unavailableDate <= end;
        });
        if (hasOverlap) return false;
      }
    }

    // 4. Price range
    if (minPrice !== '' && room.price < parseFloat(minPrice)) return false;
    if (maxPrice !== '' && room.price > parseFloat(maxPrice)) return false;

    // 5. Rooms & Beds count
    if (filterBedrooms !== 'Any') {
      const count = parseInt(filterBedrooms.replace('+', ''), 10);
      if (room.bedrooms < count) return false;
    }
    if (filterBeds !== 'Any') {
      const count = parseInt(filterBeds.replace('+', ''), 10);
      if (room.beds < count) return false;
    }
    if (filterBathrooms !== 'Any') {
      const count = parseInt(filterBathrooms.replace('+', ''), 10);
      if (room.bathrooms < count) return false;
    }

    // 6. Property type selection
    if (filterPropertyType !== 'Any') {
      const filterTypeLower = filterPropertyType.toLowerCase();
      const roomTypeLower = (room.propertyType || '').toLowerCase();
      const roomCategoryLower = (room.category || '').toLowerCase();
      if (!roomTypeLower.includes(filterTypeLower) && !roomCategoryLower.includes(filterTypeLower)) return false;
    }

    return true;
  });

  // Sorting
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    // latest
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Reset page when search or filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory, queryCheckIn, queryCheckOut, queryGuests, 
    minPrice, maxPrice, filterBedrooms, filterBeds, filterBathrooms, 
    filterPropertyType, sortBy, itemsPerPage
  ]);

  // Pagination calculation
  const totalItems = sortedRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedRooms = sortedRooms.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-20">
      
      {/* Top Search bar - Match image style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_4px_30px_rgba(0,0,0,0.03)] p-5 md:p-6">
          {/* Input Form */}
          <form onSubmit={handleUpdateSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Check In */}
            <div className="md:col-span-3 flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 hover:border-gray-300 hover:bg-white transition-all">
              <CalendarDays className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Check In</label>
                <DatePicker
                  selected={checkInInput}
                  onChange={(date) => setCheckInInput(date)}
                  selectsStart
                  startDate={checkInInput}
                  endDate={checkOutInput}
                  minDate={new Date()}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Add Date"
                  className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                  popperProps={{ strategy: "fixed" }}
                />
              </div>
            </div>

            {/* Check Out */}
            <div className="md:col-span-3 flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 hover:border-gray-300 hover:bg-white transition-all">
              <CalendarDays className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Check Out</label>
                <DatePicker
                  selected={checkOutInput}
                  onChange={(date) => setCheckOutInput(date)}
                  selectsEnd
                  startDate={checkInInput}
                  endDate={checkOutInput}
                  minDate={checkInInput || new Date()}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Add Date"
                  className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                  popperProps={{ strategy: "fixed" }}
                />
              </div>
            </div>

            {/* Guests */}
            <div className="md:col-span-3 flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-2xl px-4 py-3 hover:border-gray-300 hover:bg-white transition-all">
              <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Guests</label>
                <select
                  value={guestsInput}
                  onChange={(e) => setGuestsInput(e.target.value)}
                  className="w-full text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Update button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                <Search className="w-4 h-4" />
                <span>Update Search</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Results summary and toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/60 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              Found <span className="text-violet-600">{totalItems}</span> stay{totalItems !== 1 ? 's' : ''}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Sorting */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-bold">
              <span className="text-gray-400 mr-2">Sort:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="bg-transparent outline-none text-gray-800 cursor-pointer font-extrabold"
              >
                <option value="latest">Latest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* View selectors */}
            <div className="hidden sm:flex items-center border border-gray-200 bg-white rounded-xl p-1">
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 transition-colors" title="Map View">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </button>
              <button className="p-1.5 rounded-lg bg-gray-100 text-gray-800" title="Card View">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Scroller - styled as pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-thin">
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-black transition-all border shrink-0 ${
                  activeCategory === cat
                    ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-500/20'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT side: Rooms Grid */}
          <div className="lg:col-span-8 space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Searching stays...</p>
              </div>
            ) : paginatedRooms.length === 0 ? (
              <div className="text-center bg-white rounded-3xl border border-gray-150 p-16">
                <BedDouble className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <h3 className="font-extrabold text-gray-800 text-lg mb-1">No stays match your criteria</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">Try adjusting your filters, location search, or widening your dates.</p>
                <button 
                  onClick={handleClearFilters}
                  className="bg-violet-50 text-violet-600 hover:bg-violet-100 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedRooms.map(room => {
                    const isWishlisted = wishlist.includes(room._id);
                    const roomTotal = totalNights > 0 ? room.price * totalNights : 0;
                    
                    // Create search-preserving state/query for Room Detail redirection
                    const detailLink = `/rooms/${room._id}?checkIn=${queryCheckIn}&checkOut=${queryCheckOut}&guests=${queryGuests}`;

                    return (
                      <div 
                        key={room._id}
                        className="group bg-white rounded-3xl border border-gray-150/70 overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300 flex flex-col relative"
                      >
                        {/* Image Panel */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900">
                          <ImageCarousel images={room.images} roomName={room.name} />

                          {/* Star Rating Badge */}
                          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm shadow px-2.5 py-1 rounded-full border border-gray-100/50">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-black text-gray-800">{room.rating ? room.rating.toFixed(1) : 'New'}</span>
                          </div>

                          {/* Wishlist Heart Icon */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleWishlist(room._id);
                            }}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white hover:scale-105 shadow-md active:scale-95 transition-all cursor-pointer"
                          >
                            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                          </button>
                        </div>

                        {/* Description Panel */}
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-1 text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1.5">
                            <span>{room.category}</span>
                            <span>•</span>
                            <span className="truncate">{room.propertyType}</span>
                          </div>

                          <Link 
                            to={detailLink} 
                            className="font-black text-gray-900 text-lg group-hover:text-primary-600 line-clamp-1 transition-colors leading-snug mb-1"
                          >
                            {room.name}
                          </Link>

                          <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold mb-4">
                            <MapPin className="w-3.5 h-3.5 text-gray-300" />
                            <span className="truncate">{[room.city, room.country].filter(Boolean).join(', ')}</span>
                          </div>

                          {/* Specs */}
                          <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-2.5 text-[10px] text-gray-500 font-black uppercase text-center mb-5 border border-gray-100">
                            <div>
                              <p className="text-gray-400 mb-0.5">Guests</p>
                              <p className="text-gray-800 font-extrabold">{room.guests}</p>
                            </div>
                            <div className="border-x border-gray-200/80">
                              <p className="text-gray-400 mb-0.5">Beds</p>
                              <p className="text-gray-800 font-extrabold">{room.beds}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">Baths</p>
                              <p className="text-gray-800 font-extrabold">{room.bathrooms}</p>
                            </div>
                          </div>

                          {/* Pricing & Reservation CTA */}
                          <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-gray-900">${room.price}</span>
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">/ night</span>
                              </div>
                              {roomTotal > 0 && (
                                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                  ${roomTotal.toLocaleString()} total for {totalNights} night{totalNights !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>

                            <Link 
                              to={detailLink}
                              className="bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-primary-500/20 active:scale-98 transition-all flex items-center gap-1"
                            >
                              <span>View Stay</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200/60 pt-8 mt-10 gap-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} stays
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-violet-600 text-white shadow-md'
                              : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                      <span>Per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
                        className="bg-transparent border border-gray-200 rounded-lg py-1 px-1.5 text-gray-700 outline-none cursor-pointer"
                      >
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                        <option value={12}>12</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT side: Sidebar Filters */}
          <div className="lg:col-span-4 bg-white border border-gray-150 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.02)] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-base font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                Filters
              </h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-violet-600 hover:text-violet-700 font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Price Range */}
            <div className="space-y-3.5 border-b border-gray-100 pb-5">
              <div>
                <p className="font-extrabold text-sm text-gray-800 mb-0.5">Price range</p>
                {totalNights > 0 && (
                  <p className="text-[10px] text-gray-400 font-bold">The average total price for {totalNights} night{totalNights !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none"
                  />
                </div>
                <div className="text-gray-400 text-xs">—</div>
                <div className="flex-1 bg-gray-50 border border-gray-150 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-gray-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Removed Type of Place */}

            {/* Rooms and beds selectors */}
            <div className="space-y-4 border-b border-gray-100 pb-5">
              <p className="font-extrabold text-sm text-gray-800">Rooms and beds</p>
              
              {/* Bedrooms */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-gray-500">Bedrooms</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Any', '1', '2', '3', '4', '5+'].map(val => (
                    <button
                      key={val}
                      onClick={() => setFilterBedrooms(val)}
                      className={`cursor-pointer min-w-9 h-9 rounded-full font-bold text-[11px] transition-all border ${
                        filterBedrooms === val
                          ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beds */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-gray-500">Beds</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Any', '1', '2', '3', '4', '5+'].map(val => (
                    <button
                      key={val}
                      onClick={() => setFilterBeds(val)}
                      className={`cursor-pointer min-w-9 h-9 rounded-full font-bold text-[11px] transition-all border ${
                        filterBeds === val
                          ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-gray-500">Bathrooms</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Any', '1', '2', '3', '4', '5+'].map(val => (
                    <button
                      key={val}
                      onClick={() => setFilterBathrooms(val)}
                      className={`cursor-pointer min-w-9 h-9 rounded-full font-bold text-[11px] transition-all border ${
                        filterBathrooms === val
                          ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Type Grid selectors */}
            <div className="space-y-4">
              <p className="font-extrabold text-sm text-gray-800">Property type</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'House', icon: Home },
                  { name: 'Apartment', icon: Building },
                  { name: 'Guesthouse', icon: Warehouse },
                  { name: 'Hotel', icon: Hotel }
                ].map(({ name, icon: Icon }) => {
                  const isActive = filterPropertyType === name;
                  return (
                    <button
                      key={name}
                      onClick={() => setFilterPropertyType(isActive ? 'Any' : name)}
                      className={`cursor-pointer p-4 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                        isActive
                          ? 'border-violet-600 bg-violet-50/50 text-violet-700 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-350 text-gray-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                      <span className="block text-xs font-extrabold leading-tight">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RoomsPage;
