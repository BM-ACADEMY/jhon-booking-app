import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Search, Navigation, ChevronDown } from 'lucide-react';
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

  const formatDateLocal = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSearch = () => {
    const checkInStr = formatDateLocal(startDate);
    const checkOutStr = formatDateLocal(endDate);
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

  if (loading) return <div className="min-h-screen bg-gray-50" />;

  // Original background logic
  const videoSrc = hero?.videoUrl
    ? (hero.videoUrl.startsWith('http') ? hero.videoUrl : `${import.meta.env.VITE_BASE_URL}${hero.videoUrl}`)
    : null;
  const imageSrc = hero?.backgroundImage
    ? (hero.backgroundImage.startsWith('http') ? hero.backgroundImage : `${import.meta.env.VITE_BASE_URL}${hero.backgroundImage}`)
    : 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop';

  return (
    <>
      <section className="relative min-h-screen font-sans flex flex-col overflow-hidden bg-gray-100">
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
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Main Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex-1 flex flex-col items-center justify-center h-full">

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-[4rem] font-bold text-white leading-[1.1] tracking-tight mb-4 drop-shadow-md animate-reveal [animation-delay:200ms] opacity-0">
            <span className="text-white inline-block cursor-default">
              {hero?.titleLine1 || "Experience Luxury Like"}
            </span>
            <br />
            <span className="text-[#d9f969] inline-block cursor-default">
              {hero?.titleLine2 || "Never Before"}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/90 text-xs sm:text-sm max-w-2xl mx-auto mb-12 leading-relaxed font-medium tracking-wide drop-shadow-sm animate-reveal [animation-delay:400ms] opacity-0">
            {hero?.subtitle || "Discover our handpicked collection of world-class rooms and suites, designed for ultimate comfort and elegance."}
          </p>

          {/* Booking Bar */}
          <div className="bg-white rounded-[2.5rem] p-2 max-w-4xl w-full shadow-2xl flex flex-col md:flex-row items-center gap-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 animate-reveal [animation-delay:600ms] opacity-0 relative z-40">



            {/* Check‑In Date */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Check‑In</p>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setDateRange([date, endDate])}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  minDate={new Date()}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Check‑In"
                  className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer placeholder-gray-200"
                  popperProps={{ strategy: "fixed" }}
                  popperClassName="z-50"
                />
              </div>
            </div>
            {/* Check‑Out Date */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Check‑Out</p>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setDateRange([startDate, date])}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate || new Date()}
                  dateFormat="dd MMM yyyy"
                  placeholderText="Check‑Out"
                  className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer placeholder-gray-200"
                  popperProps={{ strategy: "fixed" }}
                  popperClassName="z-50"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 w-full group">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Guests</p>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer text-ellipsis truncate"
                >
                  <option value="" disabled hidden>Select Guests</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

          {/* Search Button */}
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
        </div>
      </section>


    </>
  );
};

export default HeroSection;
