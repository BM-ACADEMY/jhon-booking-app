import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, Search, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../api';

const HeroSection = () => {
  const [hero, setHero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(new Date(Date.now() + 86400000));
  const [guests, setGuests] = useState('2');

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

  if (loading) return <div className="min-h-screen bg-gray-950" />;

  const videoSrc = hero?.videoUrl 
    ? (hero.videoUrl.startsWith('http') ? hero.videoUrl : `${import.meta.env.VITE_BASE_URL || 'http://localhost:5000'}${hero.videoUrl}`) 
    : null;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-reveal { animation: reveal 1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .shimmer-text {
          background: linear-gradient(90deg, #d4891f, #f3c178, #d4891f);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .letter-spacing-custom {
          letter-spacing: -0.02em;
          transition: letter-spacing 0.5s ease;
        }
        .letter-spacing-custom:hover {
          letter-spacing: 0.05em;
        }

        /* Custom DatePicker Styling */
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker-popper { z-index: 100 !important; }
        .react-datepicker {
          font-family: inherit;
          background-color: #0f172a !important; /* Fully opaque */
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: white;
          padding: 1rem;
        }
        .react-datepicker__header {
          background-color: transparent;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .react-datepicker__current-month, .react-datepicker__day-name {
          color: white;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.7rem;
        }
        .react-datepicker__day {
          color: #94a3b8;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }
        .react-datepicker__day:hover {
          background-color: #d4891f !important;
          color: white;
          transform: scale(1.1);
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
          background-color: #d4891f !important;
          color: white;
          font-weight: bold;
        }
        .react-datepicker__day--disabled {
          color: #334155;
        }
        .react-datepicker__navigation--next, .react-datepicker__navigation--previous {
          top: 1.5rem;
        }
      `}</style>

      {/* Background Video or Gradient */}
      <div className="absolute inset-0 z-0">
        {videoSrc ? (
          <video
            key={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-50 scale-105"
          >
            <source src={videoSrc} />
          </video>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-slate-800" />
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-950/20 to-gray-950" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-primary-300 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] px-6 py-2 rounded-full mb-10 backdrop-blur-xl animate-float shadow-2xl">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
          The Ultimate Escape
        </div>

        {/* Headline */}
        <div className="mb-10 space-y-4 relative z-10">
          <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black text-white leading-[0.9] animate-reveal [animation-delay:200ms] opacity-0 overflow-hidden">
            <span className="inline-block hover:scale-105 transition-transform duration-500 cursor-default">Experience</span>
            <br />
            <span className="shimmer-text inline-block letter-spacing-custom cursor-default">
              {hero?.title ? hero.title.split(' ').slice(-2).join(' ') : 'Luxury Living'}
            </span>
          </h1>
        </div>

        <p className="text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto mb-14 leading-relaxed font-light tracking-wide animate-reveal [animation-delay:400ms] opacity-0 italic relative z-10">
          {hero?.subtitle || 'A place where elegance meets comfort. Discover the art of luxury in every detail of our handpicked suites.'}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20 animate-reveal [animation-delay:600ms] opacity-0 relative z-10">
          <Link
            to="/rooms"
            className="group relative bg-primary-600 text-white font-black px-12 py-5 rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10 uppercase tracking-widest text-xs">{hero?.ctaPrimaryText || 'Reserve Now'}</span>
          </Link>
          <Link
            to="/rooms"
            className="group border border-white/20 hover:border-white/60 text-white font-bold px-12 py-5 rounded-2xl backdrop-blur-md transition-all hover:bg-white/5 hover:scale-105 active:scale-95"
          >
            <span className="uppercase tracking-widest text-xs group-hover:tracking-[0.2em] transition-all duration-500">{hero?.ctaSecondaryText || 'Discover'}</span>
          </Link>
        </div>

        {/* Booking bar */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-3 sm:p-5 max-w-5xl mx-auto shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] animate-reveal [animation-delay:800ms] opacity-0 relative z-40">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-3 bg-white/90 hover:bg-white rounded-[2rem] px-6 py-4 flex items-center gap-4 transition-all hover:shadow-xl group">
              <CalendarDays className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Check In</p>
                <DatePicker
                  selected={checkIn}
                  onChange={(date) => setCheckIn(date)}
                  selectsStart
                  startDate={checkIn}
                  endDate={checkOut}
                  minDate={new Date()}
                  dateFormat="dd MMM yyyy"
                  className="w-full text-sm font-bold text-gray-900 outline-none bg-transparent cursor-pointer"
                  popperProps={{ strategy: "fixed" }}
                />
              </div>
            </div>
            <div className="md:col-span-3 bg-white/90 hover:bg-white rounded-[2rem] px-6 py-4 flex items-center gap-4 transition-all hover:shadow-xl group">
              <CalendarDays className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Check Out</p>
                <DatePicker
                  selected={checkOut}
                  onChange={(date) => setCheckOut(date)}
                  selectsEnd
                  startDate={checkIn}
                  endDate={checkOut}
                  minDate={checkIn}
                  dateFormat="dd MMM yyyy"
                  className="w-full text-sm font-bold text-gray-900 outline-none bg-transparent cursor-pointer"
                  popperProps={{ strategy: "fixed" }}
                />
              </div>
            </div>
            <div className="md:col-span-3 bg-white/90 hover:bg-white rounded-[2rem] px-6 py-4 flex items-center gap-4 transition-all hover:shadow-xl group">
              <Users className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
              <div className="flex-1 text-left">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Guests</p>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full text-sm font-bold text-gray-900 outline-none bg-transparent cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="md:col-span-3">
              <button className="w-full h-full bg-primary-600 hover:bg-primary-500 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all hover:shadow-2xl active:scale-95 group">
                <Search className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                <span className="uppercase tracking-widest text-xs">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-10 sm:gap-20 mt-20 relative z-10">
          {(hero?.stats && hero.stats.length > 0 ? hero.stats : [
            { value: '500+', label: 'Luxury Stays' },
            { value: '24', label: 'Premium Suites' },
            { value: '4.9★', label: 'Guest Rating' },
          ]).map(({ value, label }, idx) => (
            <div key={idx} className="text-center group animate-reveal opacity-0" style={{ animationDelay: `${1 + (idx * 0.1)}s` }}>
              <p className="text-3xl sm:text-4xl font-black text-white group-hover:shimmer-text transition-all duration-500">{value}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">{label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Explore</p>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
