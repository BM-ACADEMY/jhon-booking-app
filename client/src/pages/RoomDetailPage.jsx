import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import {
  ArrowLeft, Star, Users, BedDouble, Bath, MapPin, Wifi, Check,
  ChevronLeft, ChevronRight, ChevronDown, Loader2, Calendar, Share2, Heart, Shield, Maximize,
  MessageSquare, Sparkles, Wind, MoreVertical, X, ShowerHead
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api, { loadRazorpay } from '../api';

// Import Lightbox and its CSS
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const SERVER_URL = import.meta.env.VITE_BASE_URL;

// Import SVG Assets for Room Details
import airIcon from '@/assets/svg/air.svg';
import razorpayLogo from '../assets/razorpay.png';
import bedLinenIcon from '@/assets/svg/bed linen.svg';
import blenderIcon from '@/assets/svg/blender.svg';
import bodySoapIcon from '@/assets/svg/body soap.svg';
import cleaningIcon from '@/assets/svg/cleaing.svg';
import clothesStorageIcon from '@/assets/svg/clothes storage.svg';
import coffeeIcon from '@/assets/svg/coffee.svg';
import conditionerIcon from '@/assets/svg/conditioner.svg';
import cookerIcon from '@/assets/svg/cooker.svg';
import diningTableIcon from '@/assets/svg/dining table.svg';
import essentialsIcon from '@/assets/svg/essentials.svg';
import extraPillowsIcon from '@/assets/svg/extra pillows and blankets.svg';
import firstAidIcon from '@/assets/svg/first and kit.svg';
import fridgeIcon from '@/assets/svg/fridge.svg';
import hairdryerIcon from '@/assets/svg/hairdryer.svg';
import hangersIcon from '@/assets/svg/hangers.svg';
import hotWaterIcon from '@/assets/svg/hot water.svg';
import ironIcon from '@/assets/svg/iron.svg';
import kettleIcon from '@/assets/svg/kettle.svg';
import paidCotIcon from '@/assets/svg/paid cot.svg';
import paidFoldingIcon from '@/assets/svg/paid floading.svg';
import parkingIcon from '@/assets/svg/parking.svg';
import blindsIcon from '@/assets/svg/room darkening blinds.svg';
import shampooIcon from '@/assets/svg/shampoo.svg';
import showerGelIcon from '@/assets/svg/shower gel.svg';
import tvIcon from '@/assets/svg/tv.svg';
import washingMachineIcon from '@/assets/svg/washing machine.svg';
import wifiIcon from '@/assets/svg/wifi.svg';
import workspaceIcon from '@/assets/svg/workspace.svg';

const AMENITY_SVG_MAP = {
  'Hairdryer': hairdryerIcon,
  'Cleaning Products': cleaningIcon,
  'Shampoo': shampooIcon,
  'Conditioner': conditionerIcon,
  'Body Soap': bodySoapIcon,
  'Hot Water': hotWaterIcon,
  'Shower Gel': showerGelIcon,
  'Washing Machine': washingMachineIcon,
  'Essentials': essentialsIcon,
  'Hangers': hangersIcon,
  'Bed Linen': bedLinenIcon,
  'Extra Pillows and Blankets': extraPillowsIcon,
  'Room-Darkening Blinds': blindsIcon,
  'Iron': ironIcon,
  'TV': tvIcon,
  'Paid Cot': paidCotIcon,
  'Paid Folding Chair': paidFoldingIcon,
  'Air Conditioning': airIcon,
  'Exterior Security Cameras': firstAidIcon,
  'First Aid Kit': firstAidIcon,
  'Wifi': wifiIcon,
  'Dedicated Workspace': workspaceIcon,
  'Kitchen': cookerIcon,
  'Fridge': fridgeIcon,
  'Cooking Basics': cookerIcon,
  'Crockery and Cutlery': diningTableIcon,
  'Cooker': cookerIcon,
  'Kettle': kettleIcon,
  'Blender': blenderIcon,
  'Dining Table': diningTableIcon,
  'Coffee': coffeeIcon,
  'Free Parking on Premises': parkingIcon,
  'Self Check-In': wifiIcon,
  'Building Staff': workspaceIcon,
  'Tumble Dryer': washingMachineIcon,
  'Smoke Alarm': firstAidIcon,
  'Carbon Monoxide Alarm': firstAidIcon,
  'Heating': airIcon
};

const AMENITY_CATEGORIES = {
  'Bathroom': ['Hairdryer', 'Cleaning Products', 'Shampoo', 'Conditioner', 'Body Soap', 'Hot Water', 'Shower Gel'],
  'Bedroom and laundry': ['Washing Machine', 'Essentials', 'Hangers', 'Bed Linen', 'Extra Pillows and Blankets', 'Room-Darkening Blinds', 'Iron', 'Tumble Dryer'],
  'Entertainment': ['TV'],
  'Heating and cooling': ['Air Conditioning', 'Heating'],
  'Home safety': ['Exterior Security Cameras', 'First Aid Kit', 'Smoke Alarm', 'Carbon Monoxide Alarm'],
  'Internet and office': ['Wifi', 'Dedicated Workspace'],
  'Kitchen and dining': ['Kitchen', 'Fridge', 'Cooking Basics', 'Crockery and Cutlery', 'Cooker', 'Kettle', 'Blender', 'Dining Table', 'Coffee'],
  'Parking and facilities': ['Free Parking on Premises', 'Lift'],
  'Services': ['Self Check-In', 'Building Staff']
};

const getCategoryForAmenity = (name) => {
  for (const [cat, items] of Object.entries(AMENITY_CATEGORIES)) {
    if (items.includes(name)) return cat;
  }
  return 'Additional Amenities';
};

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const getIcon = (name) => Icons[name] || Icons.Check;

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getAdvancePercent = (settingsObj, nightsCount) => {
  if (!settingsObj) return 100;
  if (nightsCount === 1) return settingsObj.advancePercent1Day ?? 100;
  if (nightsCount === 2) return settingsObj.advancePercent2Day ?? 50;
  if (nightsCount === 3) return settingsObj.advancePercent3Day ?? 40;
  if (nightsCount === 4) return settingsObj.advancePercent4Day ?? 30;
  if (nightsCount >= 5 && nightsCount <= 7) return settingsObj.advancePercent5To7Days ?? 25;
  return settingsObj.advancePercentAbove7Days ?? 20;
};

const parseGoogleMapLink = (link) => {
  if (!link) return '';
  const trimmed = link.trim();
  const iframeMatch = trimmed.match(/src="([^"]+)"/);
  if (iframeMatch) return iframeMatch[1];
  if (trimmed.includes('/maps/embed') || trimmed.includes('output=embed')) return trimmed;
  const placeMatch = trimmed.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    const query = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  const coordMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }
  try {
    const urlObj = new URL(trimmed);
    const q = urlObj.searchParams.get('q');
    if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  } catch (_) {}
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://maps.google.com/maps?q=${encodeURIComponent(trimmed)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
};

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
  const { user, login, toggleUserWishlist, setAuthModal } = useAuth();
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingDrawer, setShowBookingDrawer] = useState(true);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [extraBedQty, setExtraBedQty] = useState(0);
  const [activeAccordion, setActiveAccordion] = useState(1);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [advancePercent, setAdvancePercent] = useState(100);
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'advance'
  const [selectedAddonForModal, setSelectedAddonForModal] = useState(null);

  const getQueryParam = (name) => {
    const val = searchParams.get(name);
    return (val === 'null' || val === 'undefined') ? '' : (val || '');
  };

  const checkInQuery = getQueryParam('checkIn');
  const checkOutQuery = getQueryParam('checkOut');
  const adultsQuery = parseInt(getQueryParam('adults') || getQueryParam('guests') || '2', 10);
  const childrenQuery = parseInt(getQueryParam('children') || '0', 10);
  const infantsQuery = parseInt(getQueryParam('infants') || '0', 10);
  const roomsCountQuery = parseInt(getQueryParam('roomsCount') || getQueryParam('rooms') || '1', 10);

  const [checkIn, setCheckIn] = useState(checkInQuery);
  const [checkOut, setCheckOut] = useState(checkOutQuery);
  const [adults, setAdults] = useState(adultsQuery);
  const [children, setChildren] = useState(childrenQuery);
  const [infants, setInfants] = useState(infantsQuery);
  const [pets, setPets] = useState(0);
  const [roomsCount, setRoomsCount] = useState(roomsCountQuery);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  const [remainingRooms, setRemainingRooms] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (!room?._id) return;
    if (!checkIn || !checkOut) {
      setRemainingRooms(null);
      return;
    }

    const fetchAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const res = await api.get(`/bookings/room-availability/${room._id}`, {
          params: { checkIn, checkOut, adults, children, roomsCount }
        });
        setRemainingRooms(res.data.remainingRooms ?? 0);
      } catch (err) {
        console.error('Failed to fetch availability:', err);
        setRemainingRooms(0);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailability();
  }, [room?._id, checkIn, checkOut, adults, children, roomsCount]);

  const [guestInfo, setGuestInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'India',
    gstNumber: '',
    specialRequests: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const isWishlisted = user?.wishlist?.includes(room?._id) || false;
  const bookingFormRef = useRef(null);

  // Modals & Interactivity
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openHighlight, setOpenHighlight] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Mobile Image Slider State
  const [activeMobileImageIndex, setActiveMobileImageIndex] = useState(0);
  const mobileSliderRef = useRef(null);
  const touchStartX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleTouchEnd = (e) => {
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = touchStartX.current - clientX;
    const total = room?.images?.length || 0;
    if (total <= 1) return;

    // Swiped left at last image -> wrap to 1st image
    if (diff > 40 && activeMobileImageIndex === total - 1) {
      scrollToMobileImage(0);
    }
    // Swiped right at 1st image -> wrap to last image
    else if (diff < -40 && activeMobileImageIndex === 0) {
      scrollToMobileImage(total - 1);
    }
  };

  const handleMobileImageScroll = (e) => {
    const scrollPosition = e.target.scrollLeft;
    const width = e.target.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollPosition / width);
      if (newIndex >= 0 && newIndex !== activeMobileImageIndex) {
        setActiveMobileImageIndex(newIndex);
      }
    }
  };

  const scrollToMobileImage = (index) => {
    if (mobileSliderRef.current) {
      const width = mobileSliderRef.current.clientWidth;
      mobileSliderRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
      setActiveMobileImageIndex(index);
    }
  };

  // Mobile Booking Wizard & Bottom Bar Scroll State
  const [showMobileBooking, setShowMobileBooking] = useState(false);
  const [mobileBookingStep, setMobileBookingStep] = useState(1);
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolledDown(true);
      } else {
        setIsScrolledDown(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // All Reviews, Amenities & Mobile Booking Wizard Modal Scroll Lock
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [showAllAmenitiesModal, setShowAllAmenitiesModal] = useState(false);
  const [loadedReviewsCount, setLoadedReviewsCount] = useState(10);

  useEffect(() => {
    if (showAllReviewsModal || showAllAmenitiesModal || showMobileBooking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAllReviewsModal, showAllAmenitiesModal, showMobileBooking]);

  useEffect(() => {
    if (showBookingDrawer && bookingFormRef.current) {
      setTimeout(() => {
        bookingFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showBookingDrawer]);

  useEffect(() => {
    if (user) {
      setGuestInfo(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'India'
      }));
    }
  }, [user]);

  useEffect(() => {
    if (settings) {
      let nightsCount = 1;
      if (checkIn && checkOut) {
        const start = parseLocalDate(checkIn);
        const end = parseLocalDate(checkOut);
        if (start && end && start < end) {
          const diffTime = Math.abs(end - start);
          nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
      const percent = getAdvancePercent(settings, nightsCount);
      setAdvancePercent(percent);
    }
  }, [settings, checkIn, checkOut]);

  const getPlainText = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const formatDisplayDate = (dateStr, locales = 'en-US', options = {}) => {
    if (!dateStr) return '';
    const localDate = parseLocalDate(dateStr);
    return localDate ? localDate.toLocaleDateString(locales, options) : '';
  };



  const [allRooms, setAllRooms] = useState([]);
  const [selectedAdditionalRooms, setSelectedAdditionalRooms] = useState([]);
  const [taxRules, setTaxRules] = useState([]);
  const [categories, setCategories] = useState([]);

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
      const hasBlockedOverlap = r.blockedDates && r.blockedDates.some(block => {
        const bStart = new Date(block.startDate);
        bStart.setHours(0, 0, 0, 0);
        const bEnd = new Date(block.endDate);
        bEnd.setHours(23, 59, 59, 999);
        return requestedDates.some(reqDate => reqDate >= bStart && reqDate <= bEnd);
      });
      return !hasOverlap && !hasBlockedOverlap;
    });
  };

  const availableOtherRooms = getAvailableOtherRooms();

  const validateClientOccupancy = () => {
    if (!room) return { isAllowed: true };
    const maxOccupancy = room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2);
    const maxTotal = maxOccupancy * roomsCount;

    if (adults + children > maxTotal) {
      return { isAllowed: false, message: `Maximum ${maxTotal} guests (Adults + Children) allowed for this room.` };
    }
    if (infants > 2 * roomsCount) {
      return { isAllowed: false, message: `Maximum ${2 * roomsCount} infants allowed.` };
    }
    return { isAllowed: true };
  };

  const clientOccupancyValidation = validateClientOccupancy();

  useEffect(() => {
    if (!room) return;
    const maxOccupancy = room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2);
    const maxOccupancyVal = maxOccupancy * roomsCount;
    
    if (adults + children > maxOccupancyVal) {
      const nextChildren = Math.max(0, maxOccupancyVal - adults);
      setChildren(nextChildren);
      if (adults > maxOccupancyVal) {
        setAdults(maxOccupancyVal);
      }
    }
  }, [roomsCount, room, adults, children]);

  const isDateBooked = (date) => {
    if (!room) return false;
    const isBooked = room.unavailableDates && room.unavailableDates.some(d => {
      const unDate = new Date(d);
      return unDate.getFullYear() === date.getFullYear() &&
             unDate.getMonth() === date.getMonth() &&
             unDate.getDate() === date.getDate();
    });
    if (isBooked) return true;

    const isBlocked = room.blockedDates && room.blockedDates.some(block => {
      const bStart = new Date(block.startDate);
      bStart.setHours(0, 0, 0, 0);
      const bEnd = new Date(block.endDate);
      bEnd.setHours(23, 59, 59, 999);
      return date >= bStart && date <= bEnd;
    });
    return isBlocked;
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
      } else if (dateStr === checkIn) {
        toast.error("Minimum stay is 1 night.");
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
      setAdults(parseInt(getQueryParam('adults') || getQueryParam('guests') || '2', 10));
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
        const [roomRes, reviewsRes, allRoomsRes, settingsRes, addonsRes, categoriesRes] = await Promise.all([
          api.get(`/rooms/${id}`),
          api.get(`/reviews/room/${id}`),
          api.get('/rooms'),
          api.get('/settings'),
          api.get('/addons'),
          api.get('/categories')
        ]);
        const fetchedRoom = roomRes.data;
        setRoom(fetchedRoom);
        setReviews(reviewsRes.data);
        setAllRooms(allRoomsRes.data || []);
        setTaxRules(settingsRes.data?.taxRules || []);
        setSettings(settingsRes.data);
        setAddons(addonsRes.data || []);
        setCategories(categoriesRes.data || []);

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
            setRoom(prev => prev ? {
              ...prev,
              visitorsCount: visitRes.data.visitorsCount,
              monthVisitorsCount: visitRes.data.monthVisitorsCount
            } : null);
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#d6e5d8] flex items-center justify-center font-bold text-[#222222] text-[16px] overflow-hidden flex-shrink-0">
            {rev.user?.avatar ? (
              <img src={getImageUrl(rev.user.avatar)} alt={rev.userName} className="w-full h-full object-cover" />
            ) : (
              rev.userName?.charAt(0).toUpperCase() || 'G'
            )}
          </div>
          <div>
            <span className="font-semibold text-[#222222] text-[16px] block leading-snug">{rev.userName}</span>
            <span className="text-[14px] text-[#717171] block leading-normal">
              {rev.booking ? 'Verified stay' : '1 month on Airbnb'}
            </span>
          </div>
        </div>

        {/* Stars and Date Row */}
        <div className="flex items-center gap-1.5 text-[#222222] text-[14px]">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${i < roundedRating ? 'text-[#222222] fill-[#222222]' : 'text-gray-300 fill-transparent'}`}
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-[#222222] font-normal select-none">·</span>
          <span className="text-[#222222] font-normal">
            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Truncated Comment with robust CSS fallback */}
        <div>
          <p
            className="text-[#222222] text-[16px] leading-relaxed line-clamp-3 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {rev.comment}
          </p>
          {rev.comment?.length > 150 && (
             <button onClick={() => { setLoadedReviewsCount(10); setShowAllReviewsModal(true); }} className="font-semibold underline text-[#222222] mt-1 text-[16px] cursor-pointer bg-transparent border-none p-0">Show more</button>
          )}
        </div>
      </div>
    );
  };

  const renderReviewCard = (rev, index) => {
    const roundedRating = Math.round(rev.rating);
    return (
      <div key={rev._id} className="flex flex-col gap-3 py-6 border-b border-gray-200 last:border-b-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#d6e5d8] flex items-center justify-center font-bold text-[#222222] text-[16px] overflow-hidden flex-shrink-0">
            {rev.user?.avatar ? (
              <img src={getImageUrl(rev.user.avatar)} alt={rev.userName} className="w-full h-full object-cover" />
            ) : (
              rev.userName?.charAt(0).toUpperCase() || 'G'
            )}
          </div>
          <div>
            <span className="font-semibold text-[#222222] text-[16px] block leading-snug">{rev.userName}</span>
            <span className="text-[14px] text-[#717171] block leading-normal">
              {rev.booking ? 'Verified stay' : '1 month on Airbnb'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#222222] text-[14px]">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${i < roundedRating ? 'text-[#222222] fill-[#222222]' : 'text-gray-300 fill-transparent'}`}
                strokeWidth={2}
              />
            ))}
          </div>
          <span className="text-[#222222] font-normal select-none">·</span>
          <span className="text-[#222222] font-normal">
            {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <p className="text-[#222222] text-[16px] leading-relaxed whitespace-pre-line">{rev.comment}</p>

        {rev.images && rev.images.length > 0 && (
          <div className="flex flex-wrap gap-2.5 mt-3">
            {rev.images.map((imgUrl, imgIdx) => (
              <div key={imgIdx} className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all">
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
  };

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
      dayCells.push(<div key={`pad-${i}`} className="w-10 h-10" />);
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
      let wrapperClass = "relative w-10 h-10 flex items-center justify-center";
      let dayBtnClass = "w-10 h-10 flex items-center justify-center text-[13px] transition-all relative border border-transparent font-bold ";

      if (isDisabled) {
        dayBtnClass += "text-gray-300 cursor-not-allowed font-medium ";
        if (isBooked) {
          dayBtnClass += "line-through ";
        }
      } else if (isCheckIn || isCheckOut) {
        dayBtnClass += "bg-[#222222] text-white rounded-full z-10 ";
        // If we wanted connecting background we could add it to wrapperClass here
      } else if (inRange) {
        dayBtnClass += "bg-[#f2f2f2] text-[#222222] rounded-full ";
        if (isHovered) {
          dayBtnClass += "border-[#222222] ";
        }
      } else {
        dayBtnClass += "text-[#222222] hover:border hover:border-[#222222] rounded-full cursor-pointer ";
      }

      dayCells.push(
        <div
          key={`day-${day}`}
          className={wrapperClass}
          onMouseEnter={() => !isDisabled && checkIn && !checkOut && setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={() => !isDisabled && handleDateClick(thisDate)}
        >
          <button
            type="button"
            disabled={isDisabled}
            className={dayBtnClass}
          >
            <span>{day}</span>
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

    while (curr < end) {
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

  const getResolvedTimings = () => {
    let inTime = room?.checkInTime;
    let outTime = room?.checkOutTime;

    if (!inTime || !outTime) {
      const cat = categories.find(c => c.name === room?.category);
      if (!inTime && cat?.checkInTime) inTime = cat.checkInTime;
      if (!outTime && cat?.checkOutTime) outTime = cat.checkOutTime;
    }

    if (!inTime) inTime = settings?.checkInTime || '14:00';
    if (!outTime) outTime = settings?.checkOutTime || '11:00';

    const format12h = (tStr) => {
      if (!tStr) return '';
      const parts = tStr.split(':');
      if (parts.length < 2) return tStr;
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    };

    return {
      checkIn: format12h(inTime),
      checkOut: format12h(outTime),
      rawCheckIn: inTime,
      rawCheckOut: outTime
    };
  };

  const resolvedTimings = getResolvedTimings();

  const { total, average, nights, breakdown } = getBookingPriceBreakdown(room, checkIn, checkOut, selectedAdditionalRooms);

  const getAppliedTax = (amount) => {
    if (!taxRules || taxRules.length === 0) return 0;
    const perDayAmount = (nights && nights > 0) ? (amount / nights) : amount;
    const matchedRule = taxRules.find(r => perDayAmount >= r.minAmount && perDayAmount <= r.maxAmount);
    if (matchedRule) {
      return Math.round(amount * (matchedRule.taxPercent / 100));
    }
    return 0;
  };

  const stayTax = getAppliedTax(total);
  const extraBedTotal = room?.allowExtraBed ? extraBedQty * (Number(room.extraBedPrice) || 0) * nights : 0;
  const finalTotal = total + stayTax + selectedAddons.reduce((sum, a) => sum + a.price, 0) + extraBedTotal;

  const getAppliedTaxPercent = (amount) => {
    if (!taxRules || taxRules.length === 0) return 0;
    const perDayAmount = (nights && nights > 0) ? (amount / nights) : amount;
    const matchedRule = taxRules.find(r => perDayAmount >= r.minAmount && perDayAmount <= r.maxAmount);
    return matchedRule ? matchedRule.taxPercent : 0;
  };



  const handleAddonClick = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find(a => a._id === addon._id);
      if (exists) {
        return prev.filter(a => a._id !== addon._id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleGuestInfoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setGuestInfo(prev => ({
        ...prev,
        phone: digitsOnly
      }));
      return;
    }
    setGuestInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateGuestInfo = () => {
    const { fullName, email, phone } = guestInfo;
    if (!fullName.trim()) {
      toast.error('First Name and Last Name is required');
      return false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('A valid Email address is required');
      return false;
    }
    if (!phone.trim() || phone.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions to continue');
      return false;
    }
    return true;
  };

  const initiateGuestBookingPayment = async () => {
    if (!validateGuestInfo()) {
      setActiveAccordion(2);
      return;
    }

    try {
      setPaymentProcessing(true);

      if (!user) {
        try {
          await api.post('/bookings/check-guest', {
            email: guestInfo.email,
            phone: guestInfo.phone
          });
        } catch (checkErr) {
          toast.error(checkErr.response?.data?.message || 'Unable to verify guest details');
          setActiveAccordion(2);
          setPaymentProcessing(false);
          return;
        }
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your network connection.');
        setPaymentProcessing(false);
        return;
      }

      const addonsPayload = selectedAddons.map(a => ({
        name: a.name,
        price: a.price
      }));

      const stayTax = getAppliedTax(total);
      const finalTotal = total + stayTax + selectedAddons.reduce((sum, a) => sum + a.price, 0) + extraBedTotal;
      const actualAmount = paymentType === 'advance' ? Math.round(finalTotal * (advancePercent / 100)) : finalTotal;

      const orderRes = await api.post('/bookings/razorpay-order', {
        amount: actualAmount,
        currency: 'INR',
        roomId: room._id,
        checkIn,
        checkOut,
        adults,
        children,
        infants,
        roomsCount,
        selectedRoomIds: [room._id, ...selectedAdditionalRooms]
      });
      const order = orderRes.data;

      const names = guestInfo.fullName.trim().split(/\s+/);
      const firstName = names[0] || 'Guest';
      const lastName = names.slice(1).join(' ') || '';

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'The Balified Villa',
        description: paymentType === 'advance' ? `Advance stay payment (${advancePercent}%)` : `Room stay + ${addonsPayload.length} Add-on(s)`,
        order_id: order.id,
        handler: async (response) => {
          try {
            toast.loading('Verifying payment...', { id: 'payment-verify' });
            const verifyRes = await api.post('/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingData: {
                room: room._id,
                checkIn,
                checkOut,
                adults,
                children,
                infants,
                roomsCount,
                selectedRoomIds: [room._id, ...selectedAdditionalRooms],
                guests: adults + children + infants,
                totalAmount: finalTotal,
                paidAmount: actualAmount,
                paymentType: paymentType,
                addons: addonsPayload,
                extraBedCount: extraBedQty,
                extraBedPrice: extraBedQty > 0 ? (Number(room.extraBedPrice) || 0) : 0,
                gstNumber: guestInfo.gstNumber,
                specialRequests: guestInfo.specialRequests,
                guestDetails: {
                  firstName,
                  lastName,
                  email: guestInfo.email,
                  phone: guestInfo.phone,
                  gstNumber: guestInfo.gstNumber,
                  city: guestInfo.city,
                  state: guestInfo.state,
                  country: guestInfo.country,
                  specialRequests: guestInfo.specialRequests
                }
              }
            });

            if (verifyRes.data.booking) {
              toast.success('Booking Confirmed successfully!', { id: 'payment-verify' });
              
              if (verifyRes.data.token && verifyRes.data.user) {
                login(verifyRes.data.user, verifyRes.data.token);
              }
              
              setShowBookingDrawer(false);
              setTimeout(() => {
                navigate('/mybookings');
              }, 1500);
            } else {
              toast.error('Payment verification failed.', { id: 'payment-verify' });
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed', { id: 'payment-verify' });
          }
        },
        prefill: { 
          name: guestInfo.fullName.trim(), 
          email: guestInfo.email, 
          contact: guestInfo.phone 
        },
        theme: { color: '#EAB308' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate booking payment');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleBooking = async () => {
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    if (checkIn === checkOut) {
      toast.error('Minimum stay is 1 night.');
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

    setShowBookingDrawer(true);
    setActiveAccordion(1);

    setTimeout(() => {
      if (bookingFormRef.current) {
        bookingFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
    <div className="min-h-screen bg-white lg:bg-[#ffffff] font-sans pb-0 lg:pb-20 pt-0 lg:pt-28">

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.95)" } }}
      />

    {/* --- MOBILE/TABLET HERO IMAGE SLIDER (Hidden on Desktop) --- */}
      <div className="block lg:hidden relative h-[45vh] w-full bg-gray-200 overflow-hidden">

        {/* Top Overlay Controls: Back Arrow & Wishlist */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center border border-gray-200/50 shadow-md text-gray-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!user) {
                setAuthModal('login');
                return;
              }
              await toggleUserWishlist(room?._id);
            }}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center border border-gray-200/50 shadow-md active:scale-95 transition-all cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-5 h-5 transition-all ${isWishlisted ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-700'}`}
              strokeWidth={isWishlisted ? 0 : 2}
            />
          </button>
        </div>

        {/* Image Slider / Fallback */}
        {images.length > 0 ? (
          <>
            <div
              ref={mobileSliderRef}
              onScroll={handleMobileImageScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            >
              {images.map((img, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full h-full snap-center relative cursor-pointer"
                  onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${room?.name || 'Room'} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* Navigation Dots Indicator Floating Above Content Card */}
            {images.length > 1 && (
              <div className="absolute bottom-12 left-0 right-0 z-30 flex items-center justify-center gap-1.5 pointer-events-auto">
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => scrollToMobileImage(index)}
                    className={`h-2 rounded-full transition-all duration-300 border-none cursor-pointer p-0 ${
                      activeMobileImageIndex === index
                        ? 'w-6 bg-white shadow-md'
                        : 'w-2 bg-white/70 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
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
            <button onClick={async () => { if (!user) { setAuthModal('login'); return; } await toggleUserWishlist(room?._id); }} className="cursor-pointer flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-md hover:bg-white border border-gray-200/50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95">
              <Heart className={`w-4.5 h-4.5 transition-all ${isWishlisted ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-700 hover:text-black'}`} />
            </button>
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[60vh] min-h-[350px]">
              {displayImages.map((img, index) => (
                <div key={index} onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }} className={`relative group cursor-pointer overflow-hidden ${getGridClass(index, displayImages.length)} ${displayImages.length < 5 ? 'rounded-2xl' : ''}`}>
                  <img src={getImageUrl(img)} alt={room.name} className="w-full h-full object-cover transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                <div className="mb-6 lg:mb-8 border-b border-gray-200 pb-6">
                  <h1 className="text-2xl sm:text-[26px] lg:text-[28px] font-semibold text-[#222222] tracking-tight leading-tight mb-1">
                    {room.name} in {[room.city, room.country].filter(Boolean).join(', ')}
                  </h1>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-sm sm:text-[15px] text-[#222222] font-semibold mt-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{room.guests || 2} Guests</span>
                    </div>
                    {room.bathrooms > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-gray-500" />
                        <span>{room.bathrooms} Bath{room.bathrooms > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {room.showers > 0 && (
                      <div className="flex items-center gap-1.5">
                        <ShowerHead className="w-4 h-4 text-gray-500" />
                        <span>{room.showers} Shower{room.showers > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {room.size && (
                      <div className="flex items-center gap-1.5">
                        <Maximize className="w-4 h-4 text-gray-500" />
                        <span>{room.size}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[#222222] font-semibold text-[15px] sm:text-base mt-1">
                    <span>★ {reviews.length > 0 ? (dynamicStats.reduce((acc, curr) => acc + curr.score, 0) / dynamicStats.length).toFixed(2) : (room.rating || 'New')}</span>
                    <span>&middot;</span>
                    <span className="underline">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>


              </div>

              {/* Description */}
              <div className="py-1">
                <h2 className="text-xl sm:text-[22px] font-semibold text-[#222222] mb-4">About this space</h2>
                <div className="text-[#222222] text-[15px] sm:text-[16px] leading-[1.625] font-normal max-w-4xl">
                  {isDescExpanded ? (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: room.description }} />
                      <button onClick={() => setIsDescExpanded(false)} className="mt-6 px-5 py-2.5 bg-[#f2f2f2] hover:bg-[#f2f2f2] text-[#222222] font-semibold rounded-lg text-[15px] transition-colors border-none cursor-pointer">Show less</button>
                    </div>
                  ) : (
                    <div>
                      <span>{getPlainText(room.description).slice(0, 320)}...</span>
                      {getPlainText(room.description).length > 320 && (
                        <div className="mt-6">
                          <button onClick={() => setIsDescExpanded(true)} className="px-5 py-2.5 bg-[#f0efef] hover:bg-[#f2f2f2] text-[#222222] font-semibold rounded-lg text-[15px] transition-colors border-none cursor-pointer">Show more</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="hidden lg:block border-gray-200" />

              {/* Ratings and Reviews */}
              <div>
                <h2 className="text-[22px] font-semibold text-[#222222] mb-4 lg:mb-6">Rating and reviews</h2>
                 <div className="flex items-center gap-2 mb-6 lg:mb-8">
                  <Star className="w-5 h-5 lg:w-6 lg:h-6 text-[#222222] " strokeWidth={2} />
                  <span className="text-[17px] lg:text-2xl font-semibold text-[#222222]">{reviews.length > 0 && room.rating ? room.rating.toFixed(1) : '0.0'}</span>
                  <span className="text-gray-500 font-medium text-sm lg:text-base">({reviews.length} reviews)</span>
                  <span className="text-gray-300 font-normal select-none">•</span>
                  <span className="text-gray-500 font-medium text-sm lg:text-base">({room.monthVisitorsCount || 0} month visitors)</span>
                </div>

                <div className="space-y-3.5 lg:space-y-4 max-w-lg">
                  {dynamicStats.map((stat, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] sm:text-base">
                      <span className="w-28 sm:w-36 text-gray-800 font-medium">{stat.label}</span>
                      <div className="flex-1 h-1.5 lg:h-2 bg-gray-100 rounded-full overflow-hidden mx-4 lg:mx-6">
                        <div className="h-full bg-[#222222] rounded-full" style={{ width: stat.percent }}></div>
                      </div>
                      <span className="font-medium text-[#222222] w-8 text-right">{stat.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Individual Reviews List */}
                {reviews.length > 0 && (
                  <div className="mt-10 pt-10 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-12">
                      {reviews.slice(0, 6).map((rev) => renderMainPageReviewCard(rev))}
                    </div>

                    <div className="mt-12">
                      <button
                        onClick={() => {
                          setLoadedReviewsCount(10);
                          setShowAllReviewsModal(true);
                        }}
                        className="px-6 py-3 text-[#222222] font-semibold rounded-lg bg-[#f0efef] hover:bg-[#f2f2f2] active:scale-95 transition-all text-[15px] cursor-pointer border-none"
                      >
                        Show all {reviews.length} reviews
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Amenities Grid */}
              {room.amenities?.length > 0 && (
                <>
                  <hr className="hidden lg:block border-gray-200" />
                  <div className="py-8">
                  <h2 className="text-[22px] font-semibold text-[#222222] mb-6">What this place offers</h2>
                  <div className="grid grid-cols-2 gap-y-5 gap-x-8 max-w-2xl">
                    {room.amenities.slice(0, 10).map((a, i) => {
                      const svgSrc = AMENITY_SVG_MAP[a.name];
                      const Icon = getIcon(a.icon);
                      return (
                        <div key={i} className="flex items-center gap-4 text-[#222222]">
                          {svgSrc ? (
                            <img src={svgSrc} className="w-6 h-6 object-contain" alt={a.name} style={{ filter: 'grayscale(100%) opacity(0.8)' }} />
                          ) : (
                            <Icon className="w-7 h-7 text-[#222222] stroke-[1.5]" />
                          )}
                          <span className="font-normal text-[16px]">{a.name}</span>
                        </div>
                      );
                    })}
                  </div>
                  {room.amenities.length > 10 && (
                    <button onClick={() => setShowAllAmenitiesModal(true)} className="mt-8 px-6 py-3 text-[#222222] font-semibold rounded-lg bg-[#f0efef] hover:bg-[#f2f2f2] active:scale-95 transition-all text-[15px] cursor-pointer">
                      Show all {room.amenities.length} amenities
                    </button>
                  )}
                </div>
                </>
              )}


              {/* Google Map Section */}
              {room.mapLink && (
                <div className="pt-10 mt-10 border-t border-gray-200">
                  <h2 className="text-[22px] font-semibold text-[#222222] mb-1">Where you'll be</h2>
                  <p className="text-[16px] text-[#222222] font-normal mb-6">{room.location || 'Puducherry, India'}</p>
                  <div className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                    <iframe
                      src={parseGoogleMapLink(room.mapLink)}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                  </div>
                  {room.mapLink.startsWith('http') && (
                    <div className="mt-2 text-right">
                      <a
                        href={room.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline inline-flex items-center gap-1"
                      >
                        Open in Google Maps ↗
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Policies & Rules */}
              <div className="pt-10 mt-10 border-t border-gray-200">
                <h2 className="text-[22px] font-semibold text-[#222222] mb-8">Things to know</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 lg:gap-x-32 gap-y-10">
                  {/* Cancellation Policy */}
                  <div>
                    <Icons.CalendarX className="w-7 h-7 text-[#222222] mb-5" strokeWidth={1.5} />
                    <h3 className="font-semibold text-[#222222] text-[16px] mb-3">Cancellation policy</h3>
                    <p className="text-[#222222] text-[16px] font-normal leading-relaxed mb-4">
                      Free cancellation for 48 hours. After that, the reservation is non-refundable.
                    </p>
                  </div>

                  {/* House Rules */}
                  <div>
                    <Icons.Key className="w-7 h-7 text-[#222222] mb-5" strokeWidth={1.5} />
                    <h3 className="font-semibold text-[#222222] text-[16px] mb-3">House rules</h3>
                    <div className="space-y-3 text-[#222222] text-[16px] font-normal">
                      <p>Check-in: {resolvedTimings.checkIn} – 11:00 pm</p>
                      <p>Checkout before {resolvedTimings.checkOut}</p>
                      <p>{room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)} guests maximum</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- BOOKING FLOW INLINE (NO MANDATORY LOGIN) --- */}
              {showBookingDrawer && (
                <div className="hidden lg:block">
                  <hr className="border-gray-200 mt-12" />
                  <div ref={bookingFormRef} className="mt-10 lg:mt-12 bg-[#FAFAFA] border border-gray-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
                  

                  {/* Step 2 Header: Enhance Your Stay */}
                  <div className="border-b border-gray-200">
                    <div className={`px-6 py-4 flex items-center justify-between ${activeAccordion === 1 ? 'bg-[#1f2937] text-white' : 'bg-[#f3f4f6] text-gray-800'}`}>
                      <h3 className="font-bold text-sm">Enhance Your Stay</h3>
                      {activeAccordion !== 1 && (
                        <button
                          type="button"
                          onClick={() => setActiveAccordion(1)}
                          className="flex items-center gap-1 text-xs font-bold text-gray-750 hover:text-black transition-colors cursor-pointer border-none bg-transparent"
                        >
                          <Icons.Edit className="w-3.5 h-3.5" /> Change
                        </button>
                      )}
                    </div>

                    {activeAccordion === 1 && (
                      <div className="p-6 bg-white space-y-4">
                        <p className="text-xs text-gray-500">Select premium add-on services to customize your experience, or skip to continue.</p>

                        {addons.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No add-ons available for selection.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto p-1 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                            {addons.map((addon) => {
                              const isSelected = selectedAddons.some(a => a._id === addon._id);
                              return (
                                <div
                                  key={addon._id}
                                  className="border border-gray-200 rounded-sm overflow-hidden bg-white flex flex-col transition-all hover:shadow-md"
                                >
                                  {/* Image Section */}
                                  <div 
                                    className="h-40 w-full relative bg-gray-50 flex-shrink-0 cursor-pointer overflow-hidden group" 
                                    onClick={() => setSelectedAddonForModal(addon)}
                                  >
                                    {addon.image ? (
                                      <img src={getImageUrl(addon.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={addon.name} />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300 group-hover:scale-105 transition-transform duration-300">
                                        <Icons.Image className="w-10 h-10" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Content Section */}
                                  <div className="p-4 flex flex-col flex-1">
                                    <h4 
                                      className="text-[15px] font-normal text-gray-800 cursor-pointer hover:underline"
                                      onClick={() => setSelectedAddonForModal(addon)}
                                    >
                                      {addon.name}
                                    </h4>
                                    {addon.description && (
                                      <p 
                                        className="text-[13px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed cursor-pointer"
                                        onClick={() => setSelectedAddonForModal(addon)}
                                      >
                                        {addon.description}
                                      </p>
                                    )}
                                    
                                    {/* Bottom Action Row */}
                                    <div className="mt-auto pt-5 flex items-center justify-between">
                                      {/* Price (Left) */}
                                      <span className="text-sm font-bold text-gray-900">
                                        ₹{addon.price.toLocaleString('en-IN')}
                                      </span>

                                      {/* Add Button (Right) */}
                                      <button
                                        type="button"
                                        onClick={() => handleAddonClick(addon)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                                          isSelected 
                                            ? 'bg-yellow-500 border-yellow-500 text-white shadow-sm' 
                                            : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400'
                                        }`}
                                      >
                                        {isSelected ? 'Added' : 'Add'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between gap-4">
                          <div>
                            {selectedAddons.length > 0 && (
                              <span className="text-xs font-semibold text-gray-600">
                                {selectedAddons.length} service(s) selected (₹{selectedAddons.reduce((sum, a) => sum + a.price, 0).toLocaleString('en-IN')})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAddons([]);
                                setActiveAccordion(2);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-lg border-none transition-colors cursor-pointer"
                            >
                              Skip
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveAccordion(2)}
                              className="bg-black hover:bg-black/90 text-white font-bold text-xs px-4 py-2.5 rounded-lg border-none transition-colors cursor-pointer"
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3 Header & Body: Guest Information */}
                  <div>
                    <div className={`px-6 py-4 ${activeAccordion === 2 ? 'bg-[#374151] text-white' : 'bg-[#f3f4f6] text-gray-800'}`}>
                      <h3 className="font-bold text-sm">Guest Information</h3>
                    </div>

                    {activeAccordion === 2 && (
                      <div className="p-6 bg-white">
                        {user?.role === 'admin' ? (
                          <div className="max-w-xl mx-auto bg-purple-50 border border-purple-100 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-left">
                              <Icons.ShieldAlert className="w-8 h-8 text-purple-600 shrink-0" />
                              <div>
                                <h3 className="font-bold text-purple-900 text-base">Admin Session Active</h3>
                                <p className="text-purple-700 text-sm">Self-booking is disabled for administrators.</p>
                              </div>
                            </div>
                            <Link 
                              to="/admin/bookings" 
                              className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-3 rounded-lg transition-colors whitespace-nowrap text-center uppercase tracking-wider"
                            >
                              Go to Admin Panel
                            </Link>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            
                            {/* FORM FIELDS (LEFT SIDE) */}
                            <div className="lg:col-span-7 space-y-5">
                              
                              <div>
                                <input
                                  type="text"
                                  name="fullName"
                                  value={guestInfo.fullName}
                                  onChange={handleGuestInfoChange}
                                  placeholder="First Name and Last Name *"
                                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-medium text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <input
                                  type="email"
                                  name="email"
                                  value={guestInfo.email}
                                  onChange={handleGuestInfoChange}
                                  placeholder="Email Address *"
                                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-medium text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                />
                                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                  <span className="bg-gray-50/50 border-r border-gray-200 px-3.5 py-3.5 text-[13px] font-semibold text-gray-500 flex items-center gap-1.5 shrink-0">
                                    🇮🇳 +91
                                  </span>
                                  <input
                                    type="tel"
                                    name="phone"
                                    value={guestInfo.phone}
                                    onChange={handleGuestInfoChange}
                                    maxLength={10}
                                    placeholder="10-digit mobile number *"
                                    className="w-full bg-transparent border-none px-4 py-3.5 text-[13px] font-medium text-gray-800 outline-none placeholder:text-gray-400"
                                  />
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  name="gstNumber"
                                  value={guestInfo.gstNumber}
                                  onChange={handleGuestInfoChange}
                                  placeholder="GST Number (Optional)"
                                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-[13px] font-medium text-gray-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                />
                              </div>

                              {/* Payment Options */}
                              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm mt-2">
                                {/* Option 1: Pay Later */}
                                {advancePercent < 100 && (
                                  <div className="flex items-start gap-3.5">
                                    <input
                                      type="radio"
                                      id="payAdvance"
                                      name="paymentChoice"
                                      checked={paymentType === 'advance'}
                                      onChange={() => setPaymentType('advance')}
                                      className="mt-1 w-4 h-4 accent-black cursor-pointer"
                                    />
                                    <label htmlFor="payAdvance" className="flex-1 cursor-pointer">
                                      <span className="font-bold text-[14px] text-gray-900 block mb-1">I prefer to Pay Later</span>
                                      <div className="flex items-center justify-between text-[12px] text-gray-500">
                                        <span>Pay Now:</span>
                                        <span className="font-bold text-gray-900">₹{Math.round(finalTotal * (advancePercent / 100)).toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-[12px] text-gray-500 mt-0.5">
                                        <span>Pay Later:</span>
                                        <span>₹{(finalTotal - Math.round(finalTotal * (advancePercent / 100))).toLocaleString('en-IN')}</span>
                                      </div>
                                    </label>
                                  </div>
                                )}

                                {/* Option 2: Pay 100% Now */}
                                <div className={`flex items-start gap-3.5 ${advancePercent < 100 ? 'border-t border-gray-100 pt-4' : ''}`}>
                                  <input
                                    type="radio"
                                    id="pay100"
                                    name="paymentChoice"
                                    checked={paymentType === 'full'}
                                    onChange={() => setPaymentType('full')}
                                    className="mt-1 w-4 h-4 accent-black cursor-pointer"
                                  />
                                  <label htmlFor="pay100" className="flex-1 cursor-pointer">
                                    <span className="font-bold text-[14px] text-gray-900 block mb-1">I prefer to pay 100% now</span>
                                    <div className="flex items-center justify-between text-[12px] text-gray-500">
                                      <span>Pay Now:</span>
                                      <span className="font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[12px] text-gray-500 mt-0.5">
                                      <span>Pay Later:</span>
                                      <span>₹0.00</span>
                                    </div>
                                  </label>
                                </div>
                              </div>

                              {/* Terms and Conditions Checkbox */}
                              <div className="flex items-start gap-3 pt-2 pb-2">
                                <input
                                  type="checkbox"
                                  id="termsCheck"
                                  checked={termsAccepted}
                                  onChange={(e) => setTermsAccepted(e.target.checked)}
                                  className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                                />
                                <label htmlFor="termsCheck" className="text-[12px] text-gray-500 leading-snug cursor-pointer select-none">
                                  By completing this reservation you are accepting our{' '}
                                  <Link
                                    to="/terms-and-conditions"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="underline font-bold text-gray-800 hover:text-black"
                                  >
                                    Terms & Conditions
                                  </Link>
                                </label>
                              </div>

                              {/* Submit Button */}
                              <div>
                                <button
                                  type="button"
                                  onClick={initiateGuestBookingPayment}
                                  className="w-full bg-[#2B84EA] hover:bg-[#1C6DD0] text-white font-bold text-[15px] py-4 rounded-xl transition-all border-none cursor-pointer tracking-wide flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99]"
                                >
                                  <img src={razorpayLogo} alt="Razorpay" className="h-5 object-contain rounded-sm px-1.5" />
                                  <span>Pay & Confirm Booking</span>
                                </button>
                              </div>

                            </div>

                            {/* sticky SUMMARY CARD (RIGHT SIDE) */}
                            <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-3xl p-7 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                              <h3 className="font-extrabold text-[15px] text-gray-900 border-b border-gray-100 pb-3">Your Booking Details</h3>
                              
                              <div className="flex justify-between items-start gap-2">
                                <span className="font-bold text-gray-900 text-[14px]">The Balified Villa</span>
                                <span className="font-bold text-gray-900 text-[14px]">₹{(total + getAppliedTax(total) + selectedAddons.reduce((sum, a) => sum + a.price, 0) + extraBedTotal).toLocaleString('en-IN')}</span>
                              </div>

                              <div className="bg-gray-50/80 rounded-2xl p-4 text-[12px] text-gray-500 font-medium space-y-1.5">
                                <div className="text-gray-700">{formatDisplayDate(checkIn, 'en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} - {formatDisplayDate(checkOut, 'en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div>{nights} Night{nights > 1 ? 's' : ''} — {roomsCount} Room{roomsCount > 1 ? 's' : ''}, {adults} Adult{adults > 1 ? 's' : ''}</div>
                              </div>

                              <div className="space-y-3 border-t border-gray-100 pt-4 text-[13px]">
                                <div className="flex justify-between items-center text-gray-600 gap-2">
                                  <span className="truncate" title={room.name}>Room - {room.name}</span>
                                  <span className="font-semibold text-gray-900 shrink-0">₹{total.toLocaleString('en-IN')}</span>
                                </div>
                                
                                {selectedAddons.length > 0 && (
                                  <div className="space-y-2 pt-2 border-t border-gray-50">
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add-on Services</span>
                                    {selectedAddons.map(a => (
                                      <div key={a._id} className="flex justify-between text-gray-500 text-[12px]">
                                        <span>• {a.name}</span>
                                        <span>₹{a.price.toLocaleString('en-IN')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {extraBedQty > 0 && (
                                  <div className="flex justify-between text-gray-500 text-[12px] pt-2 border-t border-gray-50">
                                    <span>• Extra Bed ({extraBedQty} × {nights} night{nights > 1 ? 's' : ''})</span>
                                    <span>₹{extraBedTotal.toLocaleString('en-IN')}</span>
                                  </div>
                                )}

                                <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-3">
                                  <span>Sub Total</span>
                                  <span className="font-semibold text-gray-900">₹{(total + selectedAddons.reduce((sum, a) => sum + a.price, 0) + extraBedTotal).toLocaleString('en-IN')}</span>
                                </div>

                                {getAppliedTaxPercent(total) > 0 && (
                                  <div className="flex justify-between text-gray-600">
                                    <span>Taxes and Fees ({getAppliedTaxPercent(total)}%)</span>
                                    <span className="font-semibold text-gray-900">₹{getAppliedTax(total).toLocaleString('en-IN')}</span>
                                  </div>
                                )}

                                <div className="flex justify-between text-gray-900 font-extrabold text-[15px] border-t border-gray-200 pt-4">
                                  <span>Grand Total</span>
                                  <span className="text-[#c5a880] text-[17px]">₹{(total + getAppliedTax(total) + selectedAddons.reduce((sum, a) => sum + a.price, 0) + extraBedTotal).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
                </div>
              )}
            </div>

            {/* Right Column: Premium Sticky Booking Card (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-[90px] bg-white rounded-3xl border border-gray-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8">
                <div className="flex items-end gap-2 mb-6">
                  {nights > 0 ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">₹{average.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      <span className="text-gray-500 font-medium ml-1">for {nights} night{nights !== 1 ? 's' : ''}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">₹{getTodayPrice(room).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      <span className="text-gray-500 font-medium ml-1">/night</span>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-300 rounded-2xl mb-6 relative z-30">
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
                  
                  {/* Guest Dropdown Trigger */}
                  <div 
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-b-2xl transition-colors"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1 cursor-pointer">Guests</label>
                      <div className="text-sm text-gray-700">{adults + children} guest{adults + children !== 1 ? 's' : ''}{infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}</div>
                    </div>
                    <Icons.ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Guest Dropdown Modal (Absolute) */}
                  {showGuestDropdown && (
                    <div className="absolute left-0 right-0 top-[110%] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200 p-4 z-50 space-y-6">
                      {/* Adults */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-bold text-gray-900">Adults</div>
                          <div className="text-[13px] text-gray-500">Age 13+</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setAdults(g => Math.max(1, g - 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:cursor-not-allowed" disabled={adults <= 1}>−</button>
                          <span className="w-4 text-center text-[15px] font-medium text-gray-800">{adults}</span>
                          <button onClick={(e) => { e.stopPropagation(); setAdults(g => Math.min((room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)) * roomsCount - children, g + 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900">+</button>
                        </div>
                      </div>
                      
                      {/* Children */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-bold text-gray-900">Children</div>
                          <div className="text-[13px] text-gray-500">Ages 2–12</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setChildren(g => Math.max(0, g - 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:cursor-not-allowed" disabled={children <= 0}>−</button>
                          <span className="w-4 text-center text-[15px] font-medium text-gray-800">{children}</span>
                          <button onClick={(e) => { e.stopPropagation(); setChildren(g => Math.min((room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)) * roomsCount - adults, g + 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900">+</button>
                        </div>
                      </div>

                      {/* Infants */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-bold text-gray-900">Infants</div>
                          <div className="text-[13px] text-gray-500">Under 2</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); setInfants(g => Math.max(0, g - 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:cursor-not-allowed" disabled={infants <= 0}>−</button>
                          <span className="w-4 text-center text-[15px] font-medium text-gray-800">{infants}</span>
                          <button onClick={(e) => { e.stopPropagation(); setInfants(g => Math.min(2, g + 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900">+</button>
                        </div>
                      </div>

                      {/* Extra Bed */}
                      {room?.allowExtraBed && Number(room.extraBedCount) > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <div className="text-[15px] font-bold text-gray-900">Extra Bed</div>
                            <div className="text-[13px] text-gray-500">₹{Number(room.extraBedPrice || 0).toLocaleString('en-IN')} / bed / night</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={(e) => { e.stopPropagation(); setExtraBedQty(q => Math.max(0, q - 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:cursor-not-allowed" disabled={extraBedQty <= 0}>−</button>
                            <span className="w-4 text-center text-[15px] font-medium text-gray-800">{extraBedQty}</span>
                            <button onClick={(e) => { e.stopPropagation(); setExtraBedQty(q => Math.min(Number(room.extraBedCount), q + 1)); }} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-gray-500 disabled:cursor-not-allowed" disabled={extraBedQty >= Number(room.extraBedCount)}>+</button>
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-gray-500 pt-2 leading-relaxed">
                        This place has a maximum of {(room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)) * roomsCount} guests, not including infants.
                      </div>

                      <div className="flex justify-end pt-2">
                        <button onClick={(e) => { e.stopPropagation(); setShowGuestDropdown(false); }} className="text-[15px] font-bold text-gray-900 underline cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">Close</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rooms selection moved outside of Guest Dropdown */}
                <div className="bg-white border border-gray-300 rounded-2xl mb-6">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Rooms</label>
                      <span className="text-sm text-gray-700">{roomsCount} Room{roomsCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setRoomsCount(g => Math.max(1, g - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900 disabled:opacity-30" disabled={roomsCount <= 1}>−</button>
                      <button onClick={() => setRoomsCount(g => Math.min(10, g + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors text-gray-500 hover:text-gray-900">+</button>
                    </div>
                  </div>
                  {roomsCount > 1 && selectedAdditionalRooms.map((roomIdVal, idx) => (
                    <div key={idx} className={`p-3 flex flex-col gap-1.5 border-t border-gray-300`}>
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

                     {getAppliedTaxPercent(total) > 0 && (
                      <div className="flex justify-between text-sm text-gray-550 font-semibold">
                        <span>Tax ({getAppliedTaxPercent(total)}%)</span>
                        <span>₹{getAppliedTax(total).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <hr className="border-gray-200 my-4" />
                    <div className="flex justify-between font-bold text-gray-900 text-lg">
                      <span>Total</span>
                      <span>₹{(total + getAppliedTax(total)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                {!clientOccupancyValidation.isAllowed && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2">
                    <Icons.AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                    <span>{clientOccupancyValidation.message}</span>
                  </div>
                )}

                {user?.role === 'admin' ? (
                  <Link 
                    to="/admin/bookings" 
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-base py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm mt-4 uppercase tracking-wider text-center border-none cursor-pointer"
                  >
                    Go to Admin Bookings
                  </Link>
                ) : (
                  <button 
                    onClick={handleBooking} 
                    disabled={bookingLoading || !room.isAvailable || (checkIn && checkOut && remainingRooms === 0) || !clientOccupancyValidation.isAllowed} 
                    className="w-full bg-[#FCE83A] hover:bg-[#FCE83A]/90 text-gray-900 font-bold text-lg py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-4"
                  >
                    {bookingLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    {remainingRooms === 0 ? 'Sold Out' : (!clientOccupancyValidation.isAllowed ? 'Invalid Guests' : (room.isAvailable ? 'Book Now' : 'Check Availability'))}
                  </button>
                )}
                <p className="text-sm text-gray-500 text-center mt-4">You won't be charged yet</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- MOBILE FIXED BOTTOM BAR (Silky Smooth Framer-Motion Animations) --- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/70 backdrop-blur-xl border-t border-white/50 px-5 py-3.5 z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
        {user?.role === 'admin' ? (
          <Link 
            to="/admin/bookings" 
            className="w-full bg-purple-700 active:bg-purple-800 text-white font-bold text-[16px] py-4 rounded-full flex items-center justify-center shadow-md uppercase tracking-wider text-center border-none cursor-pointer"
          >
            Go to Admin Bookings
          </Link>
        ) : (
          <div className="max-w-md mx-auto flex items-center justify-between gap-3 relative">
            {/* Left side: Price (top) & night (bottom) with fluid AnimatePresence */}
            <AnimatePresence initial={false}>
              {!isScrolledDown && (
                <motion.div
                  initial={{ opacity: 0, x: -20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 'auto' }}
                  exit={{ opacity: 0, x: -20, width: 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="flex flex-col text-left leading-tight overflow-hidden flex-shrink-0"
                >
                  <span className="text-xl font-extrabold text-gray-900 tracking-tight whitespace-nowrap">
                    ₹{(nights > 0 ? average : (room?.price || 0)).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gray-600 font-semibold mt-0.5 whitespace-nowrap">
                    {nights > 0 ? '/night avg' : 'night'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right side: Icon-free Fully Rounded Yellow Book Now button (smooth width transition without text distortion) */}
            <div className="flex-1 flex justify-end min-w-0">
              <button
                type="button"
                onClick={() => {
                  setMobileBookingStep(1);
                  setShowMobileBooking(true);
                }}
                disabled={!room?.isAvailable || (checkIn && checkOut && remainingRooms === 0) || !clientOccupancyValidation.isAllowed}
                className={`bg-[#FCE83A] hover:bg-[#fbdc19] active:bg-[#f0d00d] text-gray-900 font-extrabold text-base py-3.5 rounded-full shadow-md flex items-center justify-center transition-all duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  isScrolledDown ? 'w-full px-4' : 'w-[140px] sm:w-[160px] px-4'
                }`}
              >
                <span className="whitespace-nowrap truncate font-extrabold text-[16px] pointer-events-none select-none">
                  {remainingRooms === 0 ? 'Sold Out' : (!clientOccupancyValidation.isAllowed ? 'Invalid Guests' : (room?.isAvailable ? 'Book Now' : 'Check Availability'))}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MOBILE STEP-BY-STEP BOOKING WIZARD (Responsive layout for sm/md) --- */}
      {showMobileBooking && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Overlay click-to-close only on md viewports */}
          <div className="absolute inset-0 hidden md:block" onClick={() => setShowMobileBooking(false)} />
          
          <div className="w-full h-full md:max-w-[480px] md:h-[85vh] md:rounded-3xl md:shadow-2xl bg-white flex flex-col overflow-hidden animate-in md:zoom-in-95 slide-in-from-bottom duration-300 relative z-10">
            {/* Top Fixed Header with Back Arrow, Step Title, Progress Bar, and Close Button */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 bg-white shrink-0 z-10">
            <button
              type="button"
              onClick={() => {
                if (mobileBookingStep > 1) {
                  setMobileBookingStep(prev => prev - 1);
                } else {
                  setShowMobileBooking(false);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Step {mobileBookingStep} of 3
              </span>
              <span className="text-sm font-extrabold text-gray-900">
                {mobileBookingStep === 1 && 'Dates & Guests'}
                {mobileBookingStep === 2 && 'Enhance Your Stay'}
                {mobileBookingStep === 3 && 'Guest Details & Payment'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMobileBooking(false)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* --- SHADCN UI STYLE STEPPER CONNECTOR BAR --- */}
          <div className="w-full px-8 py-3.5 bg-gray-50/70 border-b border-gray-100 shrink-0">
            <div className="max-w-xs mx-auto flex items-center justify-between relative">
              {/* Connector Background Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 z-0" />
              
              {/* Active Connector Progress Line */}
              <div 
                className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-300 z-0" 
                style={{
                  width: mobileBookingStep === 1 ? '0%' : mobileBookingStep === 2 ? '50%' : 'calc(100% - 48px)'
                }}
              />

              {/* Step 1 Circle */}
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    mobileBookingStep > 1 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : mobileBookingStep === 1 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-md scale-105' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {mobileBookingStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-colors ${mobileBookingStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Dates
                </span>
              </div>

              {/* Step 2 Circle */}
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    mobileBookingStep > 2 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : mobileBookingStep === 2 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-md scale-105' 
                      : 'bg-white text-gray-700 border-2 border-gray-300 shadow-sm'
                  }`}
                >
                  {mobileBookingStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-colors ${mobileBookingStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Add-ons
                </span>
              </div>

              {/* Step 3 Circle */}
              <div className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    mobileBookingStep === 3 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-md scale-105' 
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  3
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-colors ${mobileBookingStep === 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                  Details
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Step Body */}
          <div className="flex-1 overflow-y-auto p-5 pb-36 space-y-5">
            {/* STEP 1: DATES & GUESTS SELECTION */}
            {mobileBookingStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">


                {/* Check-In & Check-Out 2-Column Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Check-In Card */}
                  <div
                    onClick={() => {
                      setActiveSelectType('checkIn');
                      setShowCalendarModal(true);
                    }}
                    className="bg-[#F8F9FA] rounded-xl px-3 py-2 flex items-center gap-2 border border-gray-200/70 cursor-pointer active:bg-gray-100 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex flex-col text-left min-w-0">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Check-in</label>
                      <div className={`text-xs truncate ${checkIn ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}>
                        {checkIn ? formatDisplayDate(checkIn, 'en-IN', { day: '2-digit', month: 'short' }) : 'Add date'}
                      </div>
                    </div>
                  </div>

                  {/* Check-Out Card */}
                  <div
                    onClick={() => {
                      setActiveSelectType('checkOut');
                      setShowCalendarModal(true);
                    }}
                    className="bg-[#F8F9FA] rounded-xl px-3 py-2 flex items-center gap-2 border border-gray-200/70 cursor-pointer active:bg-gray-100 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex flex-col text-left min-w-0">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Check-out</label>
                      <div className={`text-xs truncate ${checkOut ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}>
                        {checkOut ? formatDisplayDate(checkOut, 'en-IN', { day: '2-digit', month: 'short' }) : 'Add date'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- COMPACT GUESTS COUNTER CARD --- */}
                <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-sm space-y-2.5">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">GUESTS</span>
                      <span className="text-sm font-bold text-gray-900">
                        {adults + children} guest{adults + children !== 1 ? 's' : ''}
                        {infants > 0 && `, ${infants} infant${infants !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">
                      Max {(room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)) * roomsCount}
                    </span>
                  </div>

                  {/* Adults Row */}
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Adults</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Age 13+</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={adults <= 1}
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-4 text-center font-bold text-xs text-gray-900">{adults}</span>
                      <button
                        type="button"
                        disabled={adults + children >= (room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)) * roomsCount}
                        onClick={() => setAdults(adults + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children Row */}
                  <div className="flex justify-between items-center py-1 border-t border-gray-100/80">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Children</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Ages 2–12</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={children <= 0}
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-4 text-center font-bold text-xs text-gray-900">{children}</span>
                      <button
                        type="button"
                        disabled={adults + children >= (room.maxOccupancy !== undefined && room.maxOccupancy !== null ? room.maxOccupancy : (room.guests || 2)) * roomsCount}
                        onClick={() => setChildren(children + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Infants Row */}
                  <div className="flex justify-between items-center py-1 border-t border-gray-100/80">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Infants</h4>
                      <p className="text-[10px] text-gray-400 font-medium">Under 2</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={infants <= 0}
                        onClick={() => setInfants(Math.max(0, infants - 1))}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-4 text-center font-bold text-xs text-gray-900">{infants}</span>
                      <button
                        type="button"
                        disabled={infants >= 2 * roomsCount}
                        onClick={() => setInfants(infants + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Extra Bed Row if room allows extra bed */}
                  {room?.allowExtraBed && Number(room.extraBedCount) > 0 && (
                    <div className="flex justify-between items-center py-1 border-t border-gray-100/80">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Extra Bed</h4>
                        <p className="text-[10px] text-gray-400 font-medium">₹{Number(room.extraBedPrice || 0).toLocaleString('en-IN')} / bed / night</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          disabled={extraBedQty <= 0}
                          onClick={() => setExtraBedQty(Math.max(0, extraBedQty - 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-4 text-center font-bold text-xs text-gray-900">{extraBedQty}</span>
                        <button
                          type="button"
                          disabled={extraBedQty >= Number(room.extraBedCount)}
                          onClick={() => setExtraBedQty(Math.min(Number(room.extraBedCount), extraBedQty + 1))}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs text-gray-600 active:scale-95 disabled:opacity-30 disabled:border-gray-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
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

                {/* Additional Rooms Cards */}
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

                {/* Price Breakdown */}
                {nights > 0 && (
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹{average.toLocaleString('en-IN')} × {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    {getAppliedTaxPercent(total) > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tax ({getAppliedTaxPercent(total)}%)</span>
                        <span>₹{getAppliedTax(total).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 text-gray-900 font-extrabold text-lg border-t border-gray-100">
                      <span>Total</span>
                      <span>₹{(total + getAppliedTax(total)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ENHANCE YOUR STAY */}
            {mobileBookingStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-xl font-extrabold text-gray-900">Enhance Your Stay</h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Select optional add-ons to customize your stay</p>
                </div>

                {/* Add-ons Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Add-ons</h4>
                  {addons && addons.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {addons.map((addon) => {
                        const isSelected = selectedAddons.some(a => a._id === addon._id);
                        return (
                          <div
                            key={addon._id}
                            className="border border-gray-200 rounded-xl overflow-hidden bg-white flex items-center transition-all hover:shadow-md"
                          >
                            <div className="w-20 aspect-square shrink-0 relative bg-gray-50 overflow-hidden rounded-lg m-2">
                              {addon.image ? (
                                <img src={getImageUrl(addon.image)} className="w-full h-full object-cover" alt={addon.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Icons.Image className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 flex flex-col flex-1 min-w-0">
                              <h5 className="text-sm font-bold text-gray-900 truncate">{addon.name}</h5>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{addon.description || 'Optional service'}</p>
                              <div className="mt-auto pt-3 flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900">₹{Number(addon.price || 0).toLocaleString('en-IN')}</span>
                                <button
                                  type="button"
                                  onClick={() => handleAddonClick(addon)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#c5a880] border-[#c5a880] text-white shadow-sm'
                                      : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400'
                                  }`}
                                >
                                  {isSelected ? 'Added' : 'Add'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No add-ons available for this room.</p>
                  )}
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Room Total ({nights} nights)</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  {extraBedTotal > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Extra Bed ({extraBedQty})</span>
                      <span>₹{extraBedTotal.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between text-xs text-[#c5a880] font-semibold">
                      <span>Add-ons ({selectedAddons.length})</span>
                      <span>+₹{selectedAddons.reduce((sum, a) => sum + a.price, 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 text-gray-900 font-extrabold text-base border-t border-gray-200">
                    <span>Grand Total</span>
                    <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: GUEST DETAILS & PAYMENT */}
            {mobileBookingStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-xl font-extrabold text-gray-900">Guest Information</h2>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Enter your details to confirm booking</p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={guestInfo.fullName}
                      onChange={handleGuestInfoChange}
                      placeholder="Enter your full name"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={guestInfo.email}
                      onChange={handleGuestInfoChange}
                      placeholder="name@example.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={guestInfo.phone}
                      onChange={handleGuestInfoChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Special Requests</label>
                    <textarea
                      name="specialRequests"
                      value={guestInfo.specialRequests}
                      onChange={handleGuestInfoChange}
                      rows={2}
                      placeholder="Any preference or request..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-yellow-400 focus:bg-white transition-colors resize-none"
                    />
                  </div>

                  {/* Terms & Conditions */}
                  <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-yellow-500 focus:ring-yellow-400"
                    />
                    <span className="text-xs text-gray-600 leading-snug">
                      I agree to the{' '}
                      <Link
                        to="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-bold text-gray-900 underline"
                      >
                        Terms & Conditions
                      </Link>{' '}
                      and cancellation policy.
                    </span>
                  </label>
                </div>

                {/* Booking Details Summary Card */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-4 mt-4">
                  <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-3">Your Booking Details</h3>

                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-gray-900 text-sm">{room?.name}</span>
                    <span className="font-bold text-gray-900 text-sm">₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-3 text-[11px] text-gray-500 font-medium space-y-1">
                    <div className="text-gray-700">{formatDisplayDate(checkIn, 'en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} - {formatDisplayDate(checkOut, 'en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div>{nights} Night{nights > 1 ? 's' : ''} — {roomsCount} Room{roomsCount > 1 ? 's' : ''}, {adults} Adult{adults > 1 ? 's' : ''}</div>
                  </div>

                  <div className="space-y-2.5 border-t border-gray-100 pt-3 text-xs">
                    <div className="flex justify-between items-center text-gray-600 gap-2">
                      <span className="truncate" title={room?.name}>Room - {room?.name}</span>
                      <span className="font-semibold text-gray-900 shrink-0">₹{total.toLocaleString('en-IN')}</span>
                    </div>

                    {selectedAddons.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-50">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Add-on Services</span>
                        {selectedAddons.map(a => (
                          <div key={a._id} className="flex justify-between text-gray-500 text-[11px]">
                            <span>• {a.name}</span>
                            <span>₹{a.price.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {extraBedQty > 0 && (
                      <div className="flex justify-between text-gray-500 text-[11px] pt-2 border-t border-gray-50">
                        <span>• Extra Bed ({extraBedQty} × {nights} night{nights > 1 ? 's' : ''})</span>
                        <span>₹{extraBedTotal.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600 border-t border-gray-100 pt-2.5">
                      <span>Sub Total</span>
                      <span className="font-semibold text-gray-900">₹{(total + selectedAddons.reduce((sum, a) => sum + a.price, 0) + extraBedTotal).toLocaleString('en-IN')}</span>
                    </div>

                    {getAppliedTaxPercent(total) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Taxes and Fees ({getAppliedTaxPercent(total)}%)</span>
                        <span className="font-semibold text-gray-900">₹{getAppliedTax(total).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-gray-900 font-extrabold text-sm border-t border-gray-200 pt-3">
                      <span>Grand Total</span>
                      <span className="text-[#c5a880] text-base">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Fixed Action Footer */}
          <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0 z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
            {!clientOccupancyValidation.isAllowed && mobileBookingStep === 1 && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-start gap-2 mb-2">
                <Icons.AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
                <span>{clientOccupancyValidation.message}</span>
              </div>
            )}

            {mobileBookingStep === 1 && (
              <button
                type="button"
                onClick={() => {
                  if (!checkIn || !checkOut) {
                    toast.error('Please select check-in and check-out dates');
                    setActiveSelectType('checkIn');
                    setShowCalendarModal(true);
                    return;
                  }
                  if (checkIn === checkOut) {
                    toast.error('Minimum stay is 1 night.');
                    return;
                  }
                  if (nights <= 0) {
                    toast.error('Invalid date range');
                    return;
                  }
                  if (!clientOccupancyValidation.isAllowed) {
                    toast.error(clientOccupancyValidation.message);
                    return;
                  }
                  setMobileBookingStep(2);
                }}
                disabled={!room?.isAvailable || (checkIn && checkOut && remainingRooms === 0) || !clientOccupancyValidation.isAllowed}
                className="w-full bg-[#FCE83A] active:bg-[#f3df2c] text-gray-900 font-extrabold text-[16px] py-4 rounded-full transition-all active:scale-[0.98] disabled:opacity-50 shadow-md flex justify-center items-center gap-2 cursor-pointer"
              >
                <span>Continue to Add-ons</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {mobileBookingStep === 2 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddons([]);
                    setMobileBookingStep(3);
                  }}
                  className="shrink-0 px-4 h-11 bg-white active:bg-gray-50 text-gray-700 font-bold text-[13px] rounded-full transition-all cursor-pointer border-2 border-dashed border-gray-300"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setMobileBookingStep(3)}
                  className="flex-1 bg-linear-to-r from-[#FCE83A] to-[#f3d90c] active:scale-[0.98] text-gray-900 font-extrabold text-[13px] h-11 rounded-full transition-all shadow-lg shadow-yellow-400/30 flex justify-center items-center gap-1.5 cursor-pointer"
                >
                  <span>Guest Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {mobileBookingStep === 3 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileBookingStep(2)}
                  aria-label="Back"
                  className="shrink-0 w-11 h-11 bg-gray-100 active:bg-gray-200 text-gray-700 rounded-full transition-all cursor-pointer flex items-center justify-center border border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={initiateGuestBookingPayment}
                  disabled={bookingLoading || paymentProcessing}
                  className="flex-1 bg-[#FCE83A] active:bg-[#f3df2c] text-gray-900 font-extrabold text-[14px] h-11 rounded-full transition-all active:scale-[0.98] disabled:opacity-50 shadow-md flex justify-center items-center gap-2 cursor-pointer"
                >
                  {(bookingLoading || paymentProcessing) && <Loader2 className="w-5 h-5 animate-spin mr-1" />}
                  <span>Confirm & Pay ₹{finalTotal.toLocaleString('en-IN')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* --- ALL AMENITIES MODAL (Airbnb Style) --- */}
      {showAllAmenitiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
          <div
            className="absolute inset-0 bg-black/60 transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowAllAmenitiesModal(false)}
          />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 md:p-8 flex flex-col max-h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200 z-10">
            <div className="flex justify-start items-center pb-6">
              <button
                onClick={() => setShowAllAmenitiesModal(false)}
                className="w-9 h-9 hover:bg-gray-100 rounded-full flex items-center justify-center text-[#222222] transition-all cursor-pointer -ml-2 mr-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <h2 className="text-3xl font-bold text-[#222222] mb-8">What this place offers</h2>
              
              {(() => {
                const grouped = room.amenities?.reduce((acc, amenity) => {
                  const cat = getCategoryForAmenity(amenity.name);
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(amenity);
                  return acc;
                }, {});
                
                return Object.entries(grouped || {}).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-xl font-semibold text-[#222222] mb-6">{category}</h3>
                    <div className="flex flex-col gap-5">
                      {items.map((a, i) => {
                        const svgSrc = AMENITY_SVG_MAP[a.name];
                        const Icon = getIcon(a.icon);
                        return (
                          <div key={i} className="flex items-center gap-4 text-[#222222] pb-5 border-b border-gray-200 last:border-b-0">
                            {svgSrc ? (
                              <img src={svgSrc} className="w-6 h-6 object-contain" alt={a.name} style={{ filter: 'grayscale(100%) opacity(0.8)' }} />
                            ) : (
                              <Icon className="w-7 h-7 text-[#222222] stroke-[1.5]" />
                            )}
                            <span className="font-normal text-[16px]">{a.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
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
            <div className="flex justify-start items-center pb-2">
              <button
                onClick={() => setShowAllReviewsModal(false)}
                className="w-9 h-9 hover:bg-gray-100 rounded-full flex items-center justify-center text-[#222222] transition-all cursor-pointer -ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body - Stripped select-none and added GPU scroll acceleration */}
            <div
              className="overflow-y-auto overscroll-contain pr-2 mt-4 flex-1 space-y-6 scrollbar-thin scrollbar-thumb-gray-200"
              style={{ WebkitOverflowScrolling: 'touch', transform: 'translate3d(0,0,0)' }}
            >
              {/* Ratings Summary */}
              <div className="flex items-start gap-3 flex-col mb-6">
                <div className="flex items-center gap-1.5">
                  <Star className="w-6 h-6 text-[#222222] fill-[#222222]" />
                  <span className="text-[32px] font-bold text-[#222222] tracking-tight leading-none">
                    {reviews.length > 0 && room.rating ? room.rating.toFixed(2) : '0.00'}
                  </span>
                </div>
                <span className="text-[#222222] font-semibold underline cursor-pointer text-sm">How reviews work</span>
              </div>

              {/* Sub-ratings categories horizontally scrollable */}
              <div className="flex overflow-x-auto gap-4 pb-6 mb-6 border-b border-gray-200 custom-scrollbar">
                <div className="flex items-start flex-col justify-center border-r border-gray-200 pr-6 min-w-[120px]">
                  <span className="text-[#222222] text-[13px] font-medium mb-2">Overall rating</span>
                  <div className="flex flex-col gap-0.5 w-full mt-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-[#222222] w-2">{star}</span>
                        <div className="flex-1 h-1 bg-[#DDDDDD] rounded-full overflow-hidden w-24">
                          <div className="h-full bg-[#222222]" style={{ width: star === 5 ? '80%' : star === 4 ? '15%' : '0%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {dynamicStats.map((stat, i) => (
                  <div key={i} className="flex flex-col items-start justify-between min-w-[110px] pl-2 pr-6 border-r border-gray-200 last:border-0">
                    <span className="text-[#222222] text-[13px] font-medium mb-1">{stat.label}</span>
                    <span className="text-[#222222] text-[16px] font-bold mt-1">{stat.score.toFixed(1)}</span>
                    <div className="mt-3">
                      <Star className="w-5 h-5 text-[#222222]" strokeWidth={1.5} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Reviews List */}
              <div>
                <h4 className="text-2xl font-bold text-[#222222] mb-6">{reviews.length} reviews</h4>
                <div className="flex flex-col">
                  {reviews.slice(0, loadedReviewsCount).map((rev, index) => renderReviewCard(rev, index))}
                </div>

                {/* Load More Button */}
                {loadedReviewsCount < reviews.length && (
                  <div className="flex justify-start pt-8 pb-4">
                    <button
                      onClick={() => setLoadedReviewsCount(prev => prev + 10)}
                      className="px-6 py-3 border border-[#222222] text-[#222222] font-semibold rounded-lg hover:bg-gray-50 active:scale-95 transition-all text-[15px] bg-transparent cursor-pointer"
                    >
                      Show more reviews
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCalendarModal(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-[380px] md:max-w-[700px] bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.15)] overflow-hidden p-4 sm:p-6 z-10 animate-in zoom-in-95 duration-200">


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
              <div className="flex-1">
                {nights > 0 && (
                  <span className="font-bold text-gray-900 text-[15px] ml-1">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

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

      {/* Addon Details Modal */}
      {selectedAddonForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col relative">
            <button
              onClick={() => setSelectedAddonForModal(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 transition-colors cursor-pointer border-none"
            >
              <Icons.X className="w-5 h-5" />
            </button>
            
            <div className="w-full h-48 bg-gray-100 relative shrink-0">
              {selectedAddonForModal.image ? (
                <img src={getImageUrl(selectedAddonForModal.image)} className="w-full h-full object-cover" alt={selectedAddonForModal.name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Icons.Image className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <div className="p-5 md:p-6 overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedAddonForModal.name}</h2>
              <p className="text-[16px] font-semibold text-gray-800 mb-4">₹{selectedAddonForModal.price.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-500">per service</span></p>
              
              <div className="prose prose-sm text-gray-600">
                {selectedAddonForModal.description ? (
                  <p className="leading-relaxed text-[13px]">{selectedAddonForModal.description}</p>
                ) : (
                  <p className="italic text-gray-400 text-sm">No detailed description provided for this service.</p>
                )}
              </div>
            </div>
            
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  const isAlreadySelected = selectedAddons.some(a => a._id === selectedAddonForModal._id);
                  if (!isAlreadySelected) handleAddonClick(selectedAddonForModal);
                  setSelectedAddonForModal(null);
                }}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 cursor-pointer border-none text-sm"
              >
                {selectedAddons.some(a => a._id === selectedAddonForModal._id) ? 'Already Added' : 'Add to Stay'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomDetailPage;
