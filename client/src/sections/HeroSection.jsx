import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Search, Navigation, ChevronDown, Bell, X, AlertTriangle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../api';

const HeroSection = () => {
  const navigate = useNavigate();
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);

  // Unified Search State
  const [location, setLocation] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [guests, setGuests] = useState('');
  const [showError, setShowError] = useState(false);

  // Mobile Search Modal & Animation State
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

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
    if (!startDate || !endDate || !guests) {
      setShowError(true);
      // Auto-hide the validation error banner after exactly 3 seconds
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    setShowError(false);
    const checkInStr = formatDateLocal(startDate);
    const checkOutStr = formatDateLocal(endDate);
    setIsMobileSearchOpen(false);
    navigate(`/rooms?location=${location}&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guests}`);
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



  const videoSrc = hero?.videoUrl
    ? (hero.videoUrl.startsWith('http') ? hero.videoUrl : `${import.meta.env.VITE_BASE_URL}${hero.videoUrl}`)
    : null;
  const imageSrc = hero?.backgroundImage
    ? (hero.backgroundImage.startsWith('http') ? hero.backgroundImage : `${import.meta.env.VITE_BASE_URL}${hero.backgroundImage}`)
    : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop';

  // Dynamic texts for the animated pill
  const dateText = startDate && endDate 
    ? `${startDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('default', { month: 'short' })}` 
    : 'Date range';
    
  const guestText = guests 
    ? `${guests} Guest${guests > 1 ? 's' : ''}` 
    : 'Number of guests';

  return (
    <>
      <section className="relative h-[450px] md:h-[500px] lg:min-h-screen rounded-b-[2.5rem] lg:rounded-b-none font-sans flex flex-col overflow-hidden bg-gray-100 shadow-xl">
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
          .react-datepicker__day--selected, .react-datepicker__day--in-range {
            background-color: #d9f969 !important;
            color: #000;
            font-weight: 600;
          }
          .react-datepicker__day--in-selecting-range { background-color: #ecfccb !important; }
        `}</style>

        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          {videoSrc ? (
            <video
              key={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-90 scale-105"
            >
              <source src={videoSrc} />
            </video>
          ) : (
            <img
              src={imageSrc}
              alt="Hero background"
              className="w-full h-full object-cover scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Main Hero Content Container */}
        {/* CHANGED: pt-16 to pt-28 (sm:pt-32) to push content down slightly */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center items-center h-full pt-28 sm:pt-32 lg:pt-0 pb-8 lg:pb-0">

          {/* ========================================= */}
          {/* COMMON TITLE & SUBTITLE (Visible on ALL)  */}
          {/* ========================================= */}
          <div className="flex flex-col items-center w-full mb-6 lg:mb-12">
            <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-[4rem] font-bold text-white leading-[1.15] tracking-tight mb-3 lg:mb-4 drop-shadow-md animate-reveal [animation-delay:200ms] opacity-0 text-center">
              <span className="text-white inline-block cursor-default">
                {hero?.titleLine1 || "Experience Luxury Like"}
              </span>
              <br />
              <span className="text-[#d9f969] inline-block cursor-default">
                {hero?.titleLine2 || "Never Before"}
              </span>
            </h1>

            <p className="text-white/90 text-xs sm:text-sm md:text-base max-w-xl lg:max-w-2xl mx-auto leading-relaxed font-medium tracking-wide drop-shadow-sm animate-reveal [animation-delay:400ms] opacity-0 text-center px-2">
              {hero?.subtitle || "Discover our handpicked collection of world-class rooms and suites, designed for ultimate comfort and elegance."}
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
          <div className="hidden lg:flex bg-white rounded-[2.5rem] p-2 max-w-4xl w-full shadow-2xl flex-col md:flex-row items-center gap-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 animate-reveal [animation-delay:600ms] opacity-0 relative z-40">
            
            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setDateRange([date, endDate])}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={new Date()}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Check‑In"
                  className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer placeholder-gray-400"
                  popperProps={{ strategy: "fixed" }}
                  popperClassName="z-50"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setDateRange([startDate, date])}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || new Date()}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Check‑Out"
                  className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer placeholder-gray-400"
                  popperProps={{ strategy: "fixed" }}
                  popperClassName="z-50"
                />
              </div>
            </div>

            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full group">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-400 outline-none bg-transparent cursor-pointer text-ellipsis truncate"
                >
                  <option value="" disabled hidden>Select Guests</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-2 w-full md:w-auto mt-2 md:mt-0 flex self-stretch py-1">
              <button
                onClick={handleSearch}
                className="w-full md:w-auto bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-sm rounded-full px-8 py-4 flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95 group"
              >
                <Search className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>SEARCH</span>
              </button>
            </div>
          </div>

          {/* Error Banner below Desktop Booking Bar (placed on the left side with an upward pointing arrow - ultra compact size) */}
          {showError && (
            <div className="hidden lg:block w-full max-w-4xl relative z-30">
              <div className="absolute left-8 top-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] px-3 py-1.5 rounded-lg shadow-md animate-in fade-in slide-in-from-top-1 duration-300 w-fit flex items-center gap-1.5">
                {/* Upward pointing indicator arrow */}
                <div className="absolute -top-[4.5px] left-6 w-2 h-2 bg-[#FFFBEB] border-t border-l border-[#FDE68A] rotate-45"></div>
                
                <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0 relative z-10" strokeWidth={2.5} />
                <span className="font-semibold text-[11px] tracking-wide relative z-10">Please select check-in, check-out dates and guest count!</span>
              </div>
            </div>
          )}
          
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
                    onChange={(date) => setDateRange([date, endDate])}
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

              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                <Users className="w-6 h-6 text-gray-400" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Guests</p>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="" disabled hidden>Select Guests</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showError && (
                <div className="flex items-center gap-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] px-4 py-3.5 rounded-2xl shadow-md animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" strokeWidth={2} />
                  <span className="font-semibold text-xs">Please select check-in, check-out dates and guest count!</span>
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