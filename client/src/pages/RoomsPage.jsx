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
import api, { getRoomSlug } from '../api';

const SERVER_URL = import.meta.env.VITE_BASE_URL ;

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
  const queryCheckIn = searchParams.get('checkIn') ;
  const queryCheckOut = searchParams.get('checkOut') ;
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

  // Hero section data
  const [hero, setHero] = useState(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Ticker animation for mobile pill
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev === 0 ? 1 : 0));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get('/hero').then(res => setHero(res.data)).catch(() => {});
  }, []);

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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Wishlist Heart toggles (from global Auth state)
  const { user, toggleUserWishlist } = useAuth();
  const wishlist = user?.wishlist || [];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    setActiveCategory('All');
    setSortBy('latest');
  };

  const activeFilterCount = 
    (minPrice !== '' ? 1 : 0) + 
    (maxPrice !== '' ? 1 : 0) + 
    (filterBedrooms !== 'Any' ? 1 : 0) +
    (filterBeds !== 'Any' ? 1 : 0) +
    (filterBathrooms !== 'Any' ? 1 : 0) +
    (activeCategory !== 'All' ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0);

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
    sortBy, itemsPerPage
  ]);

  // Pagination calculation
  const totalItems = sortedRooms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedRooms = sortedRooms.slice(indexOfFirstItem, indexOfLastItem);

  // Hero derived values
  const heroVideoSrc = hero?.videoUrl
    ? (hero.videoUrl.startsWith('http') ? hero.videoUrl : `${SERVER_URL}${hero.videoUrl}`)
    : null;
  const heroImageSrc = hero?.backgroundImage
    ? (hero.backgroundImage.startsWith('http') ? hero.backgroundImage : `${SERVER_URL}${hero.backgroundImage}`)
    : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop';

  const dateText = checkInInput && checkOutInput
    ? `${checkInInput.getDate()} ${checkInInput.toLocaleString('default', { month: 'short' })} – ${checkOutInput.getDate()} ${checkOutInput.toLocaleString('default', { month: 'short' })}`
    : 'Add your dates';
  const guestText = guestsInput ? `${guestsInput} Guest${guestsInput > 1 ? 's' : ''}` : 'Select guests';  const renderFilterContent = () => (
    <>
      {/* Sort By Dropdown */}
      <div className="space-y-2 border-b border-gray-100 pb-5">
        <p className="font-extrabold text-sm text-gray-850">Sort by</p>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center shadow-sm">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3.5 border-b border-gray-100 pb-5">
        <div>
          <p className="font-extrabold text-sm text-gray-850 mb-0.5">Price range</p>
          {totalNights > 0 && (
            <p className="text-[10px] text-gray-400 font-bold">The average total price for {totalNights} night{totalNights !== 1 ? 's' : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
            <span className="text-gray-400 text-xs font-bold">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full text-xs font-bold text-gray-800 bg-transparent outline-none"
            />
          </div>
          <div className="text-gray-400 text-xs">—</div>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
            <span className="text-gray-400 text-xs font-bold">₹</span>
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

      {/* Rooms and beds selectors */}
      <div className="space-y-4 border-b border-gray-100 pb-5">
        <p className="font-extrabold text-sm text-gray-850">Rooms and beds</p>
        
        {/* Bedrooms */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-gray-500">Bedrooms</span>
          <div className="flex flex-wrap gap-1.5">
            {['Any', '1', '2', '3', '4', '5+'].map(val => (
              <button
                key={val}
                onClick={() => setFilterBedrooms(val)}
                className={`cursor-pointer w-9 h-9 rounded-lg font-bold text-[11px] transition-all border ${
                  filterBedrooms === val
                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
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
          <span className="block text-xs font-bold text-gray-500">Beds</span>
          <div className="flex flex-wrap gap-1.5">
            {['Any', '1', '2', '3', '4', '5+'].map(val => (
              <button
                key={val}
                onClick={() => setFilterBeds(val)}
                className={`cursor-pointer w-9 h-9 rounded-lg font-bold text-[11px] transition-all border ${
                  filterBeds === val
                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
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
          <span className="block text-xs font-bold text-gray-500">Bathrooms</span>
          <div className="flex flex-wrap gap-1.5">
            {['Any', '1', '2', '3', '4', '5+'].map(val => (
              <button
                key={val}
                onClick={() => setFilterBathrooms(val)}
                className={`cursor-pointer w-9 h-9 rounded-lg font-bold text-[11px] transition-all border ${
                  filterBathrooms === val
                    ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="space-y-4">
        <p className="font-extrabold text-sm text-gray-850">Category</p>
        <div className="flex flex-wrap gap-2.5">
          {categories.map(cat => {
            const Icon = getCategoryIcon(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all border shrink-0 ${
                  isActive
                    ? 'bg-gray-900 border-gray-900 text-white shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">

      {/* ══════════════════════════════════════════
           HERO SECTION  (mirrors HomePage HeroSection)
         ══════════════════════════════════════════ */}
      <>
        <section className="relative h-[220px] md:h-[260px] lg:h-[300px] font-sans flex flex-col bg-gray-900 rounded-b-[2.5rem] lg:rounded-b-none shadow-xl">
          <style>{`
            @keyframes rooms-reveal {
              from { opacity: 0; transform: translateY(22px); filter: blur(8px); }
              to   { opacity: 1; transform: translateY(0);   filter: blur(0);   }
            }
            .rooms-reveal-d1 { animation: rooms-reveal 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
            .rooms-reveal-d2 { animation: rooms-reveal 0.9s cubic-bezier(0.22,1,0.36,1) 0.30s both; }
            .rooms-reveal-d3 { animation: rooms-reveal 0.9s cubic-bezier(0.22,1,0.36,1) 0.50s both; }
            @keyframes slide-in-right {
              from { transform: translateX(100%); }
              to   { transform: translateX(0); }
            }
            .animate-slide-in-right {
              animation: slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          {/* Background — overflow-hidden + matching radius so image clips to curved bottom */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[2.5rem] lg:rounded-b-none">
            {heroVideoSrc ? (
              <video key={heroVideoSrc} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-90">
                <source src={heroVideoSrc} />
              </video>
            ) : (
              <img src={heroImageSrc} alt="Rooms hero" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/45" />
          </div>

          {/* Content — search bar only, no title/subtitle */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center h-full pt-24 pb-4">

            {/* ── Mobile search pill ── */}
            <div
              onClick={() => setIsMobileSearchOpen(true)}
              className="lg:hidden w-full max-w-xs bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-3 flex items-center gap-3 cursor-pointer shadow-xl rooms-reveal-d3 transition-transform active:scale-95"
            >
              <Search className="w-4 h-4 text-white ml-1 opacity-80 shrink-0" />
              <div className="relative h-5 w-full flex items-center overflow-hidden text-left">
                <p className={`absolute w-full text-white/90 font-medium text-sm transition-all duration-500 ease-in-out ${tickerIndex === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>{dateText}</p>
                <p className={`absolute w-full text-white/90 font-medium text-sm transition-all duration-500 ease-in-out ${tickerIndex === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>{guestText}</p>
              </div>
            </div>

            {/* ── Desktop booking bar ── */}
            <div className="hidden lg:flex bg-white rounded-[2.5rem] p-2 max-w-4xl w-full shadow-2xl flex-row items-center gap-2 divide-x divide-gray-100 rooms-reveal-d3 relative z-40">

              {/* Check-In */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 group">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Check In</p>
                  <DatePicker
                    selected={checkInInput}
                    onChange={(date) => setCheckInInput(date)}
                    selectsStart
                    startDate={checkInInput}
                    endDate={checkOutInput}
                    minDate={new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Add Date"
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer placeholder-gray-400"
                    popperPlacement="bottom-start"
                    popperProps={{ strategy: 'fixed', modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', options: { mainAxis: false } }] }}
                    popperClassName="z-[200]"
                  />
                </div>
              </div>

              {/* Check-Out */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 group">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Check Out</p>
                  <DatePicker
                    selected={checkOutInput}
                    onChange={(date) => setCheckOutInput(date)}
                    selectsEnd
                    startDate={checkInInput}
                    endDate={checkOutInput}
                    minDate={checkInInput || new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Add Date"
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer placeholder-gray-400"
                    popperPlacement="bottom-start"
                    popperProps={{ strategy: 'fixed', modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', options: { mainAxis: false } }] }}
                    popperClassName="z-[200]"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 group">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Guests</p>
                  <select
                    value={guestsInput}
                    onChange={(e) => setGuestsInput(e.target.value)}
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search button */}
              <div className="px-2 flex self-stretch py-1">
                <button
                  onClick={handleUpdateSearch}
                  className="w-full bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-sm rounded-full px-8 py-4 flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 group cursor-pointer"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>SEARCH</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ── Mobile search modal ── */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden">
            <div className="bg-white w-full rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative rooms-reveal [animation-duration:300ms]">
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-2xl font-bold mb-6 text-gray-900 mt-2">Find your stay</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <CalendarDays className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Check-In</p>
                    <DatePicker
                      selected={checkInInput}
                      onChange={(date) => setCheckInInput(date)}
                      selectsStart startDate={checkInInput} endDate={checkOutInput}
                      minDate={new Date()} dateFormat="dd MMM yyyy" placeholderText="Select date"
                      className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                      popperProps={{ strategy: 'fixed' }} popperClassName="z-[110]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <CalendarDays className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Check-Out</p>
                    <DatePicker
                      selected={checkOutInput}
                      onChange={(date) => setCheckOutInput(date)}
                      selectsEnd startDate={checkInInput} endDate={checkOutInput}
                      minDate={checkInInput || new Date()} dateFormat="dd MMM yyyy" placeholderText="Select date"
                      className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                      popperProps={{ strategy: 'fixed' }} popperClassName="z-[110]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Users className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Guests</p>
                    <select value={guestsInput} onChange={(e) => setGuestsInput(e.target.value)} className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => { handleUpdateSearch(); setIsMobileSearchOpen(false); }}
                  className="w-full bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-sm rounded-2xl px-8 py-4 mt-2 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Search className="w-5 h-5" />
                  <span>SEARCH</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Results summary and toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200/60 pb-5 mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              Found <span className="text-violet-600">{totalItems}</span> stay{totalItems !== 1 ? 's' : ''}
            </h1>
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
              <div className="text-center bg-white rounded-xl border border-gray-200 p-16">
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
                    const detailLink = `/rooms/${getRoomSlug(room.name)}?checkIn=${queryCheckIn}&checkOut=${queryCheckOut}&guests=${queryGuests}`;

                     return (
                      <Link 
                        key={room._id}
                        to={detailLink}
                        className="group bg-transparent rounded-none border-none outline-none flex flex-col hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* Image Panel */}
                        <div className="relative aspect-[4/3] w-full rounded-[24px] overflow-hidden bg-gray-100 shadow-sm">
                          <ImageCarousel images={room.images} roomName={room.name} />

                          {/* Wishlist Heart Icon Floating Top-Right */}
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(room._id);
                            }}
                            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white hover:scale-105 shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer border-none outline-none"
                          >
                            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-800'}`} />
                          </button>

                          {/* Premium Price Tag Badge Floating Bottom-Right */}
                          <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full tracking-wide">
                            ₹{room.price} <span className="text-[9px] font-medium text-white/80">/ {room.priceUnit || 'night'}</span>
                          </div>
                        </div>

                        {/* Description Panel */}
                        <div className="pt-4 flex-1 flex flex-col text-left">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
                            {room.name}
                          </h3>

                          <p className="text-sm text-gray-400 font-medium mt-0.5 mb-1.5">
                            {[room.city, room.country].filter(Boolean).join(', ') || 'Serenity Beach, India'}
                          </p>

                          <div className="flex items-center gap-1.5">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-3.5 h-3.5 ${
                                    star <= Math.round(room.rating || 5) 
                                      ? 'fill-amber-400 text-amber-400' 
                                      : 'text-gray-200'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 font-bold">
                              ({room.reviewCount > 0 ? room.reviewCount * 12 + 5 : 429} Visitors)
                            </span>
                          </div>

                          {roomTotal > 0 && (
                            <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase tracking-wide">
                              Total: ₹{roomTotal.toLocaleString()} for {totalNights} night{totalNights !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {/* Pagination */}
                {totalItems > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200/60 pt-8 mt-10 gap-4">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} stays
                    </div>
                    
                    {totalPages > 1 && (
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
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                      <span>Per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
                        className="bg-transparent border border-gray-200 rounded-lg py-1 px-1.5 text-gray-700 outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT side: Sidebar Filters */}
          <div className="hidden lg:block lg:col-span-4 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 sticky top-24">
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
            {renderFilterContent()}
          </div>

        </div>

      </div>

      {/* Floating Mobile Filter Trigger Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white hover:bg-black font-extrabold text-sm px-5 py-3.5 rounded-full shadow-[0_12px_32px_-6px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/10"
        >
          <SlidersHorizontal className="w-4 h-4 text-[#d9f969]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#d9f969] text-black text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />
          {/* Drawer Content */}
          <div className="relative w-[85%] max-w-sm h-full bg-white flex flex-col shadow-2xl animate-slide-in-right z-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <h2 className="text-base font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-violet-600" />
                Filters
              </h2>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-violet-600 hover:text-violet-700 font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-none bg-transparent"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {renderFilterContent()}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-gray-100 p-4 bg-gray-50/50">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-[#d9f969] hover:bg-[#cbf046] text-black font-extrabold py-4 px-6 rounded-2xl tracking-widest uppercase text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-none animate-none"
              >
                <span>Show stays</span>
                <span>({filteredRooms.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
