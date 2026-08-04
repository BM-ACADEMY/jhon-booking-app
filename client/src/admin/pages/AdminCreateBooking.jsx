import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  Users as UsersIcon,
  Layers,
  CreditCard,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  FileText,
  Building,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Info,
  X
} from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const SERVER_URL = import.meta.env.VITE_BASE_URL || '';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const getAdvancePercent = (settingsObj, nightsCount) => {
  if (!settingsObj) return 30;
  if (nightsCount === 1) return settingsObj.advancePercent1Day ?? 100;
  if (nightsCount === 2) return settingsObj.advancePercent2Day ?? 50;
  if (nightsCount === 3) return settingsObj.advancePercent3Day ?? 40;
  if (nightsCount === 4) return settingsObj.advancePercent4Day ?? 30;
  if (nightsCount >= 5 && nightsCount <= 7) return settingsObj.advancePercent5To7Days ?? 25;
  return settingsObj.advancePercentAbove7Days ?? 20;
};

const getAppliedTax = (amount, nightsCount = 1, taxRules = []) => {
  if (amount <= 0) return 0;
  const perDayAmount = amount / Math.max(1, nightsCount);
  if (!taxRules || taxRules.length === 0) {
    const taxRate = perDayAmount > 7500 ? 0.18 : 0.12;
    return Math.round(amount * taxRate);
  }
  const matchedRule = taxRules.find(r => perDayAmount >= r.minAmount && perDayAmount <= r.maxAmount);
  return matchedRule ? Math.round(amount * (matchedRule.taxPercent / 100)) : 0;
};

const getAppliedTaxPercent = (amount, nightsCount = 1, taxRules = []) => {
  if (amount <= 0) return 0;
  const perDayAmount = amount / Math.max(1, nightsCount);
  if (!taxRules || taxRules.length === 0) {
    return perDayAmount > 7500 ? 18 : 12;
  }
  const matchedRule = taxRules.find(r => perDayAmount >= r.minAmount && perDayAmount <= r.maxAmount);
  return matchedRule ? matchedRule.taxPercent : 0;
};

const AdminCreateBooking = () => {
  const navigate = useNavigate();

  // Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  // Settings & Rules from API
  const [settings, setSettings] = useState(null);
  const [taxRules, setTaxRules] = useState([]);

  // Rooms & Addons list from API
  const [rooms, setRooms] = useState([]);
  const [availableAddons, setAvailableAddons] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selected Booking Parameters
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [extraRoomIds, setExtraRoomIds] = useState([]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  const handleRoomsCountChange = (newCount) => {
    const validCount = Math.max(1, Math.min(10, newCount));
    setRoomsCount(validCount);
    if (validCount > 1) {
      setExtraRoomIds(prev => {
        const next = [...prev];
        if (next.length < validCount - 1) {
          while (next.length < validCount - 1) {
            next.push('');
          }
        } else if (next.length > validCount - 1) {
          next.length = validCount - 1;
        }
        return next;
      });
    } else {
      setExtraRoomIds([]);
    }
  };

  // Interactive Calendar Popover States
  const calendarRef = useRef(null);
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [activeSelectType, setActiveSelectType] = useState('checkIn');

  // Close Popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendarPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Payment Options
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'advance'
  const [advancePercent, setAdvancePercent] = useState(30);

  // Processing & Confirmation State
  const [submitting, setSubmitting] = useState(false);
  const [createdBookingResult, setCreatedBookingResult] = useState(null);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const pollIntervalRef = useRef(null);

  // Poll Razorpay payment link status; once the customer pays, redirect to the Bookings section
  useEffect(() => {
    const linkId = createdBookingResult?.paymentLinkId;
    if (!linkId) return;

    setWaitingForPayment(true);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/bookings/payment-link-status/${linkId}`);
        if (res.data?.paid) {
          clearInterval(pollIntervalRef.current);
          setWaitingForPayment(false);
          toast.success('Payment received! Booking confirmed.');
          navigate('/admin/bookings');
        }
      } catch (err) {
        console.error('Payment link status check failed:', err);
      }
    }, 5000);

    return () => clearInterval(pollIntervalRef.current);
  }, [createdBookingResult?.paymentLinkId, navigate]);

  // Check if a specific date is booked or blocked for selected room
  const isDateBooked = (date) => {
    if (!selectedRoom) return false;

    // Check unavailableDates array (dates when room inventory is fully booked)
    const isBooked = selectedRoom.unavailableDates && selectedRoom.unavailableDates.some(d => {
      const unDate = new Date(d);
      return unDate.getFullYear() === date.getFullYear() &&
             unDate.getMonth() === date.getMonth() &&
             unDate.getDate() === date.getDate();
    });
    if (isBooked) return true;

    // Check blockedDates array (dates blocked for maintenance / admin block)
    const isBlocked = selectedRoom.blockedDates && selectedRoom.blockedDates.some(block => {
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
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    if (activeSelectType === 'checkIn' || !checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr);
      setCheckOut('');
      setActiveSelectType('checkOut');
    } else {
      if (dateStr <= checkIn) {
        setCheckIn(dateStr);
        setCheckOut('');
        setActiveSelectType('checkOut');
      } else {
        // Check if any date in range is booked/blocked
        const start = new Date(checkIn);
        const end = new Date(dateStr);
        let hasBooked = false;
        const temp = new Date(start);
        while (temp < end) {
          if (isDateBooked(temp)) {
            hasBooked = true;
            break;
          }
          temp.setDate(temp.getDate() + 1);
        }

        if (hasBooked) {
          toast.error('Selected date range contains booked or blocked dates.');
          setCheckIn(dateStr);
          setCheckOut('');
          setActiveSelectType('checkOut');
        } else {
          setCheckOut(dateStr);
          setActiveSelectType('checkIn');
          // Automatically close popover after valid range picked
          setTimeout(() => setShowCalendarPopover(false), 250);
        }
      }
    }
  };

  const renderSingleMonthGrid = (monthDate, showPrevArrow = false, showNextArrow = false) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthNamesList = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNamesList[month];
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const dayCells = [];
    for (let i = 0; i < firstDay; i++) {
      dayCells.push(<div key={`pad-${i}`} className="w-9 h-9 sm:w-10 sm:h-10 mx-auto" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const thisDate = new Date(year, month, day);
      const isPast = isDateInPast(thisDate);
      const isBooked = isDateBooked(thisDate);
      const isDisabled = isPast || isBooked;

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckIn = checkIn === dateStr;
      const isCheckOut = checkOut === dateStr;

      let inRange = false;
      if (checkIn && checkOut) {
        inRange = dateStr > checkIn && dateStr < checkOut;
      } else if (checkIn && hoveredDate) {
        inRange = dateStr > checkIn && dateStr <= hoveredDate;
      }

      let dayPrice = selectedRoom?.price || 0;
      if (selectedRoom?.datePrices && Array.isArray(selectedRoom.datePrices)) {
        const found = selectedRoom.datePrices.find(dp => dp.date && new Date(dp.date).toISOString().split('T')[0] === dateStr);
        if (found) dayPrice = found.price;
      }

      let cellWrapperClass = "relative w-9 h-9 sm:w-10 sm:h-10 mx-auto flex items-center justify-center ";
      let dayBtnClass = "w-9 h-9 sm:w-10 sm:h-10 flex flex-col items-center justify-center transition-all duration-150 relative text-xs rounded-xl border ";

      let dayNumColor = "!text-gray-900 font-black";
      let priceTagColor = "!text-gray-600 font-bold";

      if (isDisabled) {
        if (isBooked) {
          dayBtnClass += "bg-gray-100/90 border-gray-300 cursor-not-allowed opacity-80 ";
          dayNumColor = "!text-black !font-black line-through";
          priceTagColor = "!text-red-600 !font-extrabold line-through";
        } else {
          dayBtnClass += "bg-gray-50 border-transparent cursor-not-allowed ";
          dayNumColor = "!text-gray-300 !font-medium";
          priceTagColor = "!text-gray-300";
        }
      } else if (isCheckIn || isCheckOut) {
        dayBtnClass += "bg-primary-600 !text-white font-black border-2 border-primary-700 shadow-md scale-105 z-10 ";
        dayNumColor = "!text-white !font-black";
        priceTagColor = "!text-primary-100 !font-bold";
        if (isCheckIn && checkOut) cellWrapperClass += "bg-slate-200 rounded-l-xl ";
        if (isCheckOut && checkIn) cellWrapperClass += "bg-slate-200 rounded-r-xl ";
      } else if (inRange) {
        cellWrapperClass += "bg-slate-200 ";
        dayBtnClass += "bg-slate-200 border-transparent rounded-none ";
        dayNumColor = "!text-slate-950 !font-black";
        priceTagColor = "!text-slate-800 !font-bold";
      } else {
        dayBtnClass += "bg-white border-gray-200 hover:bg-gray-100 hover:border-gray-300 cursor-pointer ";
        dayNumColor = "!text-gray-900 !font-black";
        priceTagColor = "!text-gray-600 !font-bold";
      }

      dayCells.push(
        <div
          key={`day-${day}`}
          className={cellWrapperClass}
          onMouseEnter={() => !isDisabled && checkIn && !checkOut && setHoveredDate(dateStr)}
          onMouseLeave={() => setHoveredDate(null)}
          onClick={() => !isDisabled && handleDateClick(thisDate)}
          title={isBooked ? 'Date Booked / Blocked' : (isPast ? 'Past Date' : `Select ${dateStr}`)}
        >
          <button
            type="button"
            disabled={isDisabled}
            className={dayBtnClass}
          >
            <span className={`text-xs leading-none ${dayNumColor}`}>
              {day}
            </span>
            {!isPast && (
              <span className={`text-[8px] leading-none mt-0.5 font-mono ${priceTagColor}`}>
                {isBooked ? 'Booked' : `₹${dayPrice?.toLocaleString('en-IN')}`}
              </span>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3 font-sans shrink-0">
        {/* Month Header */}
        <div className="flex items-center justify-between px-1 h-8 mb-1">
          {showPrevArrow ? (
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-xl border border-gray-300 text-gray-800 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : <div className="w-7" />}

          <span className="font-black text-sm sm:text-base text-gray-900 tracking-tight">
            {monthName} {year}
          </span>

          {showNextArrow ? (
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-xl border border-gray-300 text-gray-800 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : <div className="w-7" />}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-gray-700 tracking-wider">
          {weekdays.map(w => <div key={w} className="w-9 sm:w-10 mx-auto">{w}</div>)}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1">
          {dayCells}
        </div>
      </div>
    );
  };

  const renderTwoMonths = (monthDate) => {
    const nextMonthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

    return (
      <div className="bg-white border-2 border-gray-200 shadow-2xl rounded-2xl p-4 sm:p-5 w-auto font-sans space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 sm:gap-8">
          {renderSingleMonthGrid(monthDate, true, false)}
          {renderSingleMonthGrid(nextMonthDate, false, true)}
        </div>
      </div>
    );
  };

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [roomsRes, addonsRes, settingsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/addons').catch(() => ({ data: [] })),
          api.get('/settings').catch(() => ({ data: null }))
        ]);
        
        const activeRooms = (roomsRes.data || []).filter(r => r.status !== 'archived' && r.status !== 'draft');
        setRooms(activeRooms);
        if (activeRooms.length > 0) {
          setSelectedRoomId(activeRooms[0]._id);
        }
        setAvailableAddons(addonsRes.data || []);
        if (settingsRes.data) {
          setSettings(settingsRes.data);
          setTaxRules(settingsRes.data.taxRules || []);
        }
      } catch (err) {
        toast.error('Failed to load rooms, addons or settings data');
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();

  }, []);

  // Selected Room Object
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r._id === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  // Calculate Nights
  const nightsCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  // Update advance percent dynamically based on settings and nightsCount
  useEffect(() => {
    if (settings && nightsCount > 0) {
      const percent = getAdvancePercent(settings, nightsCount);
      setAdvancePercent(percent);
    }
  }, [settings, nightsCount]);

  // Calculate Addons Total
  const addonsTotal = useMemo(() => {
    return selectedAddonIds.reduce((sum, id) => {
      const addon = availableAddons.find(a => a._id === id);
      return sum + (addon ? (addon.price || 0) : 0);
    }, 0);
  }, [selectedAddonIds, availableAddons]);

  // Calculate Room Subtotal, Dynamic GST Tax & Grand Total
  const totalPerNightForSelectedRooms = useMemo(() => {
    const r1Price = selectedRoom?.price || 0;
    const extraPrices = extraRoomIds.reduce((sum, id) => {
      const match = rooms.find(r => r._id === id);
      return sum + (match ? (match.price || 0) : r1Price);
    }, 0);
    return r1Price + extraPrices;
  }, [selectedRoom, extraRoomIds, rooms]);

  const roomPricePerNight = totalPerNightForSelectedRooms;
  const roomSubtotal = totalPerNightForSelectedRooms * nightsCount;
  const stayTax = getAppliedTax(roomSubtotal, nightsCount, taxRules);
  const stayTaxPercent = getAppliedTaxPercent(roomSubtotal, nightsCount, taxRules);
  const grandTotal = roomSubtotal + stayTax + addonsTotal;

  // Calculate Advance Amount
  const advanceAmount = useMemo(() => {
    return Math.round(grandTotal * (advancePercent / 100));
  }, [grandTotal, advancePercent]);

  // Calculate Paid vs Due Amount based on Payment Option
  const calculatedPaidAmount = useMemo(() => {
    if (paymentType === 'advance') {
      return advanceAmount;
    }
    return grandTotal; // Full Payment
  }, [paymentType, grandTotal, advanceAmount]);

  const calculatedDueAmount = Math.max(0, grandTotal - calculatedPaidAmount);

  // Toggle Addon Selection
  const toggleAddon = (addonId) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Submit Booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();

    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (!customerName.trim()) {
      toast.error('Please enter customer full name');
      return;
    }
    if (!phoneDigits || phoneDigits.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!selectedRoomId) {
      toast.error('Please select a room');
      return;
    }
    if (nightsCount <= 0) {
      toast.error('Check-out date must be after Check-in date');
      return;
    }

    const r1Cap = selectedRoom?.maxOccupancy !== undefined && selectedRoom?.maxOccupancy !== null ? selectedRoom.maxOccupancy : (selectedRoom?.guests || 3);
    const maxCapacityVal = r1Cap + extraRoomIds.reduce((sum, id) => {
      const match = rooms.find(r => r._id === id);
      return sum + (match ? (match.maxOccupancy ?? match.guests ?? 3) : r1Cap);
    }, 0);

    if (adults + children > maxCapacityVal) {
      toast.error(`Total guests (${adults + children}) exceeds maximum capacity (${maxCapacityVal}) for ${roomsCount} room(s). Please increase number of rooms.`);
      return;
    }

    try {
      setSubmitting(true);

      const selectedAddonObjects = selectedAddonIds.map(id => {
        const item = availableAddons.find(a => a._id === id);
        return {
          name: item?.name || 'Addon',
          price: item?.price || 0,
          iconType: item?.iconType || ''
        };
      });

      const resolvedExtraRoomIds = extraRoomIds.map(id => id || selectedRoomId);
      while (resolvedExtraRoomIds.length < roomsCount - 1) {
        resolvedExtraRoomIds.push(selectedRoomId);
      }
      const allSelectedRoomIds = [selectedRoomId, ...resolvedExtraRoomIds];

      const payload = {
        customerDetails: {
          name: customerName.trim(),
          phone: phoneDigits,
          email: customerEmail.trim()
        },
        room: selectedRoomId,
        selectedRoomIds: allSelectedRoomIds,
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        infants: Number(infants),
        roomsCount: Number(roomsCount),
        totalAmount: grandTotal,
        paidAmount: calculatedPaidAmount,
        paymentType: paymentType,
        paymentStatus: 'unpaid',
        paymentNotes: '',
        addons: selectedAddonObjects,
        specialRequests: '',
        gstNumber: gstNumber.trim()
      };

      const res = await api.post('/bookings/admin-create', payload);
      setCreatedBookingResult(res.data);

      const { booking, paymentUrl, isLinkOnly } = res.data;

      if (isLinkOnly || paymentUrl) {
        toast.success('Razorpay Payment Link Generated! Opening WhatsApp...');
        const phone = customerPhone.replace(/\D/g, '');
        const cleanPhone = phone.startsWith('91') ? phone : (phone.length === 10 ? `91${phone}` : phone);
        const roomName = selectedRoom?.name || 'Villa Room';
        const cIn = new Date(checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const cOut = new Date(checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const amountLabel = paymentType === 'advance' 
          ? `₹${advanceAmount.toLocaleString('en-IN')} (50% Advance)` 
          : `₹${grandTotal.toLocaleString('en-IN')} (Full Payment)`;

        const textMsg = 
`Hello *${customerName}*! 👋

Complete your room booking payment for *The Balified Villa*! 🏨✨

📋 *Booking Details:*
• *Room:* ${roomName} (${roomsCount} Room${roomsCount > 1 ? 's' : ''})
• *Check-In:* ${cIn}
• *Check-Out:* ${cOut} (${nightsCount} Night${nightsCount > 1 ? 's' : ''})
• *Guests:* ${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child` : ''}

💳 *Payment Amount:* ${amountLabel}

🔗 *Razorpay Payment Link:* ${paymentUrl}

Please complete your payment using the link above. Once payment is completed, your room booking will instantly be confirmed!

Thank you for choosing The Balified Villa! 🌴`;

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`;
        window.open(waUrl, '_blank');
      } else {
        toast.success('Room Booking Created Successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Build WhatsApp Share URL with target="_blank"
  const getWhatsAppShareUrl = () => {
    if (!createdBookingResult) return '';
    const { booking, paymentUrl } = createdBookingResult;
    const phone = customerPhone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : (phone.length === 10 ? `91${phone}` : phone);

    const roomName = selectedRoom?.name || 'Villa Room';
    const cIn = new Date(checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const cOut = new Date(checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const bookingIdLine = booking?._id ? `• *Booking ID:* #${booking._id.slice(-6).toUpperCase()}\n` : '';

    const textMsg = 
`Hello *${customerName}*! 👋

Complete your room booking payment for *The Balified Villa*! 🏨✨

📋 *Booking Details:*
${bookingIdLine}• *Room:* ${roomName} (${roomsCount} Room${roomsCount > 1 ? 's' : ''})
• *Check-In:* ${cIn}
• *Check-Out:* ${cOut} (${nightsCount} Night${nightsCount > 1 ? 's' : ''})
• *Guests:* ${adults} Adult${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} Child` : ''}

💳 *Payment Amount:* ₹${(calculatedDueAmount > 0 ? calculatedDueAmount : grandTotal).toLocaleString('en-IN')}

🔗 *Razorpay Payment Link:* ${paymentUrl}

Please complete your payment using the link above. Once payment is completed, your room booking will instantly be confirmed!

Thank you for choosing The Balified Villa! 🌴`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Payment Link copied to clipboard!');
  };

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-3" />
        <p className="text-sm font-semibold text-gray-600">Loading booking setup...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/bookings')}
            className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <BedDouble className="w-7 h-7 text-primary-600" />
              Create Customer Room Booking
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Admin Direct Booking Panel • Select Room, Add-ons, Dates & Share Razorpay Payment Link via WhatsApp
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/admin/bookings')}
          className="rounded-xl font-medium text-xs border-gray-200 hover:bg-gray-50"
        >
          View All Bookings
        </Button>
      </div>

      {/* Confirmation Card when Booking Created */}
      {createdBookingResult ? (
        <Card className="p-8 border border-green-200 bg-emerald-50/40 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-green-200/60 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Booking Created Successfully
              </span>
              <h2 className="text-2xl font-black text-gray-900 mt-1">
                {createdBookingResult.booking ? `Booking ID: #${createdBookingResult.booking._id.slice(-6).toUpperCase()}` : 'Payment Link Sent via WhatsApp'}
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Customer: <span className="font-bold text-gray-900">{customerName}</span> ({customerPhone})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Room Reserved</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{selectedRoom?.name}</p>
              <p className="text-xs text-gray-500">{nightsCount} Nights ({checkIn} to {checkOut})</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Total Amount</p>
              <p className="text-lg font-black text-emerald-600 mt-1">₹{grandTotal.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500">Paid: ₹{calculatedPaidAmount.toLocaleString('en-IN')} | Due: ₹{calculatedDueAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Payment Link Generated</p>
              <p className="text-xs font-mono truncate text-gray-700 font-semibold mt-1">
                {createdBookingResult.paymentUrl || 'N/A'}
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(createdBookingResult.paymentUrl)}
                className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1 mt-1"
              >
                <Copy className="w-3 h-3" /> Copy Payment Link
              </button>
            </div>
          </div>

          {selectedAddonIds.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-2">Selected Add-ons ({selectedAddonIds.length})</p>
              <ul className="space-y-1">
                {selectedAddonIds.map(id => {
                  const addon = availableAddons.find(a => a._id === id);
                  if (!addon) return null;
                  return (
                    <li key={id} className="flex justify-between text-xs">
                      <span className="text-gray-700 font-semibold">{addon.name}</span>
                      <span className="text-gray-900 font-bold">₹{(addon.price || 0).toLocaleString('en-IN')}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* WhatsApp Share CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Share Booking Details & Payment Link on WhatsApp
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Directly sends pre-formatted message with Razorpay link to {customerPhone}
              </p>
            </div>
            
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-emerald-800 font-extrabold rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-sm shrink-0"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              Share on WhatsApp
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>

          {waitingForPayment && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
              <p className="text-xs font-semibold text-amber-800">
                Waiting for customer to complete payment... You'll be redirected to the Bookings section automatically once payment is received.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                clearInterval(pollIntervalRef.current);
                setWaitingForPayment(false);
                setCreatedBookingResult(null);
              }}
              className="rounded-xl"
            >
              Create Another Booking
            </Button>
            <Button
              onClick={() => navigate('/admin/bookings')}
              className="bg-gray-900 hover:bg-black text-white rounded-xl"
            >
              Go to Bookings List
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleCreateBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Left Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Customer Details */}
            <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <User className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-base text-gray-900">1. Customer Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="pl-9 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      required
                      className="pl-9 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address <span className="text-gray-400 font-normal">(Receives Booking Confirmation & Payment Link)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="pl-9 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    GST Number <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="pl-9 rounded-xl text-sm uppercase"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 2: Room Selection & Stay Dates */}
            <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <BedDouble className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-base text-gray-900">2. Room & Stay Details</h2>
              </div>

              {/* Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Room Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
                >
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} • ₹{r.price?.toLocaleString('en-IN')}/night ({r.category || 'Villa'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Room Preview */}
              {selectedRoom && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-2xs">
                  <div className="w-16 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                    <img
                      src={getImageUrl(selectedRoom.images?.[0]) || 'https://via.placeholder.com/150'}
                      alt={selectedRoom.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {selectedRoom.name} {roomsCount > 1 ? `(1 Of ${roomsCount})` : ''}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Category: {selectedRoom.category || 'Villa'} • Max Guests: {selectedRoom.maxOccupancy !== undefined && selectedRoom.maxOccupancy !== null ? selectedRoom.maxOccupancy : (selectedRoom.guests || 2)}
                    </p>
                    <p className="text-xs font-bold text-primary-600 mt-0.5">
                      ₹{selectedRoom.price?.toLocaleString('en-IN')} / night
                    </p>
                  </div>
                </div>
              )}

              {/* Check-In & Check-Out Date Trigger Buttons with Popover Dropdown Calendar */}
              <div className="relative pt-2" ref={calendarRef}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Check-In Date <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSelectType('checkIn');
                        setShowCalendarPopover(true);
                      }}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-white hover:bg-gray-50 flex items-center justify-between font-medium text-gray-900 transition-all shadow-sm ${
                        showCalendarPopover && activeSelectType === 'checkIn'
                          ? 'border-primary-600 ring-2 ring-primary-100'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Calendar className="w-4 h-4 text-primary-600 shrink-0" />
                        <span className={checkIn ? 'text-gray-900 font-bold' : 'text-gray-400'}>
                          {checkIn ? new Date(checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                        </span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Check-Out Date <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSelectType('checkOut');
                        setShowCalendarPopover(true);
                      }}
                      className={`w-full h-10 px-3 border rounded-xl text-sm bg-white hover:bg-gray-50 flex items-center justify-between font-medium text-gray-900 transition-all shadow-sm ${
                        showCalendarPopover && activeSelectType === 'checkOut'
                          ? 'border-primary-600 ring-2 ring-primary-100'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Calendar className="w-4 h-4 text-primary-600 shrink-0" />
                        <span className={checkOut ? 'text-gray-900 font-bold' : 'text-gray-400'}>
                          {checkOut ? new Date(checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select Date'}
                        </span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Floating Availability Calendar Dropdown Popover (Dual Month Light Mode) */}
                {showCalendarPopover && (
                  <div className="absolute z-50 top-full left-0 mt-2 w-auto max-w-[95vw] sm:max-w-none animate-in fade-in slide-in-from-top-2 duration-200">
                    {renderTwoMonths(calendarMonth)}
                  </div>
                )}
              </div>

              {/* Guest & Room Counters Card matching image design */}
              {(() => {
                const r1Cap = selectedRoom?.maxOccupancy !== undefined && selectedRoom?.maxOccupancy !== null 
                  ? selectedRoom.maxOccupancy 
                  : (selectedRoom?.guests || 3);
                const maxTotalGuests = r1Cap + extraRoomIds.reduce((sum, id) => {
                  const match = rooms.find(r => r._id === id);
                  return sum + (match ? (match.maxOccupancy ?? match.guests ?? 3) : r1Cap);
                }, 0);
                const currentGuests = adults + children;
                const isOverCap = currentGuests > maxTotalGuests;

                return (
                  <div className="mt-3 border border-gray-200 rounded-2xl bg-white divide-y divide-gray-100 overflow-hidden shadow-sm">
                    {/* Adults */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-800 uppercase tracking-widest mb-0.5">ADULTS (13+)</p>
                        <p className="text-sm font-medium text-gray-700">{adults} Adult{adults > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-xs"
                        >
                          <span className="text-lg font-light leading-none">−</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentGuests >= maxTotalGuests) {
                              toast.warning(`Maximum occupancy (${maxTotalGuests}) reached for ${roomsCount} room(s). Increase Rooms to add more guests.`);
                            } else {
                              setAdults(prev => prev + 1);
                            }
                          }}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 bg-white shadow-xs ${
                            currentGuests >= maxTotalGuests
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900'
                          }`}
                        >
                          <span className="text-lg font-light leading-none">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-800 uppercase tracking-widest mb-0.5">CHILDREN (3–12)</p>
                        <p className="text-sm font-medium text-gray-700">{children} Child{children === 1 ? '' : 'ren'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-xs"
                        >
                          <span className="text-lg font-light leading-none">−</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentGuests >= maxTotalGuests) {
                              toast.warning(`Maximum occupancy (${maxTotalGuests}) reached for ${roomsCount} room(s). Increase Rooms to add more guests.`);
                            } else {
                              setChildren(prev => prev + 1);
                            }
                          }}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 bg-white shadow-xs ${
                            currentGuests >= maxTotalGuests
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900'
                          }`}
                        >
                          <span className="text-lg font-light leading-none">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Infants */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-800 uppercase tracking-widest mb-0.5">INFANTS (0–2)</p>
                        <p className="text-sm font-medium text-gray-700">{infants} Infant{infants !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setInfants(Math.max(0, infants - 1))}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-xs"
                        >
                          <span className="text-lg font-light leading-none">−</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const maxInfants = 2 * roomsCount;
                            if (infants >= maxInfants) {
                              toast.warning(`Maximum infants (${maxInfants}) allowed for ${roomsCount} room(s).`);
                            } else {
                              setInfants(prev => prev + 1);
                            }
                          }}
                          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 bg-white shadow-xs ${
                            infants >= 2 * roomsCount
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-900'
                          }`}
                        >
                          <span className="text-lg font-light leading-none">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Guests Occupancy */}
                    <div className={`flex items-center justify-between p-3.5 ${isOverCap ? 'bg-red-50 text-red-700' : 'bg-gray-50/60'}`}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-800">Guests Occupancy</p>
                        {isOverCap && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">Exceeds Capacity</span>
                        )}
                      </div>
                      <p className={`text-sm font-bold ${isOverCap ? 'text-red-600 font-extrabold' : 'text-gray-900'}`}>
                        {currentGuests} / {maxTotalGuests}
                      </p>
                    </div>

                    {/* Rooms */}
                    <div className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 transition-colors">
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-800 uppercase tracking-widest mb-0.5">ROOMS</p>
                        <p className="text-sm font-medium text-gray-700">{roomsCount} Room{roomsCount > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleRoomsCountChange(roomsCount - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-xs"
                        >
                          <span className="text-lg font-light leading-none">−</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRoomsCountChange(roomsCount + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-800 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-xs"
                        >
                          <span className="text-lg font-light leading-none">+</span>
                        </button>
                      </div>
                    </div>

                    {/* Additional Room Selectors (SELECT ROOM 2, SELECT ROOM 3, etc.) */}
                    {roomsCount > 1 && Array.from({ length: roomsCount - 1 }).map((_, idx) => {
                      const roomNum = idx + 2;
                      const currentSelectedId = extraRoomIds[idx] || '';
                      const extraRoomObj = rooms.find(r => r._id === currentSelectedId);

                      return (
                        <div key={`extra-room-${roomNum}`} className="p-3.5 bg-gray-50/40 hover:bg-gray-50/80 transition-colors border-t border-gray-100 space-y-2.5">
                          <label className="block text-[10px] font-extrabold text-gray-800 uppercase tracking-widest">
                            SELECT ROOM {roomNum}
                          </label>
                          <select
                            value={currentSelectedId}
                            onChange={(e) => {
                              const updated = [...extraRoomIds];
                              updated[idx] = e.target.value;
                              setExtraRoomIds(updated);
                            }}
                            className="w-full h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-800 shadow-sm"
                          >
                            <option value="" disabled>Choose a room...</option>
                            {rooms.map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.name} • ₹{r.price?.toLocaleString('en-IN')}/night ({r.category || 'Villa'})
                              </option>
                            ))}
                          </select>

                          {/* Selected Extra Room Preview Card matching image */}
                          {extraRoomObj && (
                            <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
                              <div className="w-16 h-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                <img
                                  src={getImageUrl(extraRoomObj.images?.[0]) || 'https://via.placeholder.com/150'}
                                  alt={extraRoomObj.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-gray-900 truncate">
                                  {extraRoomObj.name} ({roomNum} Of {roomsCount})
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Category: {extraRoomObj.category || 'Villa'} • Max Guests: {extraRoomObj.maxOccupancy !== undefined && extraRoomObj.maxOccupancy !== null ? extraRoomObj.maxOccupancy : (extraRoomObj.guests || 2)}
                                </p>
                                <p className="text-xs font-bold text-primary-600 mt-0.5">
                                  ₹{extraRoomObj.price?.toLocaleString('en-IN')} / night
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>

            {/* Section 3: Add-on Services Selection */}
            {availableAddons.length > 0 && (
              <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                  <Layers className="w-5 h-5 text-primary-600" />
                  <h2 className="font-bold text-base text-gray-900">3. Select Add-on Services</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableAddons.map((addon) => {
                    const isSelected = selectedAddonIds.includes(addon._id);
                    const addonImg = addon.image ? getImageUrl(addon.image) : null;
                    return (
                      <div
                        key={addon._id}
                        onClick={() => toggleAddon(addon._id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 shrink-0"
                          />
                          {addonImg ? (
                            <img
                              src={addonImg}
                              alt={addon.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                              <Layers className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-gray-900 truncate">{addon.name}</p>
                            {addon.description && (
                              <p className="text-[11px] text-gray-500 line-clamp-1">{addon.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-xs text-primary-700 bg-primary-100 px-2 py-1 rounded-md shrink-0">
                          +₹{addon.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

          </div>

          {/* Right Column: Pricing Breakdown & Payment Settings (1 col) */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-5 sticky top-6">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-base text-gray-900">Pricing & Payment</h2>
              </div>

              {/* Detailed Itemized Price Calculation Summary */}
              <div className="space-y-2 text-xs text-gray-600 border-b border-gray-100 pb-4">
                {/* Room 1 */}
                {selectedRoom ? (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      1. {selectedRoom.name} <span className="text-[11px] text-gray-400">({nightsCount} Night{nightsCount !== 1 ? 's' : ''} x ₹{selectedRoom.price?.toLocaleString('en-IN')})</span>
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{((selectedRoom.price || 0) * (nightsCount || 1)).toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-gray-400">
                    <span>1. Room Rate</span>
                    <span>₹0</span>
                  </div>
                )}

                {/* Extra Rooms Breakdown (Room 2, Room 3, etc.) */}
                {roomsCount > 1 && Array.from({ length: roomsCount - 1 }).map((_, idx) => {
                  const roomNum = idx + 2;
                  const roomObj = rooms.find(r => r._id === extraRoomIds[idx]);
                  const rPrice = roomObj ? (roomObj.price || 0) : (selectedRoom?.price || 0);
                  const rName = roomObj ? roomObj.name : `Room ${roomNum}`;

                  return (
                    <div key={`breakdown-room-${roomNum}`} className="flex justify-between items-center pt-0.5">
                      <span className="text-gray-700 font-medium">
                        {roomNum}. {rName} <span className="text-[11px] text-gray-400">({nightsCount} Night{nightsCount !== 1 ? 's' : ''} x ₹{rPrice.toLocaleString('en-IN')})</span>
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{(rPrice * (nightsCount || 1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}

                {/* Total Rooms Subtotal if multiple rooms or addons exist */}
                {(roomsCount > 1 || addonsTotal > 0) && (
                  <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 font-bold text-gray-800">
                    <span>Total Rooms Subtotal</span>
                    <span>₹{roomSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Selected Add-ons Breakdown */}
                {addonsTotal > 0 && (
                  <div className="flex justify-between items-center text-primary-700 font-medium pt-0.5">
                    <span>Selected Add-ons ({selectedAddonIds.length})</span>
                    <span className="font-bold">+₹{addonsTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* GST Taxes */}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-medium text-gray-700">GST Taxes ({stayTaxPercent}%)</span>
                  <span className="font-semibold text-gray-900">+₹{stayTax.toLocaleString('en-IN')}</span>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-2.5 border-t border-gray-200 text-sm font-black text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-base font-extrabold text-[#1d4ed8]">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Type Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-800">Payment Option</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                      paymentType === 'full'
                        ? 'bg-[#1d4ed8] text-white border-transparent'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('advance')}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                      paymentType === 'advance'
                        ? 'bg-[#1d4ed8] text-white border-transparent'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Advance ({advancePercent}%)
                  </button>
                </div>
              </div>

              {/* Amount Breakdown */}
              <div className="p-3.5 bg-gray-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-gray-700">
                  <span>{paymentType === 'advance' ? `Amount to Collect (Advance ${advancePercent}%):` : 'Amount to Collect (Full):'}</span>
                  <span className="text-emerald-600 font-bold">₹{calculatedPaidAmount.toLocaleString('en-IN')}</span>
                </div>
                {paymentType === 'advance' && (
                  <div className="flex justify-between font-semibold text-gray-700 pt-1 border-t border-gray-200/60">
                    <span>Remaining Balance (Due at Check-in):</span>
                    <span className="text-amber-600 font-bold">₹{calculatedDueAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Generating Razorpay Link...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" /> Generate & Send Payment Link to WhatsApp
                  </>
                )}
              </Button>
            </Card>
          </div>

        </form>
      )}
    </div>
  );
};

export default AdminCreateBooking;
