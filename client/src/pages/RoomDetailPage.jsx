import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  ArrowLeft, Star, Users, BedDouble, Bath, MapPin, Wifi, Check,
  ChevronLeft, ChevronRight, ChevronDown, Loader2, Calendar, Share2, Heart, Shield, Maximize,
  MessageSquare, Sparkles, Wind, MoreVertical, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../api';

// Import Lightbox and its CSS
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const SERVER_URL = import.meta.env.VITE_BASE_URL;

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const getIcon = (name) => Icons[name] || Icons.Check;

const RoomSelectDropdown = ({ value, onChange, options, getImageUrl, placeholder = "Choose a room..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedRoom = options.find(r => r._id === value);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white hover:bg-gray-50 border border-gray-300 rounded-xl p-2.5 flex items-center justify-between text-xs font-semibold text-gray-800 outline-none transition-colors cursor-pointer text-left shadow-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedRoom ? (
            <>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                {selectedRoom.images?.length > 0 ? (
                  <img src={getImageUrl(selectedRoom.images[0])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Icons.BedDouble className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
              <span className="truncate">{selectedRoom.name} (₹{selectedRoom.price}/night)</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <Icons.ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto py-1">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">No rooms available</div>
          ) : (
            options.map(r => (
              <button
                key={r._id}
                type="button"
                onClick={() => {
                  onChange(r._id);
                  setIsOpen(false);
                }}
                className="w-full hover:bg-gray-50 px-3 py-2 flex items-center gap-2.5 text-left transition-colors border-b border-gray-100 last:border-none cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  {r.images?.length > 0 ? (
                    <img src={getImageUrl(r.images[0])} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Icons.BedDouble className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-800 truncate">{r.name}</div>
                  <div className="text-[11px] font-semibold text-gray-500">₹{r.price}/night</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, toggleUserWishlist } = useAuth();
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const isWishlisted = user?.wishlist?.includes(room?._id) || false;

  // Modals & Interactivity
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openHighlight, setOpenHighlight] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Mobile Booking Bottom Sheet State
  const [showMobileBooking, setShowMobileBooking] = useState(false);

  // All Reviews Modal States
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [loadedReviewsCount, setLoadedReviewsCount] = useState(10);

  useEffect(() => {
    if (showAllReviewsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAllReviewsModal]);

  const getPlainText = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDisplayDate = (dateStr, locales = 'en-US', options = {}) => {
    if (!dateStr) return '';
    const localDate = parseLocalDate(dateStr);
    return localDate ? localDate.toLocaleDateString(locales, options) : '';
  };

  const getQueryParam = (name) => {
    const val = searchParams.get(name);
    return (val === 'null' || val === 'undefined') ? '' : (val || '');
  };

  const checkInQuery = getQueryParam('checkIn');
  const checkOutQuery = getQueryParam('checkOut');
  const adultsQuery = parseInt(getQueryParam('adults') || getQueryParam('guests') || '1', 10);
  const childrenQuery = parseInt(getQueryParam('children') || '0', 10);
  const infantsQuery = parseInt(getQueryParam('infants') || '0', 10);
  const roomsCountQuery = parseInt(getQueryParam('roomsCount') || getQueryParam('rooms') || '1', 10);

  const [checkIn, setCheckIn] = useState(checkInQuery);
  const [checkOut, setCheckOut] = useState(checkOutQuery);
  const [adults, setAdults] = useState(adultsQuery);
  const [children, setChildren] = useState(childrenQuery);
  const [infants, setInfants] = useState(infantsQuery);
  const [roomsCount, setRoomsCount] = useState(roomsCountQuery);

  const [allRooms, setAllRooms] = useState([]);
  const [selectedAdditionalRooms, setSelectedAdditionalRooms] = useState([]);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [activeSelectType, setActiveSelectType] = useState('checkIn'); // 'checkIn' or 'checkOut'

  useEffect(() => {
    setSelectedAdditionalRooms(prev => {
      const needed = Math.max(0, roomsCount - 1);
      const next = [...prev];
      if (next.length > needed) {
        return next.slice(0, needed);
      }
      while (next.length < needed) {
        next.push('');
      }
      return next;
    });
  }, [roomsCount]);

  const getDatesInRangeList = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const date = new Date(start.getTime());
    const dates = [];
    while (date <= end) {
      dates.push(new Date(date.getTime()));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const getAvailableOtherRooms = () => {
    if (!room || !allRooms) return [];
    const otherPublished = allRooms.filter(r => r._id !== room._id && r.status === 'published');
    if (!checkIn || !checkOut) return otherPublished;

    const start = parseLocalDate(checkIn);
    const end = parseLocalDate(checkOut);
    if (!start || !end) return otherPublished;
    const requestedDates = getDatesInRangeList(start, end);

    return otherPublished.filter(r => {
      const hasOverlap = r.unavailableDates && r.unavailableDates.some(unDate => {
        const uDate = new Date(unDate);
        return requestedDates.some(reqDate => uDate.toDateString() === reqDate.toDateString());
      });
      return !hasOverlap;
    });
  };

  const availableOtherRooms = getAvailableOtherRooms();

  useEffect(() => {
    if (!room) return;
    const maxAdultsAllowed = ((room.maxAdults !== undefined && room.maxAdults !== null) ? room.maxAdults : (room.guests || 10)) * roomsCount;
    if (adults > maxAdultsAllowed) {
      setAdults(maxAdultsAllowed);
    }
    const maxChildrenAllowed = ((room.maxChildren !== undefined && room.maxChildren !== null) ? room.maxChildren : 10) * roomsCount;
    if (children > maxChildrenAllowed) {
      setChildren(maxChildrenAllowed);
    }
  }, [roomsCount, room]);

  const isDateBooked = (date) => {
    if (!room || !room.unavailableDates) return false;
    return room.unavailableDates.some(d => {
      const unDate = new Date(d);
      return unDate.getFullYear() === date.getFullYear() &&
             unDate.getMonth() === date.getMonth() &&
             unDate.getDate() === date.getDate();
    });
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  };

  const handleDateClick = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (activeSelectType === 'checkIn') {
      setCheckIn(dateStr);
      setCheckOut('');
      setActiveSelectType('checkOut');
    } else {
      if (!checkIn) {
        setCheckIn(dateStr);
        setActiveSelectType('checkOut');
      } else if (dateStr < checkIn) {
        setCheckIn(dateStr);
        setCheckOut('');
        setActiveSelectType('checkOut');
      } else {
        const localCheckInDate = parseLocalDate(checkIn);
        const datesInRange = getDatesInRangeList(localCheckInDate, date);
        const hasBookedOverlap = datesInRange.some(d => isDateBooked(d));

        if (hasBookedOverlap) {
          toast.error("Dates already booked. Try another Date.");
          setCheckIn(dateStr);
          setCheckOut('');
          setActiveSelectType('checkOut');
        } else {
          setCheckOut(dateStr);
          setShowCalendarModal(false);
        }
      }
    }
  };

  useEffect(() => {
    if (checkInQuery) setCheckIn(checkInQuery);
    if (checkOutQuery) setCheckOut(checkOutQuery);
    if (getQueryParam('adults') || getQueryParam('guests')) {
      setAdults(parseInt(getQueryParam('adults') || getQueryParam('guests') || '1', 10));
    }
    if (getQueryParam('children')) {
      setChildren(parseInt(getQueryParam('children') || '0', 10));
    }
    if (getQueryParam('infants')) {
      setInfants(parseInt(getQueryParam('infants') || '0', 10));
    }
    if (getQueryParam('roomsCount')) {
      setRoomsCount(parseInt(getQueryParam('roomsCount') || '1', 10));
    }
  }, [checkInQuery, checkOutQuery, searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [roomRes, reviewsRes, allRoomsRes] = await Promise.all([
          api.get(`/rooms/${id}`),
          api.get(`/reviews/room/${id}`),
          api.get('/rooms')
        ]);
        const fetchedRoom = roomRes.data;
        setRoom(fetchedRoom);
        setReviews(reviewsRes.data);
        setAllRooms(allRoomsRes.data || []);

        // Record room visit
        let visitorId = localStorage.getItem('room_visitor_id');
        if (!visitorId) {
          visitorId = 'visitor_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('room_visitor_id', visitorId);
        }

        try {
          const visitRes = await api.post(`/rooms/${fetchedRoom._id}/visit`, {
            visitorId,
            userId: user?._id || null
          });
          if (visitRes.data?.success) {
            setRoom(prev => prev ? { ...prev, visitorsCount: visitRes.data.visitorsCount } : null);
          }
        } catch (visitErr) {
          console.error('Failed to log room visit:', visitErr);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?._id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-[#FCE83A]" />
    </div>
  );

  if (!room) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <BedDouble className="w-16 h-16 text-gray-300" />
      <p className="text-gray-500 font-bold">Property not found.</p>
      <Link to="/rooms" className="text-gray-900 font-black text-sm hover:underline">← Back to Rooms</Link>
    </div>
  );

  const images = room.images?.length > 0 ? room.images : [];
  const displayImages = images.slice(0, 5);
  const remainingCount = images.length - 5;
  const lightboxSlides = images.map(img => ({ src: getImageUrl(img) }));

  const renderMainPageReviewCard = (rev) => {
    const roundedRating = Math.round(rev.rating);
    return (
      <div key={rev._id} className="flex flex-col gap-3">
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-[15px] overflow-hidden border border-gray-200 flex-shrink-0">
            {rev.user?.avatar ? (
              <img src={getImageUrl(rev.user.avatar)} alt={rev.userName} className="w-full h-full object-cover" />
            ) : (
              rev.userName?.charAt(0).toUpperCase() || 'G'
            )}
          </div>
          <div>
            <span className="font-bold text-gray-900 text-[15px] block leading-snug">{rev.userName}</span>
            <span className="text-[13px] text-gray-500 font-medium block leading-normal">
              {rev.booking ? 'Verified stay' : 'Guest'}
            </span>
          </div>
        </div>

        {/* Stars and Date Row */}
        <div className="flex items-center gap-2 text-[13px] mb-0.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < roundedRating ? 'text-[#f3db01] fill-[#FCE83A]' : 'text-gray-300 fill-transparent'}`}
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-gray-300 font-normal select-none">•</span>
          <span className="text-gray-500 font-medium">
            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Truncated Comment with robust CSS fallback */}
        <p
          className="text-gray-600 text-[14px] leading-relaxed line-clamp-3 overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {rev.comment}
        </p>
      </div>
    );
  };

  const renderReviewCard = (rev, index) => (
    <div key={rev._id} className={`pt-6 ${index === 0 ? 'pt-0 border-0' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 text-sm overflow-hidden border border-gray-200 flex-shrink-0">
            {rev.user?.avatar ? (
              <img src={getImageUrl(rev.user.avatar)} alt={rev.userName} className="w-full h-full object-cover" />
            ) : (
              rev.userName?.charAt(0).toUpperCase() || 'G'
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{rev.userName}</span>
              {rev.booking && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-100">
                  <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} /> Verified Stay
                </span>
              )}
            </div>

            {/* Stars and Date Row on the Top Left Side */}
            <div className="flex items-center gap-2 text-[12px] mt-0.5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(rev.rating) ? 'text-[#f3db01] fill-[#FCE83A]' : 'text-gray-300 fill-transparent'}`}
                    strokeWidth={2}
                  />
                ))}
              </div>
              <span className="text-gray-300 font-normal select-none">•</span>
              <span className="text-gray-400 font-medium">
                {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>


      <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-line">{rev.comment}</p>

      {/* Review Images */}
      {rev.images && rev.images.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mt-3">
          {rev.images.map((imgUrl, imgIdx) => (
            <div key={imgIdx} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95 transition-all">
              <img
                src={getImageUrl(imgUrl)}
                alt={`Guest upload ${imgIdx}`}
                className="w-full h-full object-cover"
                onClick={() => {
                  const u = getImageUrl(imgUrl);
                  window.open(u, '_blank');
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

  const formatCompactPrice = (price) => {
    if (price >= 10000000) return `${(price / 10000000).toFixed(price % 10000000 === 0 ? 0 : 1)}Cr`;
    if (price >= 100000) return `${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)}L`;
    if (price >= 1000) return `${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}K`;
    return price.toString();
  };

  const getTodayPrice = (roomObj) => {
    if (!roomObj) return 0;
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

  const calculateDynamicStats = () => {
    const stats = {
      communication: 0,
      cleanliness: 0,
      comfort: 0,
      facilities: 0
    };
    if (!reviews || reviews.length === 0) {
      return [
        { label: 'Communication', score: 0.0, percent: '0%' },
        { label: 'Cleanliness', score: 0.0, percent: '0%' },
        { label: 'Comfort', score: 0.0, percent: '0%' },
        { label: 'Facilities', score: 0.0, percent: '0%' }
      ];
    }
    reviews.forEach(r => {
      if (r.ratings) {
        stats.communication += r.ratings.communication || 0;
        stats.cleanliness += r.ratings.cleanliness || 0;
        stats.comfort += r.ratings.comfort || 0;
        stats.facilities += r.ratings.facilities || 0;
      }
    });

    const count = reviews.length;
    const commAvg = Math.round((stats.communication / count) * 10) / 10;
    const cleanAvg = Math.round((stats.cleanliness / count) * 10) / 10;
    const comfAvg = Math.round((stats.comfort / count) * 10) / 10;
    const facAvg = Math.round((stats.facilities / count) * 10) / 10;

    return [
      { label: 'Communication', score: commAvg, percent: `${(commAvg / 5) * 100}%` },
      { label: 'Cleanliness', score: cleanAvg, percent: `${(cleanAvg / 5) * 100}%` },
      { label: 'Comfort', score: comfAvg, percent: `${(comfAvg / 5) * 100}%` },
      { label: 'Facilities', score: facAvg, percent: `${(facAvg / 5) * 100}%` }
    ];
  };

  const dynamicStats = calculateDynamicStats();

  const renderMonthCalendar = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    // Month details
    const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // First day of month
    const firstDay = new Date(year, month, 1).getDay();

    // Total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Weekdays S M T W T F S
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Generate days array
    const dayCells = [];

    // Empty cells for first day padding
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<div key={`pad-${i}`} className="w-12 h-12" />);
    }

    // Days numbers
    for (let day = 1; day <= totalDays; day++) {
      const thisDate = new Date(year, month, day);
      const isPast = isDateInPast(thisDate);
      const isBooked = isDateBooked(thisDate);
      const isDisabled = isPast || isBooked;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckIn = checkIn === dateStr;
      const isCheckOut = checkOut === dateStr;

      // Determine if date is inside selected range
      let inRange = false;
      if (checkIn && checkOut) {
        inRange = dateStr > checkIn && dateStr < checkOut;
      } else if (checkIn && hoveredDate) {
        inRange = dateStr > checkIn && dateStr <= hoveredDate;
      }

      // Check if day is hovered
      const isHovered = hoveredDate === dateStr;

      // Find date price
      let dayPrice = room.price || 0;
      if (room.datePrices && Array.isArray(room.datePrices)) {
        const found = room.datePrices.find(dp => matchDate(dp.date, dateStr));
        if (found) dayPrice = found.price;
      }

      // Class names for styling
      let dayBtnClass = "w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-xs transition-all relative border border-transparent ";

      if (isDisabled) {
        dayBtnClass += "text-gray-300 cursor-not-allowed ";
        if (isBooked) {
          dayBtnClass += "line-through grayscale ";
        }
      } else if (isCheckIn || isCheckOut) {
        dayBtnClass += "bg-[#708090] text-white shadow-md z-10 scale-105 border-[#708090] ";
      } else if (inRange) {
        dayBtnClass += "bg-[#708090]/15 text-gray-900 font-bold border-[#708090]/10 ";
        if (isHovered) {
          dayBtnClass += "bg-[#708090]/30 ";
        }
      } else {
        dayBtnClass += "text-gray-800 hover:bg-gray-100 hover:scale-105 hover:border-gray-200 cursor-pointer ";
      }

      dayCells.push(
        <div
          key={`day-${day}`}
          className="relative w-12 h-12 flex items-center justify-center"
          onMouseEnter={() => !isDisabled && checkIn && !checkOut && setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={() => !isDisabled && handleDateClick(thisDate)}
        >
          <button
            type="button"
            disabled={isDisabled}
            className={`${dayBtnClass} py-0.5`}
          >
            <span className="font-bold leading-none">{day}</span>
            {!isDisabled && (
              <span className={`text-[8px] font-black mt-0.5 leading-none ${isCheckIn || isCheckOut ? 'text-white/80' : 'text-[#708090]'}`}>
                ₹{formatCompactPrice(dayPrice)}
              </span>
            )}
          </button>
        </div>
      );
    }

    // Determine navigation buttons to render (only render prev on left calendar, next on right, etc.)
    const isLeftCalendar = month === currentMonth.getMonth();

    return (
      <div className="flex flex-col gap-4">
        {/* Month Header with optional Arrow Nav */}
        <div className="flex items-center justify-between px-2">
          {isLeftCalendar ? (
            <button
              type="button"
              onClick={() => {
                const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                const today = new Date();
                today.setDate(1);
                today.setHours(0,0,0,0);
                if (prev >= today || (currentMonth.getMonth() !== today.getMonth() || currentMonth.getFullYear() !== today.getFullYear())) {
                  setCurrentMonth(prev);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-700"
            >
              <Icons.ChevronLeft className="w-5 h-5" />
            </button>
          ) : <div className="w-9 h-9" />}

          <span className="font-bold text-gray-900 text-[15px] sm:text-base">
            {monthName}
          </span>

          {!isLeftCalendar ? (
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-700"
            >
              <Icons.ChevronRight className="w-5 h-5" />
            </button>
          ) : <div className="w-9 h-9 md:hidden">
            {/* On mobile, only left calendar is shown, so show next month arrow on it */}
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
              }}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-700"
            >
              <Icons.ChevronRight className="w-5 h-5" />
            </button>
          </div>}
        </div>

        {/* Weekday Grid */}
        <div className="grid grid-cols-7 text-center font-bold text-xs text-gray-400 mb-1">
          {weekdays.map((day, idx) => (
            <div key={idx} className="h-6 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {dayCells}
        </div>
      </div>
    );
  };

  const getBookingPriceBreakdown = (room, checkInStr, checkOutStr, additionalRoomIds = []) => {
    if (!room || !checkInStr || !checkOutStr) return { total: 0, average: room?.price || 0, nights: 0, breakdown: [] };
    const start = parseLocalDate(checkInStr);
    const end = parseLocalDate(checkOutStr);
    if (!start || !end || start > end) return { total: 0, average: room?.price || 0, nights: 0, breakdown: [] };

    // Get all room objects in the booking combination
    const selectedRooms = [room];
    additionalRoomIds.forEach(id => {
      if (id) {
        const found = allRooms.find(r => r._id === id);
        if (found) selectedRooms.push(found);
      }
    });

    let total = 0;
    const breakdown = [];
    const curr = new Date(start.getTime());

    while (curr <= end) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // Sum prices of all selected rooms for this day
      let dayTotal = 0;
      selectedRooms.forEach(r => {
        let rPrice = r.price || 0;
        if (r.datePrices && Array.isArray(r.datePrices)) {
          const found = r.datePrices.find(dp => matchDate(dp.date, dateStr));
          if (found) rPrice = found.price;
        }
        dayTotal += rPrice;
      });

      total += dayTotal;
      breakdown.push({ dateStr, price: dayTotal });

      curr.setDate(curr.getDate() + 1);
    }

    return {
      total,
      average: breakdown.length > 0 ? Math.round(total / breakdown.length) : selectedRooms.reduce((sum, r) => sum + (r.price || 0), 0),
      nights: breakdown.length,
      breakdown
    };
  };

  const { total, average, nights, breakdown } = getBookingPriceBreakdown(room, checkIn, checkOut, selectedAdditionalRooms);

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to book a room');
      navigate('/login');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (nights <= 0) {
      toast.error('Invalid date range');
      return;
    }

    // Check if user has selected all additional rooms
    if (roomsCount > 1 && selectedAdditionalRooms.some(id => !id)) {
      toast.error('Please select all additional rooms before proceeding.');
      return;
    }

    const selectedRoomIds = [room._id, ...selectedAdditionalRooms];

    navigate('/checkout/addons', {
      state: {
        roomId: room._id,
        checkIn,
        checkOut,
        adults,
        children,
        infants,
        roomsCount,
        selectedRoomIds,
        total,
        nights,
        breakdown
      }
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: room?.name || 'Premium Stays',
      text: `Check out ${room?.name} on Premium Stays!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) {}
    } else {
      try { await navigator.clipboard.writeText(window.location.href); } catch (err) {}
    }
  };

  const getGridClass = (index, totalDisplay) => {
    if (totalDisplay === 1) return "col-span-4 row-span-2";
    if (totalDisplay === 2) return "col-span-2 row-span-2";
    if (totalDisplay === 3) {
      if (index === 0) return "col-span-2 row-span-2";
      return "col-span-2 row-span-1";
    }
    if (totalDisplay === 4) {
      if (index === 0) return "col-span-2 row-span-2";
      if (index === 1 || index === 2) return "col-span-1 row-span-1";
      return "col-span-2 row-span-1";
    }
    if (index === 0) return "col-span-2 row-span-2 rounded-l-[2rem]";
    if (index === 2) return "col-span-1 row-span-1 rounded-tr-[2rem]";
    if (index === 4) return "col-span-1 row-span-1 rounded-br-[2rem]";
    return "col-span-1 row-span-1";
  };

  return (
    <div className="min-h-screen bg-white lg:bg-[#FAFAFA] font-sans pb-0 lg:pb-20 pt-0 lg:pt-28">

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.95)" } }}
      />

    {/* --- MOBILE/TABLET HERO IMAGE (Hidden on Desktop) --- */}
      <div className="block lg:hidden relative h-[45vh] w-full bg-gray-200">

        {/* Wishlist Button - Positioned Bottom Right */}
        <div className="absolute bottom-10 right-5 z-20">
          <button
            onClick={async () => {
              if (!user) return navigate('/login');
              await toggleUserWishlist(room?._id);
            }}
            className="w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-[0_4px_15px_rgba(0,0,0,0.1)] active:scale-95 transition-all"
          >
            <Heart
              className={`w-5 h-5 transition-all ${isWishlisted ? 'text-red-500 fill-red-500 scale-110' : 'text-white'}`}
              strokeWidth={isWishlisted ? 0 : 2.5}
            />
          </button>
        </div>

        {/* Image / Fallback */}
        {images.length > 0 ? (
          <img
            src={getImageUrl(displayImages[0])}
            alt={room?.name}
            className="w-full h-full object-cover relative z-10"
            onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <BedDouble className="w-16 h-16 text-gray-400" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto lg:px-8 lg:py-10">

        {/* --- DESKTOP IMAGE GALLERY (Hidden on Mobile) --- */}
        <div className="hidden lg:block relative mb-12 group/gallery px-4 sm:px-6 lg:px-0">
          <div className="absolute top-6 left-6 z-10">
            <button onClick={() => navigate(-1)} className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-md hover:bg-white border border-gray-200/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
          </div>
          <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
            <button onClick={handleShare} className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-md hover:bg-white border border-gray-200/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95">
              <Share2 className="w-4.5 h-4.5 text-gray-700 hover:text-black" />
            </button>
            <button onClick={async () => { if (!user) return navigate('/login'); await toggleUserWishlist(room?._id); }} className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-md hover:bg-white border border-gray-200/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95">
              <Heart className={`w-4.5 h-4.5 transition-all ${isWishlisted ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-700 hover:text-black'}`} />
            </button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[60vh] min-h-[350px]">
              {displayImages.map((img, index) => (
                <div key={index} onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }} className={`relative group cursor-pointer overflow-hidden ${getGridClass(index, displayImages.length)} ${displayImages.length < 5 ? 'rounded-2xl' : ''}`}>
                  <img src={getImageUrl(img)} alt={room.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {index === 4 && remainingCount > 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white text-3xl font-bold tracking-tight">+{remainingCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="aspect-[21/9] bg-gray-100 rounded-[2rem] flex items-center justify-center">
              <BedDouble className="w-24 h-24 text-gray-300" />
            </div>
          )}
        </div>

        {/* --- MAIN CONTENT OVERLAP --- */}
        <div className="relative z-20 bg-white -mt-8 rounded-t-[2rem] px-5 pt-8 pb-32 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] lg:shadow-none lg:mt-0 lg:rounded-none lg:p-0 lg:bg-transparent lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-8 lg:space-y-12">

              {/* Title, Location & Price */}
              <div>
                <div className="flex justify-between items-start mb-3 lg:mb-6">
                  <div className="flex-1 pr-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                      {room.name}
                    </h1>
                    <div className="flex items-center gap-1.5 text-gray-500 font-medium text-sm sm:text-base">
                      <MapPin className="w-[18px] h-[18px] text-gray-700" />
                      {[room.country, room.city].filter(Boolean).join(', ')}
                    </div>
                  </div>

                  {/* Desktop Price View */}
                  <div className="hidden lg:flex flex-col justify-start text-right">
                    <div className="text-[26px] leading-none font-bold text-gray-900">
                      ₹{nights > 0 ? average.toLocaleString('en-IN') : getTodayPrice(room).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[13px] text-gray-500 font-medium mt-1">
                      {nights > 0 ? '/night avg' : '/night'}
                    </div>
                  </div>
                </div>

                {/* Mobile Price View */}
                <div className="lg:hidden flex items-end gap-1 mb-6">
                  <span className="text-[28px] leading-none font-bold text-gray-900">
                    ₹{nights > 0 ? average.toLocaleString('en-IN') : getTodayPrice(room).toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-gray-500 font-medium mb-0.5">
                    {nights > 0 ? '/night avg' : '/night'}
                  </span>
                </div>

                {/* Mobile Image Preview Slider */}
                {images.length > 1 && (
                  <div className="lg:hidden w-full mb-8">
                    <h3 className="text-base font-bold text-gray-900 mb-3">Preview</h3>
                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {images.slice(1).map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setLightboxIndex(idx + 1); setLightboxOpen(true); }}
                          className="relative flex-shrink-0 w-28 h-24 rounded-2xl overflow-hidden snap-start cursor-pointer border border-gray-100 shadow-sm active:scale-95 transition-transform"
                        >
                          <img src={getImageUrl(img)} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile & Desktop Pills */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4 block lg:hidden">Hotel Description</h2>
                  <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                    {[
                      room.size && { icon: Maximize, label: room.size },
                      (room.maxAdults || room.maxChildren) && { icon: Users, label: `Max: ${room.maxAdults || 2} Adults${(room.maxChildren || 0) > 0 ? ` · ${room.maxChildren} Children` : ''}` },
                      room.bathrooms && { icon: Bath, label: `${room.bathrooms} bath` },
                      room.beds && { icon: BedDouble, label: `${room.beds} beds` }
                    ].filter(Boolean).map(({ icon: Icon, label }, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 lg:bg-gray-100/80 lg:border-gray-200/50 lg:px-4 lg:py-2 lg:rounded-lg shadow-sm lg:shadow-none">
                        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-500" strokeWidth={2} />
                        <span className="text-[13px] lg:text-sm font-medium text-gray-600 lg:text-gray-700">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <hr className="hidden lg:block border-gray-200" />

              {/* Description */}
              <div>
                <h2 className="hidden lg:block text-2xl font-bold text-gray-900 mb-4">Hotel Description</h2>
                <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed text-[15px] lg:text-base">
                  {isDescExpanded ? (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: room.description }} />
                      <button onClick={() => setIsDescExpanded(false)} className="inline-block text-blue-600 underline hover:text-blue-800 font-medium cursor-pointer mt-1">Read less</button>
                    </div>
                  ) : (
                    <div>
                      <span>{getPlainText(room.description).slice(0, 160)}</span>
                      {getPlainText(room.description).length > 160 && (
                        <>
                          <span>......</span>
                          <button onClick={() => setIsDescExpanded(true)} className="text-blue-600 underline hover:text-blue-800 font-medium cursor-pointer">Read more</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="hidden lg:block border-gray-200" />

              {/* Ratings and Reviews */}
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Rating and reviews</h2>
                 <div className="flex items-center gap-2 mb-6 lg:mb-8">
                  <Star className="w-5 h-5 lg:w-6 lg:h-6 text-gray-900" strokeWidth={2} />
                  <span className="text-[17px] lg:text-2xl font-bold text-gray-900">{reviews.length > 0 && room.rating ? room.rating.toFixed(1) : '0.0'}</span>
                  <span className="text-gray-500 font-medium text-sm lg:text-base">({reviews.length} reviews)</span>
                  <span className="text-gray-300 font-normal select-none">•</span>
                  <span className="text-gray-500 font-medium text-sm lg:text-base">({room.visitorsCount || 0} unique visitors)</span>
                </div>

                <div className="space-y-3.5 lg:space-y-4 max-w-lg">
                  {dynamicStats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] sm:text-base">
                      <span className="w-28 sm:w-36 text-gray-800 font-medium">{stat.label}</span>
                      <div className="flex-1 h-1.5 lg:h-2 bg-gray-100 rounded-full overflow-hidden mx-4 lg:mx-6">
                        <div className="h-full bg-[#FCE83A] rounded-full" style={{ width: stat.percent }}></div>
                      </div>
                      <span className="font-medium text-gray-900 w-8 text-right">{stat.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Individual Reviews List */}
                {reviews.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Guest Stay Feedback</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                      {reviews.slice(0, 6).map((rev) => renderMainPageReviewCard(rev))}
                    </div>

                    <div className="mt-8">
                      <button
                        onClick={() => {
                          setLoadedReviewsCount(10);
                          setShowAllReviewsModal(true);
                        }}
                        className="px-6 py-3 border border-gray-200 text-gray-900 font-bold rounded-xl bg-[#ebebeb] hover:bg-[#f0efef] active:scale-[0.98] transition-all text-sm cursor-pointer shadow-sm"
                      >
                        Show all {reviews.length} reviews
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <hr className="hidden lg:block border-gray-200" />

              {/* Amenities Grid */}
              {room.amenities?.length > 0 && (
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-5 lg:mb-6">What this place offers</h2>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    {room.amenities.map((a, i) => {
                      const Icon = getIcon(a.icon);
                      return (
                        <div key={i} className="flex items-center gap-3 lg:gap-4 text-gray-700">
                          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                          <span className="font-medium text-[15px] lg:text-base">{a.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Accordion Highlights */}
              {room.highlights?.length > 0 && (
                <>
                  <hr className="hidden lg:block border-gray-200" />
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">Why guests love it</h2>
                    <div className="flex flex-col">
                      {room.highlights.map((h, i) => {
                        const Icon = getIcon(h.icon);
                        const isOpen = openHighlight === i;

                        return (
                          <div key={i} className="border-b border-gray-100 last:border-0">
                            <button onClick={() => setOpenHighlight(isOpen ? null : i)} className="w-full flex items-start justify-between py-5 text-left cursor-pointer group">
                              <div className="flex items-start gap-4 lg:gap-5">
                                <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 bg-white shadow-sm transition-colors group-hover:border-gray-300">
                                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={1.5} />
                                </div>
                                <div className="mt-2.5 sm:mt-3">
                                  <span className="font-bold text-[14px] lg:text-[15px] text-gray-900 block leading-none">{h.text}</span>
                                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-40 opacity-100 mt-2 lg:mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
                                    <div className="text-gray-500 text-[13px] lg:text-sm leading-relaxed pr-4">
                                      {h.subtext || "Experience premium comfort and exceptional service tailored to make your stay unforgettable."}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2.5 flex-shrink-0 ml-4">
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Premium Sticky Booking Card (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-[160px] bg-white rounded-3xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8">
                <div className="flex items-end gap-2 mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{nights > 0 ? average.toLocaleString('en-IN') : getTodayPrice(room).toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-500 font-medium mb-1">
                    {nights > 0 ? '/night avg' : '/night'}
                  </span>
                </div>

                <div className="bg-white border border-gray-300 rounded-2xl mb-6">
                  <div className="flex border-b border-gray-300">
                    <div
                      onClick={() => {
                        setActiveSelectType('checkIn');
                        setShowCalendarModal(true);
                      }}
                      className="flex-1 p-3 border-r border-gray-300 cursor-pointer hover:bg-gray-50 rounded-tl-2xl transition-colors"
                    >
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1 cursor-pointer">Check-in</label>
                      <div className="text-sm font-semibold text-gray-700">
                        {checkIn ? formatDisplayDate(checkIn, 'en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Add date'}
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        setActiveSelectType('checkOut');
                        setShowCalendarModal(true);
                      }}
                      className="flex-1 p-3 cursor-pointer hover:bg-gray-50 rounded-tr-2xl transition-colors"
                    >
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1 cursor-pointer">Check-out</label>
                      <div className="text-sm font-semibold text-gray-700">
                        {checkOut ? formatDisplayDate(checkOut, 'en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Add date'}
                      </div>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between border-b border-gray-300">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Adults</label>
                      <span className="text-sm text-gray-700">{adults} Adult{adults > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAdults(g => Math.max(1, g - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">−</button>
                      <button onClick={() => setAdults(g => Math.min(((room.maxAdults !== undefined && room.maxAdults !== null) ? room.maxAdults : (room.guests || 10)) * roomsCount, g + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">+</button>
                    </div>
                  </div>
                  {((room.maxChildren !== undefined && room.maxChildren !== null) ? room.maxChildren : 0) > 0 && (
                    <div className="p-3 flex items-center justify-between border-b border-gray-300">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Children</label>
                        <span className="text-sm text-gray-700">{children} Child{children !== 1 ? 'ren' : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setChildren(g => Math.max(0, g - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">−</button>
                        <button onClick={() => setChildren(g => Math.min(((room.maxChildren !== undefined && room.maxChildren !== null) ? room.maxChildren : 10) * roomsCount, g + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">+</button>
                      </div>
                    </div>
                  )}
                  <div className="p-3 flex items-center justify-between border-b border-gray-300">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Infants</label>
                      <span className="text-sm text-gray-700">{infants} Infant{infants !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setInfants(g => Math.max(0, g - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">−</button>
                      <button onClick={() => setInfants(g => Math.min(10 * roomsCount, g + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">+</button>
                    </div>
                  </div>
                  <div className={`p-3 flex items-center justify-between ${roomsCount > 1 ? 'border-b border-gray-300' : ''}`}>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Rooms</label>
                      <span className="text-sm text-gray-700">{roomsCount} Room{roomsCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setRoomsCount(g => Math.max(1, g - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">−</button>
                      <button onClick={() => setRoomsCount(g => Math.min(10, g + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">+</button>
                    </div>
                  </div>
                  {roomsCount > 1 && selectedAdditionalRooms.map((roomIdVal, idx) => (
                    <div key={idx} className={`p-3 flex flex-col gap-1.5 ${idx < selectedAdditionalRooms.length - 1 ? 'border-b border-gray-300' : ''}`}>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider text-left">Select Room {idx + 2}</label>
                      <RoomSelectDropdown
                        value={roomIdVal}
                        onChange={(nextVal) => {
                          setSelectedAdditionalRooms(prev => {
                            const next = [...prev];
                            next[idx] = nextVal;
                            return next;
                          });
                        }}
                        options={availableOtherRooms}
                        getImageUrl={getImageUrl}
                      />
                    </div>
                  ))}
                </div>

                {nights > 0 && (
                  <div className="space-y-3 mb-6 text-base text-gray-600">
                    <div className="flex justify-between text-sm">
                      <span className="underline decoration-gray-300">₹{average.toLocaleString('en-IN')} avg. × {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Collapsible night breakdown */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-500 uppercase">
                          <span>{formatDisplayDate(item.dateStr, 'en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span>₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <hr className="border-gray-200 my-4" />
                    <div className="flex justify-between font-bold text-gray-900 text-lg">
                      <span>Total</span>
                      <span>₹{(total).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                <button onClick={handleBooking} disabled={bookingLoading || !room.isAvailable} className="w-full bg-[#FCE83A] hover:bg-[#FCE83A]/90 text-gray-900 font-bold text-lg py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                  {bookingLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {room.isAvailable ? 'Book Now' : 'Check Availability'}
                </button>
                <p className="text-sm text-gray-500 text-center mt-4">You won't be charged yet</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- MOBILE FIXED BOTTOM BAR (Lite Glassmorphism Updated) --- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-gray-400/10 backdrop-blur-[5px] px-5 pt-3 pb-8 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setShowMobileBooking(true)}
          disabled={!room.isAvailable}
          className="w-full bg-[#FCE83A] active:bg-[#f3df2c] text-gray-900 font-bold text-[17px] py-4 rounded-full transition-transform duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
        >
          {room.isAvailable ? 'Book Now' : 'Check Availability'}
        </button>
      </div>

      {/* --- MOBILE BOOKING BOTTOM SHEET (MODAL) --- */}
      {showMobileBooking && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowMobileBooking(false)}
          />

          {/* Bottom Sheet Content */}
          <div className="relative w-full bg-white rounded-t-3xl p-6 pb-10 flex flex-col gap-4 animate-in slide-in-from-bottom-full duration-300">
            {/* Header / Handle */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-gray-900">
                  ₹{nights > 0 ? average.toLocaleString('en-IN') : getTodayPrice(room).toLocaleString('en-IN')}{' '}
                  <span className="text-sm text-gray-500 font-medium">{nights > 0 ? '/night avg' : '/night'}</span>
                </span>
              </div>
              <button onClick={() => setShowMobileBooking(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Container for inputs and pricing info to prevent off-screen cutoff on mobile */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-4">
              {/* Stacked Input Cards */}
              <div className="space-y-3 mb-2">
              {/* Check-In Card */}
              <div
                onClick={() => {
                  setActiveSelectType('checkIn');
                  setShowCalendarModal(true);
                }}
                className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80 cursor-pointer active:bg-gray-100 transition-colors"
              >
                <Calendar className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col w-full text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Check-in</label>
                  <div className={`text-[15px] ${checkIn ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}>
                    {checkIn ? formatDisplayDate(checkIn, 'en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Add date'}
                  </div>
                </div>
              </div>

              {/* Check-Out Card */}
              <div
                onClick={() => {
                  setActiveSelectType('checkOut');
                  setShowCalendarModal(true);
                }}
                className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80 cursor-pointer active:bg-gray-100 transition-colors"
              >
                <Calendar className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col w-full text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Check-out</label>
                  <div className={`text-[15px] ${checkOut ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}>
                    {checkOut ? formatDisplayDate(checkOut, 'en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Add date'}
                  </div>
                </div>
              </div>

              {/* Adults Card */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80">
                <Users className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Adults</label>
                  <select
                    value={adults}
                    onChange={e => setAdults(parseInt(e.target.value, 10))}
                    className="bg-transparent w-full font-bold text-gray-900 text-[15px] outline-none appearance-none"
                  >
                    {[...Array(((room.maxAdults !== undefined && room.maxAdults !== null ? room.maxAdults : (room.guests || 10)) * roomsCount))].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Adult{i+1 > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-900 mr-1" />
              </div>

              {/* Children Card */}
              {((room.maxChildren !== undefined && room.maxChildren !== null) ? room.maxChildren : 0) > 0 && (
                <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80">
                  <Users className="w-6 h-6 text-gray-400" />
                  <div className="flex flex-col flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Children</label>
                    <select
                      value={children}
                      onChange={e => setChildren(parseInt(e.target.value, 10))}
                      className="bg-transparent w-full font-bold text-gray-900 text-[15px] outline-none appearance-none"
                    >
                      {[...Array((((room.maxChildren !== undefined && room.maxChildren !== null ? room.maxChildren : 10) * roomsCount)) + 1)].map((_, i) => (
                        <option key={i} value={i}>{i} Child{i !== 1 ? 'ren' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-900 mr-1" />
                </div>
              )}

              {/* Infants Card */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80">
                <Users className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Infants</label>
                  <select
                    value={infants}
                    onChange={e => setInfants(parseInt(e.target.value, 10))}
                    className="bg-transparent w-full font-bold text-gray-900 text-[15px] outline-none appearance-none"
                  >
                    {[...Array((10 * roomsCount) + 1)].map((_, i) => (
                      <option key={i} value={i}>{i} Infant{i !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-900 mr-1" />
              </div>

              {/* Rooms Card */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80">
                <Users className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Rooms</label>
                  <select
                    value={roomsCount}
                    onChange={e => setRoomsCount(parseInt(e.target.value, 10))}
                    className="bg-transparent w-full font-bold text-gray-900 text-[15px] outline-none appearance-none"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} Room{i+1 !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-900 mr-1" />
              </div>

              {/* Mobile Additional Rooms Cards */}
              {roomsCount > 1 && selectedAdditionalRooms.map((roomIdVal, idx) => (
                <div key={idx} className="bg-[#F8F9FA] rounded-2xl p-4 flex flex-col gap-1 border border-gray-100/80">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Select Room {idx + 2}</label>
                  <RoomSelectDropdown
                    value={roomIdVal}
                    onChange={(nextVal) => {
                      setSelectedAdditionalRooms(prev => {
                        const next = [...prev];
                        next[idx] = nextVal;
                        return next;
                      });
                    }}
                    options={availableOtherRooms}
                    getImageUrl={getImageUrl}
                  />
                </div>
              ))}
            </div>

            {/* Total Mobile Summary */}
            {nights > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="underline">₹{average.toLocaleString('en-IN')} × {nights} night{nights !== 1 ? 's' : ''}</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>

                {/* Night-by-night list */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                      <span>{formatDisplayDate(item.dateStr, 'en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span>₹{item.price.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 text-gray-900 font-bold text-lg border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            </div>

            {/* Action Button inside Modal */}
            <button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="w-full bg-[#FCE83A] active:bg-[#f3df2c] text-gray-900 font-bold text-[17px] py-4 rounded-full transition-transform duration-200 active:scale-[0.98] disabled:opacity-50 mt-2 shadow-sm flex justify-center items-center"
            >
              {bookingLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              Confirm & Pay
            </button>
          </div>
        </div>
      )}

      {/* --- ALL REVIEWS MODAL (Airbnb Style) --- */}
      {showAllReviewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          {/* Dark Overlay - Optimized without heavy backdrop-blur to ensure smooth 60fps scrolling */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowAllReviewsModal(false)}
          />

          {/* Modal Panel */}
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 md:p-8 flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">Guest Reviews</h3>
              <button
                onClick={() => setShowAllReviewsModal(false)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-205 rounded-full flex items-center justify-center text-gray-600 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body - Stripped select-none and added GPU scroll acceleration */}
            <div
              className="overflow-y-auto overscroll-contain pr-2 mt-6 flex-1 space-y-8 scrollbar-thin scrollbar-thumb-gray-200"
              style={{ WebkitOverflowScrolling: 'touch', transform: 'translate3d(0,0,0)' }}
            >
              {/* Ratings Summary (Airbnb top part style) */}
              <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-gray-900 fill-gray-900" strokeWidth={2} />
                  <span className="text-4xl font-extrabold text-gray-900">{reviews.length > 0 && room.rating ? room.rating.toFixed(1) : '0.0'}</span>
                  <span className="text-lg text-gray-500 font-bold">({reviews.length} reviews)</span>
                </div>
              </div>

              {/* Sub-ratings categories (THE 4TH CONTENT SHOW IN THAT MODAL TAHT BELWOTHE REVEIW) */}
              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Rating Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {dynamicStats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm sm:text-base">
                      <span className="w-32 text-gray-800 font-bold">{stat.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mx-4">
                        <div className="h-full bg-[#FCE83A] rounded-full" style={{ width: stat.percent }}></div>
                      </div>
                      <span className="font-extrabold text-gray-900 w-8 text-right">{stat.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-lg font-extrabold text-gray-900 mb-6">{reviews.length} Verified Reviews</h4>
                <div className="space-y-8 divide-y divide-gray-100">
                  {reviews.slice(0, loadedReviewsCount).map((rev, index) => renderReviewCard(rev, index))}
                </div>

                {/* Load More Button (10 BY 10 RECORD SHWO USE LOAD TO LOAD TO SHOWTHE 10 BY 10 RECORD) */}
                {loadedReviewsCount < reviews.length && (
                  <div className="flex justify-center pt-8 pb-4">
                    <button
                      onClick={() => setLoadedReviewsCount(prev => prev + 10)}
                      className="cursor-pointer px-6 py-3.5 bg-gray-955 hover:bg-gray-800 text-white font-extrabold rounded-xl active:scale-[0.98] transition-all text-sm shadow-md"
                    >
                      Load More Reviews
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM CALENDAR MODAL --- */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCalendarModal(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] overflow-hidden p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">

            {/* Top Row: Nights Info and Inputs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900">
                  {nights > 0 ? `${nights} night${nights !== 1 ? 's' : ''}` : 'Select dates'}
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {checkIn && checkOut
                    ? `${formatDisplayDate(checkIn, 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - ${formatDisplayDate(checkOut, 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : 'Add your travel dates for exact pricing'
                  }
                </p>
                {nights > 0 && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase rounded-lg border border-emerald-200">
                    <span>₹{total.toLocaleString('en-IN')} total</span>
                    <span className="text-emerald-400">•</span>
                    <span>₹{average.toLocaleString('en-IN')}/night avg</span>
                  </div>
                )}
              </div>

              {/* Top Inputs: CHECK-IN & CHECKOUT */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden shadow-sm max-w-md w-full">
                <div
                  onClick={() => setActiveSelectType('checkIn')}
                  className={`flex-1 p-3 cursor-pointer transition-all flex items-center justify-between rounded-l-xl ${activeSelectType === 'checkIn' ? 'bg-gray-50 ring-2 ring-gray-900/40 ring-inset' : 'hover:bg-gray-50'}`}
                >
                  <div className="text-left">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Check-in</label>
                    <span className="text-sm font-bold text-gray-800">
                      {checkIn ? formatDisplayDate(checkIn, 'en-US') : 'Add date'}
                    </span>
                  </div>
                  {checkIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckIn('');
                        setCheckOut('');
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div
                  onClick={() => setActiveSelectType('checkOut')}
                  className={`flex-1 p-3 cursor-pointer transition-all flex items-center justify-between rounded-r-xl border-l border-gray-300 ${activeSelectType === 'checkOut' ? 'bg-gray-50 ring-2 ring-black/40 ring-inset' : 'hover:bg-gray-50'}`}
                >
                  <div className="text-left">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider">Checkout</label>
                    <span className="text-sm font-bold text-gray-800">
                      {checkOut ? formatDisplayDate(checkOut, 'en-US') : 'Add date'}
                    </span>
                  </div>
                  {checkOut && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCheckOut('');
                      }}
                      className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Middle Row: Dual Calendar Views */}
            <div className="py-6 flex flex-col md:flex-row gap-8 justify-center select-none">

              {/* Left Month View */}
              <div className="flex-1 max-w-[360px]">
                {renderMonthCalendar(currentMonth)}
              </div>

              {/* Right Month View (Only on Desktop) */}
              <div className="hidden md:block flex-1 max-w-[360px]">
                {renderMonthCalendar(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              </div>
            </div>

            {/* Bottom Row: Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors" title="Keyboard accessibility">
                {/* <span className="text-lg">⌨️</span> */}
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setCheckIn('');
                    setCheckOut('');
                    setHoveredDate(null);
                  }}
                  className="text-sm font-bold text-gray-700 hover:text-black underline cursor-pointer px-4 py-2 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Clear dates
                </button>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="bg-black hover:bg-black/90 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RoomDetailPage;
