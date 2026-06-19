import { useState, useEffect, useRef, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Search, Navigation, ChevronDown, Bell, X, AlertTriangle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../api';

const MainDateRangeInput = forwardRef(({ value, onClick, startDate, endDate }, ref) => {
  const formatDateDisplay = (date) => {
    if (!date) return 'Select date';
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
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 font-sans">Check‑In</p>
          <p className="text-xs font-semibold text-gray-900 font-sans whitespace-nowrap">
            {startDate ? formatDateDisplay(startDate) : "Select date"}
          </p>
        </div>
      </div>

      {/* Check-Out Column */}
      <div className="flex-1 flex items-center gap-3 px-4 py-2 group">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <CalendarDays className="w-5 h-5 text-gray-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 font-sans">Check‑Out</p>
          <p className="text-xs font-semibold text-gray-900 font-sans whitespace-nowrap">
            {endDate ? formatDateDisplay(endDate) : "Select date"}
          </p>
        </div>
      </div>
    </div>
  );
});
MainDateRangeInput.displayName = 'MainDateRangeInput';

const HeroSection = () => {
  const navigate = useNavigate();
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Unified Search State
  const [location, setLocation] = useState(() => sessionStorage.getItem('booking_location') || '');
  const [dateRange, setDateRange] = useState(() => {
    const startStr = sessionStorage.getItem('booking_start_date');
    const endStr = sessionStorage.getItem('booking_end_date');
    return [
      startStr ? new Date(startStr) : null,
      endStr ? new Date(endStr) : null
    ];
  });
  const [startDate, endDate] = dateRange;
  const [adults, setAdults] = useState(() => parseInt(sessionStorage.getItem('booking_adults')) || 1);
  const [children, setChildren] = useState(() => parseInt(sessionStorage.getItem('booking_children')) || 0);
  const [infants, setInfants] = useState(() => parseInt(sessionStorage.getItem('booking_infants')) || 0);
  const [roomsCount, setRoomsCount] = useState(() => parseInt(sessionStorage.getItem('booking_rooms')) || 1);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state changes with sessionStorage and broadcast to other components
  useEffect(() => {
    sessionStorage.setItem('booking_location', location);
    sessionStorage.setItem('booking_start_date', startDate ? startDate.toISOString() : '');
    sessionStorage.setItem('booking_end_date', endDate ? endDate.toISOString() : '');
    sessionStorage.setItem('booking_adults', adults.toString());
    sessionStorage.setItem('booking_children', children.toString());
    sessionStorage.setItem('booking_infants', infants.toString());
    sessionStorage.setItem('booking_rooms', roomsCount.toString());
    window.dispatchEvent(new Event('booking-search-sync'));
  }, [location, startDate, endDate, adults, children, infants, roomsCount]);

  // Listen to state changes from other components (like Navbar)
  useEffect(() => {
    const handleSync = () => {
      const loc = sessionStorage.getItem('booking_location') || '';
      const startStr = sessionStorage.getItem('booking_start_date');
      const endStr = sessionStorage.getItem('booking_end_date');
      const ad = parseInt(sessionStorage.getItem('booking_adults')) || 1;
      const ch = parseInt(sessionStorage.getItem('booking_children')) || 0;
      const inf = parseInt(sessionStorage.getItem('booking_infants')) || 0;
      const rm = parseInt(sessionStorage.getItem('booking_rooms')) || 1;

      if (loc !== location) setLocation(loc);
      const newStart = startStr ? new Date(startStr) : null;
      const newEnd = endStr ? new Date(endStr) : null;
      if (
        (newStart?.getTime() !== startDate?.getTime()) ||
        (newEnd?.getTime() !== endDate?.getTime())
      ) {
        setDateRange([newStart, newEnd]);
      }
      if (ad !== adults) setAdults(ad);
      if (ch !== children) setChildren(ch);
      if (inf !== infants) setInfants(inf);
      if (rm !== roomsCount) setRoomsCount(rm);
    };

    window.addEventListener('booking-search-sync', handleSync);
    return () => window.removeEventListener('booking-search-sync', handleSync);
  }, [location, startDate, endDate, adults, children, infants, roomsCount]);

  // Mobile Search Modal & Animation State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Desktop Guest Popover State
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const checkinPickerRef = useRef(null);
  const guestDropdownRef = useRef(null);
  const checkoutPickerRef = useRef(null);
  const mobileCheckoutPickerRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target)) {
        setIsGuestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Text Change Animation Timer (changes every 2.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev === 0 ? 1 : 0));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const formatDateLocal = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSearch = () => {
    if (!startDate || !endDate) {
      setErrorMsg("Please select check-in and check-out dates!");
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
    if (endDate <= startDate) {
      setErrorMsg("Check-out date must be after check-in date!");
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
    if (adults < 1) {
      setErrorMsg("Adults must be at least 1!");
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
    if (roomsCount < 1) {
      setErrorMsg("Rooms must be at least 1!");
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }

    setShowError(false);
    const checkInStr = formatDateLocal(startDate);
    const checkOutStr = formatDateLocal(endDate);
    setIsMobileSearchOpen(false);
    navigate(`/rooms?location=${location}&checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${adults}&children=${children}&infants=${infants}&rooms=${roomsCount}`);
  };

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const res = await api.get('/hero');
        setHero(res.data);
      } catch (err) {
        console.error('Error fetching hero:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, []);

  useEffect(() => {
    if (!hero?.slides || hero.slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % hero.slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hero?.slides]);

  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

  // Dynamic texts for the animated pill
  const dateText = startDate && endDate 
    ? `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'short' })}` 
    : 'Date range';
    
  const guestText = `${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}${infants > 0 ? `, ${infants} Infant${infants > 1 ? 's' : ''}` : ''} · ${roomsCount} Room${roomsCount > 1 ? 's' : ''}`;

  return (
    <>
      <section className="relative h-[420px] md:h-[480px] lg:h-[520px] rounded-b-[2.5rem] lg:rounded-b-none font-sans flex flex-col overflow-hidden lg:overflow-visible bg-gray-100 shadow-xl z-20">
        <style>{`
          @keyframes reveal {
            from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
          }
          .animate-reveal { animation: reveal 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

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


        {/* Dynamic Background Slideshow */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[2.5rem] lg:rounded-b-none">
          {hero?.slides && hero.slides.length > 0 ? (
            hero.slides.map((slide, index) => {
              const isCurrent = index === currentSlideIndex;
              const slideVidSrc = slide.videoUrl
                ? (slide.videoUrl.startsWith('http') ? slide.videoUrl : `${baseUrl}${slide.videoUrl}`)
                : null;
              const slideImgSrc = slide.backgroundImage
                ? (slide.backgroundImage.startsWith('http') ? slide.backgroundImage : `${baseUrl}${slide.backgroundImage}`)
                : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop';
              const slideMobileImgSrc = slide.mobileImage
                ? (slide.mobileImage.startsWith('http') ? slide.mobileImage : `${baseUrl}${slide.mobileImage}`)
                : null;

              return (
                <div
                  key={slide._id || index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isCurrent ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'}`}
                >
                  {slideVidSrc ? (
                    <video
                      key={slideVidSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover opacity-90 scale-105"
                    >
                      <source src={slideVidSrc} />
                    </video>
                  ) : (
                    <>
                      {slideMobileImgSrc ? (
                        <>
                          <img
                            src={slideImgSrc}
                            alt="Hero background"
                            className="hidden md:block w-full h-full object-cover scale-105 animate-fade-in"
                          />
                          <img
                            src={slideMobileImgSrc}
                            alt="Hero mobile background"
                            className="block md:hidden w-full h-full object-cover scale-105 animate-fade-in"
                          />
                        </>
                      ) : (
                        <img
                          src={slideImgSrc}
                          alt="Hero background"
                          className="w-full h-full object-cover scale-105 animate-fade-in"
                        />
                      )}
                    </>
                  )}
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              );
            })
          ) : (
            // Fallback default background if slides are empty
            <>
              <img
                src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop"
                alt="Hero background"
                className="w-full h-full object-cover scale-105"
              />
              <div className="absolute inset-0 bg-black/40" />
            </>
          )}
        </div>

        {/* Main Hero Content Container */}
        {/* CHANGED: pt-16 to pt-28 (sm:pt-32) to push content down slightly, and lg:pt-24 for small desktop height */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center h-full pt-28 sm:pt-32 lg:pt-24 pb-8 lg:pb-8">

          {/* ========================================= */}
          {/* COMMON TITLE & SUBTITLE (Visible on ALL)  */}
          {/* ========================================= */}
          <div 
            key={currentSlideIndex} 
            className="flex flex-col items-center w-full mb-5 lg:mb-8"
          >
            <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.15] tracking-tight mb-2.5 lg:mb-3.5 drop-shadow-md animate-reveal [animation-delay:200ms] opacity-0 text-center">
              <span className="text-white inline-block cursor-default">
                {(hero?.slides?.[currentSlideIndex] || hero)?.titleLine1 || "Experience Luxury Like"}
              </span>
              <br />
              <span className="text-[#d9f969] inline-block cursor-default">
                {(hero?.slides?.[currentSlideIndex] || hero)?.titleLine2 || "Never Before"}
              </span>
            </h1>

            <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-xl lg:max-w-2xl mx-auto leading-relaxed font-medium tracking-wide drop-shadow-sm animate-reveal [animation-delay:400ms] opacity-0 text-center px-2">
              {(hero?.slides?.[currentSlideIndex] || hero)?.subtitle || "Discover our handpicked collection of world-class rooms and suites, designed for ultimate comfort and elegance."}
            </p>


          </div>

          {/* ========================================= */}
          {/* MOBILE SEARCH PILL (Visible sm & md)      */}
          {/* ========================================= */}
          <div 
            onClick={() => setIsMobileSearchOpen(true)}
            className="lg:hidden w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-5 flex items-center gap-4 cursor-pointer shadow-2xl animate-reveal [animation-delay:600ms] opacity-0 transition-transform active:scale-95"
          >
            <Search className="w-6 h-6 text-white ml-2 opacity-80 shrink-0" />
            
            {/* Animated Text Container */}
            <div className="relative h-6 w-full flex items-center overflow-hidden text-left">
              <p 
                className={`absolute w-full text-white font-medium text-base transition-all duration-500 ease-in-out ${
                  tickerIndex === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
                }`}
              >
                {dateText}
              </p>
              <p 
                className={`absolute w-full text-white font-medium text-base transition-all duration-500 ease-in-out ${
                  tickerIndex === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
                }`}
              >
                {guestText}
              </p>
            </div>
          </div>

          {/* ========================================= */}
          {/* DESKTOP BOOKING BAR (Visible lg+)         */}
          {/* ========================================= */}
          <div className={`hidden lg:block lg:absolute lg:bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:translate-y-1/2 lg:z-40 w-full max-w-4xl px-4 lg:px-0 transition-all duration-300 ${scrolledPastThreshold ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
            <div className="bg-white rounded-[2.5rem] p-2 w-full shadow-2xl flex flex-row items-center gap-2 divide-x divide-gray-100 animate-reveal [animation-delay:600ms] opacity-0 relative z-40">
              
              {/* Date Range Picker containing both Check-In and Check-Out columns */}
              <div className="flex-[2] flex items-center">
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  minDate={new Date()}
                  monthsShown={2}
                  customInput={
                    <MainDateRangeInput 
                      startDate={startDate} 
                      endDate={endDate} 
                    />
                  }
                  popperProps={{ strategy: "fixed" }}
                  popperClassName="z-50"
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
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Guests & Rooms</p>
                  <div className="w-full text-xs font-bold text-gray-900 outline-none bg-transparent flex items-center justify-between">
                    <span>{adults} Adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}{infants > 0 ? `, ${infants} Infant${infants > 1 ? 's' : ''}` : ''}, {roomsCount} Room{roomsCount > 1 ? 's' : ''}</span>
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
                            onClick={() => setAdults(Math.max(1, adults - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{adults}</span>
                          <button 
                            onClick={() => setAdults(Math.min(10, adults + 1))}
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
                            onClick={() => setChildren(Math.max(0, children - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{children}</span>
                          <button 
                            onClick={() => setChildren(Math.min(10, children + 1))}
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
                            onClick={() => setInfants(Math.max(0, infants - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{infants}</span>
                          <button 
                            onClick={() => setInfants(Math.min(10, infants + 1))}
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
                            onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded bg-transparent hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors"
                          >
                            <span className="text-xl font-light leading-none">−</span>
                          </button>
                          <span className="w-4 text-center text-sm font-semibold text-gray-900">{roomsCount}</span>
                          <button 
                            onClick={() => setRoomsCount(Math.min(10, roomsCount + 1))}
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

              {/* Search Button */}
              <div className="px-2 w-full md:w-auto mt-2 md:mt-0 flex self-stretch py-1">
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-xs rounded-full px-6 py-2.5 flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 group cursor-pointer"
                >
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span>SEARCH</span>
                </button>
              </div>
            </div>

            {/* Error Banner below Desktop Booking Bar (placed on the left side with an upward pointing arrow - ultra compact size) */}
            {showError && (
              <div className="w-full relative z-30">
                <div className="absolute left-8 top-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] px-3 py-1.5 rounded-lg shadow-md animate-in fade-in slide-in-from-top-1 duration-300 w-fit flex items-center gap-1.5">
                  {/* Upward pointing indicator arrow */}
                  <div className="absolute -top-[4.5px] left-6 w-2 h-2 bg-[#FFFBEB] border-t border-l border-[#FDE68A] rotate-45"></div>
                  
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0 relative z-10" strokeWidth={2.5} />
                  <span className="font-semibold text-[11px] tracking-wide relative z-10">{errorMsg}</span>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </section>

      {/* ========================================= */}
      {/* MOBILE SEARCH MODAL (Triggered by Pill)   */}
      {/* ========================================= */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden">
          
          <div className="bg-white w-full rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative animate-reveal [animation-duration:300ms]">
            
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
                    selected={startDate}
                    onChange={(date) => {
                      setDateRange([date, null]);
                      setTimeout(() => {
                        if (mobileCheckoutPickerRef.current) {
                          mobileCheckoutPickerRef.current.setOpen(true);
                        }
                      }, 100);
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select date"
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                    popperProps={{ strategy: "fixed" }}
                    popperClassName="z-[110]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                <CalendarDays className="w-6 h-6 text-gray-400" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Check-Out</p>
                  <DatePicker
                    ref={mobileCheckoutPickerRef}
                    selected={endDate}
                    onChange={(date) => setDateRange([startDate, date])}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select date"
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                    popperProps={{ strategy: "fixed" }}
                    popperClassName="z-[110]"
                  />
                </div>
              </div>

              {/* Guests & Rooms in Mobile */}
              <div className="flex flex-col gap-3">
                {/* Adults */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">Adults</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">−</span>
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-gray-900">{adults}</span>
                    <button 
                      onClick={() => setAdults(Math.min(10, adults + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">+</span>
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">Children</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">−</span>
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-gray-900">{children}</span>
                    <button 
                      onClick={() => setChildren(Math.min(10, children + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">+</span>
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">Infants</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">−</span>
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-gray-900">{infants}</span>
                    <button 
                      onClick={() => setInfants(Math.min(10, infants + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">+</span>
                    </button>
                  </div>
                </div>

                {/* Rooms */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-800">Rooms</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">−</span>
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-gray-900">{roomsCount}</span>
                    <button 
                      onClick={() => setRoomsCount(Math.min(10, roomsCount + 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-blue-500 active:scale-95 transition-all"
                    >
                      <span className="text-xl font-light leading-none">+</span>
                    </button>
                  </div>
                </div>
              </div>

              {showError && (
                <div className="flex items-center gap-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] px-4 py-3.5 rounded-2xl shadow-md animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" strokeWidth={2} />
                  <span className="font-semibold text-xs">{errorMsg}</span>
                </div>
              )}

              <button
                onClick={handleSearch}
                className="w-full bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-sm rounded-2xl px-8 py-4 mt-2 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Search className="w-5 h-5" />
                <span>SEARCH</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeroSection;