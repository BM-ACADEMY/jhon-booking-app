import { useState, useEffect, useRef, forwardRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, BedDouble, Star, Users, Bath, ArrowRight, Loader2,
  MapPin, CalendarDays, Heart, ChevronLeft, ChevronRight, ChevronDown,
  Home, Trees, Tent, Warehouse, Compass, Building2, Waves,
  SlidersHorizontal, Check, X, Building, Hotel, Info, Maximize
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api, { getRoomSlug } from '../api';

import RoomCardSkeleton from '../components/RoomCardSkeleton';
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

const MainDateRangeInput = forwardRef(({ value, onClick, startDate, endDate }, ref) => {
  const formatDateDisplay = (date) => {
    if (!date) return 'Add Date';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div 
      ref={ref} 
      onClick={onClick} 
      className="flex-1 flex flex-row items-center divide-x divide-gray-100 cursor-pointer w-full"
    >
      {/* Check-In Column */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2 group">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <CalendarDays className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 font-sans">Check In</p>
          <p className="text-xs font-semibold text-gray-900 font-sans whitespace-nowrap">
            {startDate ? formatDateDisplay(startDate) : "Add Date"}
          </p>
        </div>
      </div>

      {/* Check-Out Column */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2 group">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <CalendarDays className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 font-sans">Check Out</p>
          <p className="text-xs font-semibold text-gray-900 font-sans whitespace-nowrap">
            {endDate ? formatDateDisplay(endDate) : "Add Date"}
          </p>
        </div>
      </div>
    </div>
  );
});
MainDateRangeInput.displayName = 'MainDateRangeInput';

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
  const queryCheckIn = searchParams.get('checkIn');
  const queryCheckOut = searchParams.get('checkOut');
  const queryAdults = searchParams.get('adults') || '1';
  const queryChildren = searchParams.get('children') || '0';
  const queryInfants = searchParams.get('infants') || '0';
  const queryRoomsCount = searchParams.get('roomsCount') || searchParams.get('rooms') || '1';

  // Search input states (local copy before clicking "Update Search")
  const [checkInInput, setCheckInInput] = useState(() => {
    const query = searchParams.get('checkIn');
    if (query) return parseLocalDate(query);
    const session = sessionStorage.getItem('booking_start_date');
    return session ? new Date(session) : null;
  });
  const [checkOutInput, setCheckOutInput] = useState(() => {
    const query = searchParams.get('checkOut');
    if (query) return parseLocalDate(query);
    const session = sessionStorage.getItem('booking_end_date');
    return session ? new Date(session) : null;
  });
  const [adultsInput, setAdultsInput] = useState(() => {
    const query = searchParams.get('adults');
    if (query) return parseInt(query, 10);
    const session = sessionStorage.getItem('booking_adults');
    return session ? parseInt(session, 10) : 1;
  });
  const [childrenInput, setChildrenInput] = useState(() => {
    const query = searchParams.get('children');
    if (query) return parseInt(query, 10);
    const session = sessionStorage.getItem('booking_children');
    return session ? parseInt(session, 10) : 0;
  });
  const [infantsInput, setInfantsInput] = useState(() => {
    const query = searchParams.get('infants');
    if (query) return parseInt(query, 10);
    const session = sessionStorage.getItem('booking_infants');
    return session ? parseInt(session, 10) : 0;
  });
  const [roomsCountInput, setRoomsCountInput] = useState(() => {
    const query = searchParams.get('roomsCount') || searchParams.get('rooms');
    if (query) return parseInt(query, 10);
    const session = sessionStorage.getItem('booking_rooms');
    return session ? parseInt(session, 10) : 1;
  });

  // Track scrolling to hide the hero booking bar when header search bar appears
  const [scrolledPastThreshold, setScrolledPastThreshold] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastThreshold(window.scrollY > 250);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync inputs with URL parameters changes (e.g. searching from Home Page)
  useEffect(() => {
    const qIn = queryCheckIn ? parseLocalDate(queryCheckIn) : null;
    const qOut = queryCheckOut ? parseLocalDate(queryCheckOut) : null;
    const startStr = sessionStorage.getItem('booking_start_date');
    const endStr = sessionStorage.getItem('booking_end_date');

    setCheckInInput(qIn || (startStr ? new Date(startStr) : null));
    setCheckOutInput(qOut || (endStr ? new Date(endStr) : null));

    const adVal = parseInt(queryAdults, 10) || parseInt(sessionStorage.getItem('booking_adults')) || 1;
    setAdultsInput(adVal);

    const chVal = parseInt(queryChildren, 10) || parseInt(sessionStorage.getItem('booking_children')) || 0;
    setChildrenInput(chVal);

    const infVal = parseInt(queryInfants, 10) || parseInt(sessionStorage.getItem('booking_infants')) || 0;
    setInfantsInput(infVal);

    const rmVal = parseInt(queryRoomsCount, 10) || parseInt(sessionStorage.getItem('booking_rooms')) || 1;
    setRoomsCountInput(rmVal);
  }, [queryCheckIn, queryCheckOut, queryAdults, queryChildren, queryInfants, queryRoomsCount]);

  // Sync state changes with sessionStorage and broadcast to other components (like Navbar)
  useEffect(() => {
    sessionStorage.setItem('booking_start_date', checkInInput ? checkInInput.toISOString() : '');
    sessionStorage.setItem('booking_end_date', checkOutInput ? checkOutInput.toISOString() : '');
    sessionStorage.setItem('booking_adults', adultsInput.toString());
    sessionStorage.setItem('booking_children', childrenInput.toString());
    sessionStorage.setItem('booking_infants', infantsInput.toString());
    sessionStorage.setItem('booking_rooms', roomsCountInput.toString());
    window.dispatchEvent(new Event('booking-search-sync'));
  }, [checkInInput, checkOutInput, adultsInput, childrenInput, infantsInput, roomsCountInput]);

  // Listen to state changes from other components (like Navbar)
  useEffect(() => {
    const handleSync = () => {
      const startStr = sessionStorage.getItem('booking_start_date');
      const endStr = sessionStorage.getItem('booking_end_date');
      const ad = parseInt(sessionStorage.getItem('booking_adults')) || 1;
      const ch = parseInt(sessionStorage.getItem('booking_children')) || 0;
      const inf = parseInt(sessionStorage.getItem('booking_infants')) || 0;
      const rm = parseInt(sessionStorage.getItem('booking_rooms')) || 1;

      const newStart = startStr ? new Date(startStr) : null;
      const newEnd = endStr ? new Date(endStr) : null;
      if (newStart?.getTime() !== checkInInput?.getTime()) {
        setCheckInInput(newStart);
      }
      if (newEnd?.getTime() !== checkOutInput?.getTime()) {
        setCheckOutInput(newEnd);
      }
      if (ad !== adultsInput) setAdultsInput(ad);
      if (ch !== childrenInput) setChildrenInput(ch);
      if (inf !== infantsInput) setInfantsInput(inf);
      if (rm !== roomsCountInput) setRoomsCountInput(rm);
    };

    window.addEventListener('booking-search-sync', handleSync);
    return () => window.removeEventListener('booking-search-sync', handleSync);
  }, [checkInInput, checkOutInput, adultsInput, childrenInput, infantsInput, roomsCountInput]);

  // Hero section data
  const [hero, setHero] = useState(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const checkinPickerRef = useRef(null);
  const guestDropdownRef = useRef(null);
  const checkoutPickerRef = useRef(null);
  const mobileCheckoutPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setIsGuestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const { user, toggleUserWishlist, setAuthModal } = useAuth();
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
    params.adults = adultsInput.toString();
    params.children = childrenInput.toString();
    params.infants = infantsInput.toString();
    params.roomsCount = roomsCountInput.toString();
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
      setAuthModal('login');
      return;
    }
    await toggleUserWishlist(id);
  };

  // Calculate nights
  const calculateNights = () => {
    if (queryCheckIn && queryCheckOut) {
      const start = parseLocalDate(queryCheckIn);
      const end = parseLocalDate(queryCheckOut);
      if (start && end && start <= end) {
        const diff = end - start;
        return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    return 0;
  };
  const totalNights = calculateNights();

  const getRoomPriceForDates = (roomObj, checkInStr, checkOutStr) => {
    if (!roomObj) return 0;

    const matchDate = (dbDate, targetDateStr) => {
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

    if (checkInStr && checkOutStr) {
      const start = parseLocalDate(checkInStr);
      const end = parseLocalDate(checkOutStr);
      if (start && end && start <= end) {
        let total = 0;
        let nightsCount = 0;
        const curr = new Date(start.getTime());
        while (curr <= end) {
          const yyyy = curr.getFullYear();
          const mm = String(curr.getMonth() + 1).padStart(2, '0');
          const dd = String(curr.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          let dayPrice = roomObj.price || 0;
          if (roomObj.datePrices && Array.isArray(roomObj.datePrices)) {
            const found = roomObj.datePrices.find(dp => matchDate(dp.date, dateStr));
            if (found) dayPrice = found.price;
          }
          total += dayPrice;
          nightsCount++;
          curr.setDate(curr.getDate() + 1);
        }
        return nightsCount > 0 ? Math.round(total / nightsCount) : roomObj.price || 0;
      }
    }

    if (checkInStr) {
      let dayPrice = roomObj.price || 0;
      if (roomObj.datePrices && Array.isArray(roomObj.datePrices)) {
        const found = roomObj.datePrices.find(dp => matchDate(dp.date, checkInStr));
        if (found) dayPrice = found.price;
      }
      return dayPrice;
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    let todayPrice = roomObj.price || 0;
    if (roomObj.datePrices && Array.isArray(roomObj.datePrices)) {
      const found = roomObj.datePrices.find(dp => matchDate(dp.date, todayStr));
      if (found) todayPrice = found.price;
    }
    return todayPrice;
  };

  const getRoomTotalForDates = (roomObj, checkInStr, checkOutStr) => {
    if (!roomObj || !checkInStr || !checkOutStr) return 0;
    const start = parseLocalDate(checkInStr);
    const end = parseLocalDate(checkOutStr);
    if (!start || !end || start > end) return 0;

    const matchDate = (dbDate, targetDateStr) => {
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

    let total = 0;
    const curr = new Date(start.getTime());
    while (curr <= end) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let dayPrice = roomObj.price || 0;
      if (roomObj.datePrices && Array.isArray(roomObj.datePrices)) {
        const found = roomObj.datePrices.find(dp => matchDate(dp.date, dateStr));
        if (found) dayPrice = found.price;
      }
      total += dayPrice;
      curr.setDate(curr.getDate() + 1);
    }
    return total;
  };

  const getAvailableRoomCount = (roomObj, checkInStr, checkOutStr) => {
    if (!roomObj) return 0;
    if (checkInStr && checkOutStr) {
      const start = parseLocalDate(checkInStr);
      const end = parseLocalDate(checkOutStr);
      if (roomObj.unavailableDates && roomObj.unavailableDates.length > 0) {
        const hasOverlap = roomObj.unavailableDates.some(dateStr => {
          const unavailableDate = new Date(dateStr);
          return unavailableDate >= start && unavailableDate <= end;
        });
        if (hasOverlap) return 0;
      }
    }
    return 1; // Each Room in database is a single villa/unit
  };

  // Advanced Local Filtering
  // Helper to check if a combination of rooms can accommodate the guests
  const canAccommodateCombination = (roomsList, adults, children) => {
    const n = roomsList.length;
    if (adults < n) return false;

    const backtrack = (index, remainingAdults, remainingChildren) => {
      if (index === n) {
        return remainingAdults === 0 && remainingChildren === 0;
      }

      const room = roomsList[index];
      const maxAd = (room.maxAdults !== undefined && room.maxAdults !== null) ? room.maxAdults : (room.guests || 2);
      const maxCh = (room.maxChildren !== undefined && room.maxChildren !== null) ? room.maxChildren : 0;
      const maxTotalGuests = (room.guests !== undefined && room.guests !== null) ? room.guests : (maxAd + maxCh);

      const upperA = Math.min(maxAd, remainingAdults);
      for (let a = 1; a <= upperA; a++) {
        if (a > maxTotalGuests) continue;
        const maxChForThisRoom = maxCh + (maxAd - a);
        const upperC = Math.min(maxChForThisRoom, maxTotalGuests - a, remainingChildren);
        for (let c = 0; c <= upperC; c++) {
          if (backtrack(index + 1, remainingAdults - a, remainingChildren - c)) {
            return true;
          }
        }
      }
      return false;
    };

    return backtrack(0, adults, children);
  };


  const isRoomInValidCombination = (room, pool, roomsCount, adults, children) => {
    // Instead of combining with *any* different room (which usually results in all rooms matching),
    // we check if `roomsCount` copies of this specific room capacity can hold the guests.
    // This gives much more accurate and intuitive filtering results.
    const combination = Array(roomsCount).fill(room);
    return canAccommodateCombination(combination, adults, children);
  };

  const basicFilteredPool = rooms.filter(room => {
    // 1. Category Pill Filter
    if (activeCategory !== 'All' && room.category !== activeCategory) return false;

    // 2. Price range
    if (minPrice !== '' && room.price < parseFloat(minPrice)) return false;
    if (maxPrice !== '' && room.price > parseFloat(maxPrice)) return false;

    // 3. Rooms & Beds count
    if (filterBedrooms !== 'Any') {
      const count = parseInt(filterBedrooms.replace('+', ''), 10);
      if (filterBedrooms.includes('+')) {
        if (room.bedrooms < count) return false;
      } else {
        if (room.bedrooms !== count) return false;
      }
    }
    if (filterBeds !== 'Any') {
      const count = parseInt(filterBeds.replace('+', ''), 10);
      if (filterBeds.includes('+')) {
        if (room.beds < count) return false;
      } else {
        if (room.beds !== count) return false;
      }
    }
    if (filterBathrooms !== 'Any') {
      const count = parseInt(filterBathrooms.replace('+', ''), 10);
      if (filterBathrooms.includes('+')) {
        if (room.bathrooms < count) return false;
      } else {
        if (room.bathrooms !== count) return false;
      }
    }

    // 4. Date availability
    if (queryCheckIn && queryCheckOut) {
      const availableCount = getAvailableRoomCount(room, queryCheckIn, queryCheckOut);
      if (availableCount < 1) return false;
    }

    return true;
  });

  const searchAdults = parseInt(queryAdults, 10) || 1;
  const searchChildren = parseInt(queryChildren, 10) || 0;
  const requestedRoomsCount = parseInt(queryRoomsCount, 10) || 1;

  const filteredRooms = basicFilteredPool.filter(room => {
    const res = isRoomInValidCombination(room, basicFilteredPool, requestedRoomsCount, searchAdults, searchChildren);
    console.log(`[Filter Debug] Room: "${room.name}" | searchAdults: ${searchAdults} | searchChildren: ${searchChildren} | roomsCount: ${requestedRoomsCount} | maxAdults: ${room.maxAdults} | maxChildren: ${room.maxChildren} | Match Result: ${res}`);
    return res;
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
    activeCategory, queryCheckIn, queryCheckOut, queryAdults, queryChildren, queryRoomsCount,
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
  const firstSlide = hero?.slides?.[0];
  const heroVideoSrc = firstSlide?.videoUrl
    ? (firstSlide.videoUrl.startsWith('http') ? firstSlide.videoUrl : `${SERVER_URL}${firstSlide.videoUrl}`)
    : (hero?.videoUrl
        ? (hero.videoUrl.startsWith('http') ? hero.videoUrl : `${SERVER_URL}${hero.videoUrl}`)
        : null);

  const heroImageSrc = firstSlide?.backgroundImage
    ? (firstSlide.backgroundImage.startsWith('http') ? firstSlide.backgroundImage : `${SERVER_URL}${firstSlide.backgroundImage}`)
    : (hero?.backgroundImage
        ? (hero.backgroundImage.startsWith('http') ? hero.backgroundImage : `${SERVER_URL}${hero.backgroundImage}`)
        : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop');

  const heroMobileImageSrc = firstSlide?.mobileImage
    ? (firstSlide.mobileImage.startsWith('http') ? firstSlide.mobileImage : `${SERVER_URL}${firstSlide.mobileImage}`)
    : null;

  const dateText = checkInInput && checkOutInput
    ? `${checkInInput.getDate()} ${checkInInput.toLocaleString('default', { month: 'short' })} – ${checkOutInput.getDate()} ${checkOutInput.toLocaleString('default', { month: 'short' })}`
    : 'Add your dates';
  const guestText = `${adultsInput} Adult${adultsInput > 1 ? 's' : ''}${childrenInput > 0 ? `, ${childrenInput} Child${childrenInput > 1 ? 'ren' : ''}` : ''}${infantsInput > 0 ? `, ${infantsInput} Infant${infantsInput > 1 ? 's' : ''}` : ''} · ${roomsCountInput} Room${roomsCountInput > 1 ? 's' : ''}`;  const renderFilterContent = () => (
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
        <section className="relative h-[220px] md:h-[260px] lg:h-[300px] font-sans flex flex-col bg-gray-900 rounded-b-[2.5rem] lg:rounded-b-none lg:overflow-visible shadow-xl">
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

            /* Custom DatePicker Styling */
            .react-datepicker-wrapper { width: 100%; }
            .react-datepicker-popper { z-index: 9999 !important; }
            .react-datepicker {
              font-family: inherit;
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0;
              border-radius: 1rem;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
              color: #1e293b;
              padding: 0.5rem;
            }
            .react-datepicker__header {
              background-color: transparent;
              border-bottom: 1px solid #f1f5f9;
            }
            .react-datepicker__current-month { color: #1e293b; font-weight: 700; }
            .react-datepicker__day-name { color: #64748b; font-weight: 600; }
            .react-datepicker__day { color: #334155; border-radius: 0.5rem; }
            .react-datepicker__day:hover { background-color: #f1f5f9; }
            .react-datepicker__day--today {
              border: none !important;
              outline: none !important;
              font-weight: bold !important;
            }
            .react-datepicker__day--selected,
            .react-datepicker__day--range-start,
            .react-datepicker__day--range-end,
            .react-datepicker__day--selecting-range-start,
            .react-datepicker__day--selecting-range-end {
              background-color: #beeb15 !important;
              color: #000000 !important;
              font-weight: 800 !important;
              border-radius: 0.5rem !important;
            }
            .react-datepicker__day--in-range,
            .react-datepicker__day--in-selecting-range {
              background-color: #e6f7a8 !important;
              color: #000000 !important;
              font-weight: 700 !important;
              border-radius: 0 !important;
            }
            .react-datepicker__day--range-start,
            .react-datepicker__day--selecting-range-start {
              border-top-left-radius: 0.5rem !important;
              border-bottom-left-radius: 0.5rem !important;
            }
            .react-datepicker__day--range-end,
            .react-datepicker__day--selecting-range-end {
              border-top-right-radius: 0.5rem !important;
              border-bottom-right-radius: 0.5rem !important;
            }
          `}</style>


          {/* Background — overflow-hidden + matching radius so image clips to curved bottom */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[2.5rem] lg:rounded-b-none">
            {heroVideoSrc ? (
              <video key={heroVideoSrc} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-90">
                <source src={heroVideoSrc} />
              </video>
            ) : (
              <>
                {heroMobileImageSrc ? (
                  <>
                    <img src={heroImageSrc} alt="Rooms hero desktop" className="hidden md:block w-full h-full object-cover" />
                    <img src={heroMobileImageSrc} alt="Rooms hero mobile" className="block md:hidden w-full h-full object-cover" />
                  </>
                ) : (
                  <img src={heroImageSrc} alt="Rooms hero" className="w-full h-full object-cover" />
                )}
              </>
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
            <div className={`hidden lg:block lg:absolute lg:bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-1/2 lg:z-40 w-full max-w-4xl px-4 lg:px-0 transition-all duration-300 ${scrolledPastThreshold ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
              <div className="bg-white rounded-[2.5rem] p-2 w-full shadow-2xl flex flex-row items-center gap-2 divide-x divide-gray-100 rooms-reveal-d3 relative z-40">

              {/* Date Range Picker containing both Check-In and Check-Out columns */}
              <div className="flex-[2] flex items-center">
                <DatePicker
                  selectsRange={true}
                  startDate={checkInInput}
                  endDate={checkOutInput}
                  onChange={(update) => {
                    const [start, end] = update;
                    setCheckInInput(start);
                    setCheckOutInput(end);
                  }}
                  minDate={new Date()}
                  monthsShown={2}
                  customInput={
                    <MainDateRangeInput 
                      startDate={checkInInput} 
                      endDate={checkOutInput} 
                    />
                  }
                  popperPlacement="bottom-start"
                  popperProps={{ strategy: 'fixed', modifiers: [{ name: 'flip', enabled: false }, { name: 'preventOverflow', options: { mainAxis: false } }] }}
                  popperClassName="z-[200]"
                />
              </div>


              {/* Guests & Rooms */}
              <div 
                className="flex-[1.4] flex items-center gap-3 px-4 py-2 group relative cursor-pointer" 
                ref={guestDropdownRef}
                onClick={() => setIsGuestDropdownOpen(!isGuestDropdownOpen)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Guests & Rooms</p>
                  <div className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent flex items-center justify-between">
                     <span>{adultsInput} Adult{adultsInput > 1 ? 's' : ''}{childrenInput > 0 ? `, ${childrenInput} Child${childrenInput > 1 ? 'ren' : ''}` : ''}{infantsInput > 0 ? `, ${infantsInput} Infant${infantsInput > 1 ? 's' : ''}` : ''}, {roomsCountInput} Room{roomsCountInput > 1 ? 's' : ''}</span>
                     <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isGuestDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isGuestDropdownOpen && (
                  <div 
                    className="absolute top-full right-0 mt-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Adults</span>
                        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-md p-0.5">
                          <button
                            onClick={() => setAdultsInput(Math.max(1, adultsInput - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{adultsInput}</span>
                          <button
                            onClick={() => setAdultsInput(Math.min(10, adultsInput + 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Children</span>
                        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-md p-0.5">
                          <button
                            onClick={() => setChildrenInput(Math.max(0, childrenInput - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{childrenInput}</span>
                          <button
                            onClick={() => setChildrenInput(Math.min(10, childrenInput + 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Infants</span>
                        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-md p-0.5">
                          <button
                            onClick={() => setInfantsInput(Math.max(0, infantsInput - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{infantsInput}</span>
                          <button
                            onClick={() => setInfantsInput(Math.min(10, infantsInput + 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Rooms */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Rooms</span>
                        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-md p-0.5">
                          <button
                            onClick={() => setRoomsCountInput(Math.max(1, roomsCountInput - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{roomsCountInput}</span>
                          <button
                            onClick={() => setRoomsCountInput(Math.min(10, roomsCountInput + 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search button */}
              <div className="px-2 flex self-stretch py-1">
                <button
                  onClick={handleUpdateSearch}
                  className="w-full bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-xs rounded-full px-6 py-2.5 flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 group cursor-pointer"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>SEARCH</span>
                </button>
              </div>
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
                      onChange={(date) => {
                        setCheckInInput(date);
                        setCheckOutInput(null);
                        setTimeout(() => {
                          if (mobileCheckoutPickerRef.current) {
                            mobileCheckoutPickerRef.current.setOpen(true);
                          }
                        }, 100);
                      }}
                      selectsStart startDate={checkInInput} endDate={checkOutInput}
                      minDate={new Date()} dateFormat="dd MMM yyyy" placeholderText="Select date"
                      className="w-full text-xs font-semibold text-gray-900 bg-transparent outline-none cursor-pointer"
                      popperProps={{ strategy: 'fixed' }} popperClassName="z-[110]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <CalendarDays className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Check-Out</p>
                    <DatePicker
                      ref={mobileCheckoutPickerRef}
                      selected={checkOutInput}
                      onChange={(date) => setCheckOutInput(date)}
                      selectsEnd startDate={checkInInput} endDate={checkOutInput}
                      minDate={checkInInput || new Date()} dateFormat="dd MMM yyyy" placeholderText="Select date"
                      className="w-full text-xs font-semibold text-gray-900 bg-transparent outline-none cursor-pointer"
                      popperProps={{ strategy: 'fixed' }} popperClassName="z-[110]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Users className="w-6 h-6 text-gray-400" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Adults</p>
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => setAdultsInput(Math.max(1, adultsInput - 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">−</span>
                      </button>
                      <span className="w-4 text-center text-[15px] font-bold text-gray-900">{adultsInput}</span>
                      <button onClick={() => setAdultsInput(Math.min(10, adultsInput + 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">+</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Users className="w-6 h-6 text-gray-400" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Children</p>
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => setChildrenInput(Math.max(0, childrenInput - 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">−</span>
                      </button>
                      <span className="w-4 text-center text-[15px] font-bold text-gray-900">{childrenInput}</span>
                      <button onClick={() => setChildrenInput(Math.min(10, childrenInput + 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">+</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Users className="w-6 h-6 text-gray-400" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Infants</p>
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => setInfantsInput(Math.max(0, infantsInput - 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">−</span>
                      </button>
                      <span className="w-4 text-center text-[15px] font-bold text-gray-900">{infantsInput}</span>
                      <button onClick={() => setInfantsInput(Math.min(10, infantsInput + 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">+</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <Home className="w-6 h-6 text-gray-400" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rooms</p>
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => setRoomsCountInput(Math.max(1, roomsCountInput - 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">−</span>
                      </button>
                      <span className="w-4 text-center text-[15px] font-bold text-gray-900">{roomsCountInput}</span>
                      <button onClick={() => setRoomsCountInput(Math.min(10, roomsCountInput + 1))} className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent hover:bg-gray-50 text-gray-500 transition-colors">
                        <span className="text-2xl font-light leading-none">+</span>
                      </button>
                    </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 lg:mt-20">

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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RoomCardSkeleton key={i} />
                ))}
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
                    const roomTotal = getRoomTotalForDates(room, queryCheckIn, queryCheckOut);

                    // Create search-preserving state/query for Room Detail redirection
                    const detailLink = `/rooms/${getRoomSlug(room.name)}?checkIn=${queryCheckIn || ''}&checkOut=${queryCheckOut || ''}&adults=${queryAdults}&children=${queryChildren}&roomsCount=${queryRoomsCount}`;

                      return (
                      <Link
                        key={room._id}
                        to={detailLink}
                        className="group bg-white rounded-[32px] border border-gray-100 p-3 flex flex-col shadow-xl hover:border-gray-200/80 transition-all duration-350"
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
                          <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full tracking-wide flex items-center gap-1.5 shadow-sm">
                            <span className="font-bold mr-1">₹{getRoomPriceForDates(room, queryCheckIn, queryCheckOut).toLocaleString('en-IN')}</span>
                            <span className="text-[9px] font-medium text-white/80">/ {totalNights > 0 ? 'night avg' : (room.priceUnit || 'night')}</span>
                          </div>
                        </div>

                        {/* Description Panel */}
                        <div className="pt-4 pb-2 px-2 flex-1 flex flex-col text-left">
                          <div className="mb-2">
                            <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full">
                              {room.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
                            {room.name}
                          </h3>

                          <p className="text-sm text-gray-400 font-medium mt-0.5 mb-2">
                            {room.address || `${[room.city, room.country].filter(Boolean).join(', ') || 'Serenity Beach, India'}`}
                          </p>

                          <div className="flex items-center gap-1.5 mb-3">
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
                              ({room.visitorsCount || 0} Visitors)
                            </span>
                          </div>

                          {roomTotal > 0 && (
                            <p className="text-[10px] text-gray-400 font-bold mt-1.5 mb-3 uppercase tracking-wide">
                              Total: ${roomTotal.toLocaleString()} for {totalNights} night{totalNights !== 1 ? 's' : ''}
                            </p>
                          )}

                          {/* Specs Row */}
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 border-t border-gray-100 pt-3.5 mt-auto text-xs text-gray-500 font-bold">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span>
                                Max: {(room.maxAdults !== undefined && room.maxAdults !== null)
                                  ? room.maxAdults
                                  : (room.guests || 2)} Adults
                                {((room.maxChildren !== undefined && room.maxChildren !== null)
                                  ? room.maxChildren
                                  : 0) > 0
                                  ? `   ${room.maxChildren} Children`
                                  : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                              <span>{room.bedrooms || 1} Bed{room.bedrooms > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Bath className="w-3.5 h-3.5 text-gray-400" />
                              <span>{room.bathrooms || 1} Bath{room.bathrooms > 1 ? 's' : ''}</span>
                            </div>
                            {room.size && (
                              <div className="flex items-center gap-1.5">
                                <Maximize className="w-3.5 h-3.5 text-gray-400" />
                                <span>{room.size}</span>
                              </div>
                            )}
                          </div>


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
          <div className="hidden lg:block lg:col-span-4 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 sticky top-34">
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
