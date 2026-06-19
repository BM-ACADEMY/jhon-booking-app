import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import Lottie from 'lottie-react';
import tickAnimation from '../assets/tick.json';
import {
  Utensils, Bell, Car, Sparkles, Heart, Layers, ArrowRight,
  ShieldCheck, Loader2, Calendar, Users, Info, ChevronRight, Check, ArrowLeft
} from 'lucide-react';

const categoryIcons = {
  'food': Utensils,
  'room services': Bell,
  'transport': Car,
  'Special Arrangements': Sparkles,
  'Guest Services': Heart
};

const AddonsPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, setAuthModal } = useAuth();

  const [room, setRoom] = useState(null);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [advancePercent, setAdvancePercent] = useState(100);
  const [paymentType, setPaymentType] = useState('full'); // 'full' | 'advance'
  const [taxRules, setTaxRules] = useState([]);

  // If redirect direct without state
  useEffect(() => {
    if (!state || !state.roomId) {
      toast.error('No booking information found. Redirecting to properties.');
      navigate('/rooms');
    }
  }, [state, navigate]);

  const { roomId, checkIn, checkOut, adults = 1, children = 0, infants = 0, roomsCount = 1, selectedRoomIds = [], guests, total: staySubtotal, nights, breakdown } = state || {};

  const getAdvancePercent = (settings, nightsCount) => {
    if (!settings) return 100;
    if (nightsCount === 1) return settings.advancePercent1Day ?? 100;
    if (nightsCount === 2) return settings.advancePercent2Day ?? 50;
    if (nightsCount === 3) return settings.advancePercent3Day ?? 40;
    if (nightsCount === 4) return settings.advancePercent4Day ?? 30;
    if (nightsCount >= 5 && nightsCount <= 7) return settings.advancePercent5To7Days ?? 25;
    return settings.advancePercentAbove7Days ?? 20;
  };

  useEffect(() => {
    const fetchRoomDetailsAndAddons = async () => {
      if (!roomId) return;
      try {
        setLoading(true);
        // Wait 1200ms to show the beautifully designed skeleton-loading state as requested
        await new Promise(resolve => setTimeout(resolve, 1200));
        const [roomRes, addonsRes, settingsRes] = await Promise.all([
          api.get(`/rooms/${roomId}`),
          api.get('/addons'),
          api.get('/settings')
        ]);
        setRoom(roomRes.data);
        setAddons(addonsRes.data);
        const percent = getAdvancePercent(settingsRes.data, nights || 1);
        setAdvancePercent(percent);
        setTaxRules(settingsRes.data?.taxRules || []);
      } catch (err) {
        toast.error('Failed to load details');
        navigate('/rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRoomDetailsAndAddons();
  }, [roomId, navigate]);

  if (!state || !state.roomId) return null;

  const getAppliedTax = (amount) => {
    if (!taxRules || taxRules.length === 0) return 0;
    const matchedRule = taxRules.find(r => amount >= r.minAmount && amount <= r.maxAmount);
    if (matchedRule) {
      return Math.round(amount * (matchedRule.taxPercent / 100));
    }
    return 0;
  };

  const getAppliedTaxPercent = (amount) => {
    if (!taxRules || taxRules.length === 0) return 0;
    const matchedRule = taxRules.find(r => amount >= r.minAmount && amount <= r.maxAmount);
    return matchedRule ? matchedRule.taxPercent : 0;
  };

  // Calculate bill totals
  const addonsTotal = selectedAddons.reduce((acc, curr) => acc + curr.price, 0);
  const stayTax = getAppliedTax(staySubtotal);
  const finalTotal = staySubtotal + stayTax + addonsTotal;

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

  const initiatePayment = async (isSkipping = false) => {
    if (!user) {
      toast.error('Please login to continue');
      setAuthModal('login');
      return;
    }

    try {
      setBookingLoading(true);

      const addonsPayload = isSkipping ? [] : selectedAddons.map(a => ({
        name: a.name,
        price: a.price,
        iconType: a.iconType
      }));

      const stayTax = getAppliedTax(staySubtotal);
      const finalAmount = isSkipping ? (staySubtotal + stayTax) : finalTotal;
      const actualAmount = paymentType === 'advance' ? Math.round(finalAmount * (advancePercent / 100)) : finalAmount;

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
        selectedRoomIds
      });
      const order = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'The Balified Villa',
        description: paymentType === 'advance' ? `Advance stay payment (${advancePercent}%)` : `Room stay + ${addonsPayload.length} Add-on(s)`,
        order_id: order.id,
        handler: async (response) => {
          try {
            setPaymentState('verifying');
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
                selectedRoomIds,
                guests: adults + children + infants,
                totalAmount: finalAmount,
                paidAmount: actualAmount,
                paymentType,
                addons: addonsPayload
              }
            });
            if (verifyRes.data.booking) {
              setPaymentState('success');
              setTimeout(() => {
                setPaymentState('idle');
                navigate('/mybookings');
              }, 2500);
            } else {
              setPaymentState('error');
            }
          } catch (err) {
            setPaymentState('error');
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#EAB308' } // Sleek yellow theme matching villa brand
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate booking payment');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Beautiful Skeleton Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Skeleton Header */}
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded-full" />
            <div className="h-8 w-64 bg-gray-200 rounded-lg" />
            <div className="h-4 w-96 bg-gray-200 rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left side skeletons */}
            <div className="lg:col-span-7 space-y-6">
              <div className="animate-pulse bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="h-6 w-48 bg-gray-200 rounded-md" />
                <div className="h-4 w-80 bg-gray-200 rounded-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="h-28 bg-gray-100 rounded-2xl border border-gray-200" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right side skeletons */}
            <div className="lg:col-span-5">
              <div className="animate-pulse bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="h-6 w-36 bg-gray-200 rounded-md" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded-md" />
                  <div className="h-4 w-full bg-gray-200 rounded-md" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded-md" />
                </div>
                <div className="h-px bg-gray-100 my-4" />
                <div className="h-12 w-full bg-gray-200 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const roomAddons = addons;

  return (
    <div className="min-h-screen bg-gray-50/50 pt-10 pb-28 lg:pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-950 transition-colors border-none bg-transparent p-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Enhance Your Experience</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Select from our premium handpicked services to make your stay unforgettable.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* LEFT SIDE: Selectable Add-on Services List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-100 pb-5 mb-6">
                <h2 className="text-xl font-bold text-gray-950 mb-2">
                  <span className="bg-[#ffd4d4] text-gray-900 px-2 py-0.5 rounded font-bold inline-block text-[17px] tracking-tight">
                    Add-ons and Extras
                  </span>
                </h2>
                <p className="text-sm font-semibold text-gray-800">Enhance your stay with our special perks & upgrades.</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Add-ons are on a per-room basis, please select the items individually for each accommodation below.
                </p>
              </div>

              {roomAddons.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-700 text-sm">No Add-ons Available</p>
                  <p className="text-xs text-gray-400 mt-1">There are no special add-on services active for this property.</p>
                  <button
                    onClick={() => initiatePayment(true)}
                    className="mt-5 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-none shadow-sm"
                  >
                    Proceed Direct to Checkout
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {roomAddons.map((addon) => {
                      const IconComponent = categoryIcons[addon.iconType] || Layers;
                      const isSelected = selectedAddons.some(a => a._id === addon._id);
                      return (
                        <div
                          key={addon._id}
                          onClick={() => handleAddonClick(addon)}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-slate-300 bg-white shadow-sm'
                              : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Styled Checkbox */}
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 bg-white group-hover:border-gray-400'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            {/* Icon Container */}
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-[#006749]">
                              <IconComponent className="w-5 h-5" />
                            </div>

                            {/* Addon Details */}
                            <div>
                              <h3 className="font-bold text-gray-800 text-sm sm:text-base">{addon.name}</h3>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{addon.iconType || 'Extra'}</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right pl-4">
                            <p className="text-lg font-black text-gray-900">
                              ₹{addon.price.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>


                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Room Billing Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                  Selected Stay
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-3">{room?.name}</h2>
                <p className="text-xs text-gray-500">{room?.propertyType || 'Entire Villa'}</p>
              </div>

              {/* Dates and Guests summary */}
              <div className="grid grid-cols-3 gap-4 py-4 px-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nights</p>
                    <p className="text-sm font-bold text-gray-700">{nights} Night(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Occupancy</p>
                    <p className="text-sm font-bold text-gray-700">
                      {adults} Ad{children > 0 ? `·${children}Ch` : ''}{infants > 0 ? `·${infants}Inf` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rooms</p>
                    <p className="text-sm font-bold text-gray-700">{roomsCount} Room(s)</p>
                  </div>
                </div>
              </div>

              {/* Detailed Date-by-date Breakdown */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Stay Price Breakdown</h4>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-2">
                  <div className="max-h-36 overflow-y-auto pr-1 space-y-2">
                    {breakdown && breakdown.map((day, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-medium">{formatDateLabel(day.dateStr)}</span>
                        <span className="font-bold text-gray-800">₹{day.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-gray-200/60 my-2" />
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                    <span>Stay Subtotal ({nights} nights)</span>
                    <span>₹{staySubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {stayTax > 0 && (
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mt-1">
                      <span>Stay Tax ({getAppliedTaxPercent(staySubtotal)}%)</span>
                      <span>₹{stayTax.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="h-px bg-gray-200/60 my-2" />
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>Stay Total</span>
                    <span>₹{(staySubtotal + stayTax).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Selected Addons breakdown */}
              {selectedAddons.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Selected Extras</h4>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedAddons.map((addon) => (
                      <div key={addon._id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-650 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#006749]" />
                          {addon.name}
                        </span>
                        <span className="font-bold text-gray-800">₹{addon.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="h-px bg-slate-200/60 my-2" />
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Add-ons Total</span>
                      <span>₹{addonsTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Type Selection */}
              {advancePercent < 100 && (
                <div className="space-y-3 pt-4 border-t border-gray-100 animate-in fade-in duration-300">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-450">Payment Type</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Pay Full Card */}
                    <div
                      onClick={() => setPaymentType('full')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        paymentType === 'full'
                          ? 'border-[#ffe135] bg-yellow-50/5'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <span className="text-xs font-bold text-gray-900">Pay Full</span>
                      <span className="text-base font-black text-gray-900 mt-2">
                        ₹{finalTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Pay Advance Card */}
                    <div
                      onClick={() => setPaymentType('advance')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        paymentType === 'advance'
                          ? 'border-[#ffe135] bg-yellow-50/5'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-gray-900">Pay Advance</span>
                        <span className="block text-[8px] text-gray-400 mt-0.5 uppercase tracking-wide font-black">
                          {advancePercent}% for {nights} night(s)
                        </span>
                      </div>
                      <span className="text-base font-black text-gray-900 mt-2">
                        ₹{Math.round(finalTotal * (advancePercent / 100)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Billing */}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 tracking-widest">Total Amount</p>
                  <span className="text-2xl font-black text-gray-900">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                {paymentType === 'advance' && (
                  <>
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                      <p>Due Now (Advance)</p>
                      <span>₹{Math.round(finalTotal * (advancePercent / 100)).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-600">
                      <p>Remaining Balance</p>
                      <span>₹{(finalTotal - Math.round(finalTotal * (advancePercent / 100))).toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                onClick={() => initiatePayment(false)}
                disabled={bookingLoading}
                className="w-full hidden lg:flex items-center justify-center gap-2 bg-[#ffe135] hover:bg-[#ebd030] disabled:bg-yellow-100 text-slate-900 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-yellow-400/10 active:scale-[0.99] border-none cursor-pointer"
              >
                {bookingLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {paymentType === 'advance' ? 'Pay Advance Stay' : 'Confirm & Pay'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-center text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Secure Payments processed via Razorpay
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Screens */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-lg border-t border-white/30 p-4 flex items-center justify-between lg:hidden shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {paymentType === 'advance' ? 'Due Now (Advance)' : 'Total Amount'}
          </p>
          <p className="text-xl font-black text-gray-900 mt-0.5">
            ₹{(paymentType === 'advance' ? Math.round(finalTotal * (advancePercent / 100)) : finalTotal).toLocaleString('en-IN')}
          </p>
        </div>
        <button
          onClick={() => initiatePayment(false)}
          disabled={bookingLoading}
          className="bg-[#ffe135] hover:bg-[#ebd030] disabled:bg-yellow-100 text-slate-900 font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-[0.98] border-none cursor-pointer"
        >
          {bookingLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {paymentType === 'advance' ? 'Pay Advance' : 'Pay'}
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Payment State Overlay Modals */}
      {paymentState !== 'idle' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes draw-circle {
              0% { stroke-dashoffset: 166; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes draw-check {
              0% { stroke-dashoffset: 48; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes scale-up {
              0%, 100% { transform: none; }
              50% { transform: scale3d(1.1, 1.1, 1); }
            }
          `}} />
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 border border-gray-150 animate-in zoom-in-95 duration-300">
            {paymentState === 'verifying' && (
              <div className="py-8 flex flex-col items-center space-y-4">
                <Loader2 className="w-16 h-16 animate-spin text-slate-800" />
                <h3 className="text-xl font-bold text-gray-900">Verifying Payment</h3>
                <p className="text-sm text-gray-505 max-w-xs leading-relaxed">
                  Please hold on. We are securing your reservation and preparing your itinerary...
                </p>
              </div>
            )}

            {paymentState === 'success' && (
              <div className="py-4 flex flex-col items-center">
                {/* Custom animated green tick at the top */}
                <div className="w-48 h-48 flex items-center justify-center mb-6">
                  <Lottie animationData={tickAnimation} loop={false} style={{ width: '100%', height: '100%' }} />
                </div>
                
                {/* Title & Details */}
                <h3 className="text-2xl font-black text-gray-950 tracking-tight">Room Booking Confirmed</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Your luxury stay at <strong>{room?.name}</strong> has been successfully booked!
                </p>

                {/* Bottom Moving to mybookings indicator */}
                <div className="mt-8 pt-6 border-t border-gray-100 w-full flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#006749] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006749]" />
                    Moving to My Bookings...
                  </div>
                </div>
              </div>
            )}

            {paymentState === 'error' && (
              <div className="py-6 flex flex-col items-center space-y-4">
                {/* Custom animated red cross */}
                <div className="w-20 h-20 flex items-center justify-center mb-2">
                  <svg className="w-20 h-20 text-rose-500" viewBox="0 0 52 52" fill="none" style={{ transformOrigin: 'center', animation: 'scale-up 0.5s ease-in-out 0.8s' }}>
                    <circle cx="26" cy="26" r="25" fill="none" stroke="#f43f5e" strokeWidth="3" style={{ strokeDasharray: 166, strokeDashoffset: 166, strokeMiterlimit: 10, animation: 'draw-circle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards' }} />
                    <path fill="none" d="M16 16l20 20M36 16L16 36" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'draw-check 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards' }} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-950">Payment Verification Failed</h3>
                <p className="text-sm text-gray-505 max-w-xs leading-relaxed">
                  We could not verify your payment. If your money was deducted, please contact support.
                </p>
                <button
                  onClick={() => setPaymentState('idle')}
                  className="mt-4 px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer"
                >
                  Back to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AddonsPage;
