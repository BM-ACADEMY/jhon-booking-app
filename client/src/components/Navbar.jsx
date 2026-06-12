import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Hotel,
  Menu,
  X,
  LogOut,
  User,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Heart,
  CalendarDays,
  Search,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Rooms", to: "/rooms" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setAuthModal } = useAuth();

  const isRoomDetailPage = (location.pathname.startsWith("/rooms/") && location.pathname !== "/rooms") || location.pathname === "/mybookings" || location.pathname === "/wishlist" || location.pathname === "/profile";
  const isHeaderScrolled = scrolled || isRoomDetailPage;

  // Sync search state with sessionStorage / Hero section
  const [locationState, setLocationState] = useState(() => sessionStorage.getItem('booking_location') || '');
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

  const [isNavGuestDropdownOpen, setIsNavGuestDropdownOpen] = useState(false);
  const [showSearchInHeader, setShowSearchInHeader] = useState(false);

  const navGuestDropdownRef = useRef(null);
  const navCheckinPickerRef = useRef(null);
  const navCheckoutPickerRef = useRef(null);

  // Sync state changes with sessionStorage and broadcast to other components
  useEffect(() => {
    sessionStorage.setItem('booking_location', locationState);
    sessionStorage.setItem('booking_start_date', startDate ? startDate.toISOString() : '');
    sessionStorage.setItem('booking_end_date', endDate ? endDate.toISOString() : '');
    sessionStorage.setItem('booking_adults', adults.toString());
    sessionStorage.setItem('booking_children', children.toString());
    sessionStorage.setItem('booking_infants', infants.toString());
    sessionStorage.setItem('booking_rooms', roomsCount.toString());
    window.dispatchEvent(new Event('booking-search-sync'));
  }, [locationState, startDate, endDate, adults, children, infants, roomsCount]);

  // Listen to state changes from other components (like HeroSection)
  useEffect(() => {
    const handleSync = () => {
      const loc = sessionStorage.getItem('booking_location') || '';
      const startStr = sessionStorage.getItem('booking_start_date');
      const endStr = sessionStorage.getItem('booking_end_date');
      const ad = parseInt(sessionStorage.getItem('booking_adults')) || 1;
      const ch = parseInt(sessionStorage.getItem('booking_children')) || 0;
      const inf = parseInt(sessionStorage.getItem('booking_infants')) || 0;
      const rm = parseInt(sessionStorage.getItem('booking_rooms')) || 1;

      if (loc !== locationState) setLocationState(loc);
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
  }, [locationState, startDate, endDate, adults, children, infants, roomsCount]);

  // Close guest dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navGuestDropdownRef.current && !navGuestDropdownRef.current.contains(event.target)) {
        setIsNavGuestDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateLocal = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    const checkInStr = formatDateLocal(startDate);
    const checkOutStr = formatDateLocal(endDate);
    navigate(`/rooms?location=${locationState}&checkIn=${checkInStr}&checkOut=${checkOutStr}&adults=${adults}&children=${children}&infants=${infants}&rooms=${roomsCount}`);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const isSearchablePage = location.pathname === '/' || location.pathname === '/rooms';
      setShowSearchInHeader(isSearchablePage && window.scrollY > 250);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
  }, [location]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none outline-none border-none">
      <div
        className={`pointer-events-auto max-w-7xl mx-auto transition-all duration-500 ease-out border rounded-full ${isHeaderScrolled
          ? "bg-white/90 backdrop-blur-[4px] backdrop-saturate-150 border-gray-300/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.8)] py-3 px-6 lg:px-8"
          : "bg-transparent border-transparent py-2 px-4 lg:px-6 shadow-none"
          }`}
      >
        <div className="flex items-center justify-between h-12 lg:h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 flex-shrink-0 z-50 group outline-none border-none"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isHeaderScrolled
                ? "bg-gray-900 shadow-md"
                : "bg-white/20 backdrop-blur-md group-hover:bg-white/30"
                }`}
            >
              <Hotel
                className={`w-5 h-5 transition-colors ${isHeaderScrolled ? "text-white" : "text-white"}`}
              />
            </div>
            <div className="leading-tight flex-shrink-0 whitespace-nowrap">
              <p
                className={`font-bold text-[15px] tracking-wide transition-colors whitespace-nowrap ${isHeaderScrolled ? "text-gray-900" : "text-white"
                  }`}
              >
                The Balified Villa
              </p>
              <p
                className={`text-[10px] uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${isHeaderScrolled ? "text-gray-500" : "text-white/70"
                  }`}
              >
                Luxury Hotel
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links / Compact Search Bar */}
          {showSearchInHeader ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hidden lg:flex bg-transparent max-w-3xl w-full items-center gap-1.5 divide-x divide-gray-200/50"
            >
              {/* Check-In */}
              <div 
                className="flex-[1.2] flex items-center gap-2 px-3 py-1.5 w-full group cursor-pointer"
                onClick={() => navCheckinPickerRef.current?.setOpen(true)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">Check‑In</p>
                  <DatePicker
                    ref={navCheckinPickerRef}
                    selected={startDate}
                    onChange={(date) => {
                      setDateRange([date, null]);
                      setTimeout(() => {
                        if (navCheckoutPickerRef.current) {
                          navCheckoutPickerRef.current.setOpen(true);
                        }
                      }, 100);
                    }}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select date"
                    className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer placeholder-gray-400 leading-tight"
                    popperProps={{ strategy: "fixed" }}
                    popperClassName="z-50"
                  />
                </div>
              </div>

              {/* Check-Out */}
              <div 
                className="flex-[1.2] flex items-center gap-2 px-3 py-1.5 w-full group cursor-pointer"
                onClick={() => navCheckoutPickerRef.current?.setOpen(true)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">Check‑Out</p>
                  <DatePicker
                    ref={navCheckoutPickerRef}
                    selected={endDate}
                    onChange={(date) => setDateRange([startDate, date])}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Select date"
                    className="w-full text-xs font-semibold text-gray-900 outline-none bg-transparent cursor-pointer placeholder-gray-400 leading-tight"
                    popperProps={{ strategy: "fixed" }}
                    popperClassName="z-50"
                  />
                </div>
              </div>

              {/* Guests & Rooms */}
              <div 
                className="flex-[1.4] flex items-center gap-2 px-3 py-1.5 w-full group relative cursor-pointer" 
                ref={navGuestDropdownRef}
                onClick={() => setIsNavGuestDropdownOpen(!isNavGuestDropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">Guests & Rooms</p>
                  <div className="w-full text-xs font-bold text-gray-900 outline-none bg-transparent flex items-center justify-between mt-0.5">
                    <span>{adults} Adult{adults > 1 ? 's' : ''}{children > 0 ? `, ${children} Child${children > 1 ? 'ren' : ''}` : ''}{infants > 0 ? `, ${infants} Infant${infants > 1 ? 's' : ''}` : ''}, {roomsCount} Room{roomsCount > 1 ? 's' : ''}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isNavGuestDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isNavGuestDropdownOpen && (
                  <div 
                    className="absolute top-full right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 cursor-default"
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
              <div className="px-2 w-full md:w-auto mt-0 flex self-stretch py-0.5">
                <button
                  onClick={handleSearch}
                  className="w-full md:w-auto bg-[#d9f969] hover:bg-[#cbf046] text-black font-bold uppercase tracking-widest text-[10px] rounded-full px-5 py-2.5 flex items-center justify-center gap-1.5 transition-all hover:shadow active:scale-95 group"
                >
                  <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300" />
                  <span>SEARCH</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map(({ label, to }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`text-sm font-medium transition-all relative group tracking-wider outline-none ${isHeaderScrolled
                      ? active
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                      : active
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                      }`}
                  >
                    {label}
                    <span
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-[3px] w-[3px] rounded-full transition-all duration-300 ${active
                        ? "opacity-100 bg-current scale-100"
                        : "opacity-0 bg-current scale-0 group-hover:opacity-50 group-hover:scale-100"
                        }`}
                    />
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Desktop Right Section */}
          <div className="hidden lg:flex items-center gap-5">
            {user ? (
              <div
                className="relative"
                ref={dropdownRef}
                onMouseEnter={() => setUserDropdown(true)}
                onMouseLeave={() => setUserDropdown(false)}
              >
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border outline-none transition-all duration-300 ${isHeaderScrolled
                    ? "border-gray-200/80 hover:border-gray-300 bg-white/60 hover:bg-white"
                    : "border-white/20 hover:border-white/40 bg-white/10 backdrop-blur-md"
                    }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isHeaderScrolled
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-900"
                      }`}
                  >
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span
                    className={`text-sm font-medium ${isHeaderScrolled ? "text-gray-800" : "text-white"}`}
                  >
                    {user.name?.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${userDropdown ? "rotate-180" : ""
                      } ${isHeaderScrolled ? "text-gray-500" : "text-white/60"}`}
                  />
                </button>

                <div className="absolute top-full left-0 w-full h-6 bg-transparent" />

                <AnimatePresence>
                  {userDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-[calc(100%+1.25rem)] w-64 bg-white/95 backdrop-blur-3xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-gray-100 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-6 py-4 border-b border-gray-100/80 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-2 px-2 space-y-1">
                        {user.role === 'admin' ? (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all outline-none"
                          >
                            <User className="w-4 h-4" /> Dashboard
                          </Link>
                        ) : (
                          <>
                            <Link
                              to="/profile"
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all outline-none"
                            >
                              <User className="w-4 h-4" /> Profile
                            </Link>
                            <Link
                              to="/mybookings"
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all outline-none"
                            >
                              <CalendarCheck className="w-4 h-4" /> My Bookings
                            </Link>
                            <Link
                              to="/wishlist"
                              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all outline-none"
                            >
                              <Heart className="w-4 h-4" /> Wishlist
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="border-t border-gray-100/80 pt-2 px-2 pb-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-red-500 hover:text-red-700 hover:bg-red-50 transition-all outline-none"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAuthModal('login')}
                  className={`text-sm font-medium tracking-wide transition-colors outline-none cursor-pointer bg-transparent border-none ${isHeaderScrolled
                    ? "text-gray-600 hover:text-gray-900"
                    : "text-white/80 hover:text-white"
                    }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModal('register')}
                  className={`text-sm font-medium px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl outline-none cursor-pointer ${isHeaderScrolled
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-900 hover:bg-gray-100"
                    }`}
                >
                  Book Now
                </button>
              </div>
            )}
          </div>

          {/* MAIN HEADER HAMBURGER */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`lg:hidden p-2.5 rounded-full outline-none transition-all relative ${isHeaderScrolled
              ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
              : "bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              }`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Off-Canvas Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden pointer-events-auto"
            />

            {/* DRAWER */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-2 left-2 bottom-2 w-[calc(100vw-1rem)] max-w-[360px] bg-[#f4f6f8] rounded-[32px] shadow-2xl z-[70] flex flex-col pt-6 pb-6 px-6 lg:hidden pointer-events-auto"
            >
              {/* Close Icon */}
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 transition-all duration-300 hover:rotate-90 hover:scale-105 outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hide-scrollbar">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-4 px-2">
                  Navigation
                </p>
                <nav className="space-y-1">
                  {navLinks.map(({ label, to }) => {
                    const active = location.pathname === to;
                    return (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center justify-between py-3.5 px-5 rounded-[18px] transition-all outline-none ${active
                          ? "bg-[#0f172a] text-white font-medium shadow-md"
                          : "text-gray-600 font-medium hover:bg-gray-200/50 hover:text-gray-900"
                          }`}
                      >
                        <span className="tracking-wide text-[15px]">
                          {label}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 ${active ? "text-white/70" : "text-gray-300"}`}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* USER CARD COMPONENT AT BOTTOM */}
              <div className="mt-auto pt-4">
                {user ? (
                  <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100/50">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-[#0f172a] truncate">
                          {user.name}
                        </p>
                        <p className="text-[13px] text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 px-1">
                      {user.role === 'admin' ? (
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors outline-none"
                        >
                          <User className="w-[18px] h-[18px] text-gray-400" />{" "}
                          Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors outline-none"
                          >
                            <User className="w-[18px] h-[18px] text-gray-400" />{" "}
                            Profile
                          </Link>
                          <Link
                            to="/mybookings"
                            className="flex items-center gap-3 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors outline-none"
                          >
                            <CalendarCheck className="w-[18px] h-[18px] text-gray-400" />{" "}
                            My Bookings
                          </Link>
                          <Link
                            to="/wishlist"
                            className="flex items-center gap-3 text-[14px] font-medium text-gray-600 hover:text-gray-900 transition-colors outline-none"
                          >
                            <Heart className="w-[18px] h-[18px] text-gray-400" />{" "}
                            Wishlist
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-[14px] font-medium text-red-500 hover:text-red-600 transition-colors mt-6 outline-none"
                      >
                        <LogOut className="w-[18px] h-[18px]" /> Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-white rounded-[24px] p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100/50">
                    <button
                      onClick={() => { setAuthModal('login'); setMenuOpen(false); }}
                      className="flex items-center justify-center w-full py-3.5 rounded-[16px] text-[15px] text-gray-700 font-medium border border-gray-200 hover:bg-gray-50 transition-all tracking-wide outline-none cursor-pointer bg-white"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthModal('register'); setMenuOpen(false); }}
                      className="flex items-center justify-center w-full py-3.5 rounded-[16px] bg-[#0f172a] text-white text-[15px] font-medium shadow-md hover:shadow-lg hover:bg-gray-800 transition-all tracking-wide outline-none cursor-pointer border-none"
                    >
                      Book a Room
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
