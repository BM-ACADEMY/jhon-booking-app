import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Utensils, Bell, Car, Sparkles, Heart, Layers, ArrowRight,
  ShieldCheck, Loader2, Calendar, Users, Info, ChevronRight, Check
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
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // If redirect direct without state
  useEffect(() => {
    if (!state || !state.roomId) {
      toast.error('No booking information found. Redirecting to properties.');
      navigate('/rooms');
    }
  }, [state, navigate]);

  const { roomId, checkIn, checkOut, guests, total: staySubtotal, nights, breakdown } = state || {};

  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!roomId) return;
      try {
        setLoading(true);
        // Wait 1200ms to show the beautifully designed skeleton-loading state as requested
        await new Promise(resolve => setTimeout(resolve, 1200));
        const res = await api.get(`/rooms/${roomId}`);
        setRoom(res.data);
      } catch (err) {
        toast.error('Failed to load room details');
        navigate('/rooms');
      } finally {
        setLoading(false);
      }
    };
    fetchRoomDetails();
  }, [roomId, navigate]);

  if (!state || !state.roomId) return null;

  // Calculate bill totals
  const addonsTotal = selectedAddons.reduce((acc, curr) => acc + curr.price, 0);
  const finalTotal = staySubtotal + addonsTotal;

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
      navigate('/login');
      return;
    }

    try {
      setBookingLoading(true);
      
      const addonsPayload = isSkipping ? [] : selectedAddons.map(a => ({
        name: a.name,
        price: a.price,
        iconType: a.iconType
      }));

      const finalAmount = isSkipping ? staySubtotal : finalTotal;

      const orderRes = await api.post('/bookings/razorpay-order', {
        amount: finalAmount,
        currency: 'INR',
        roomId: room._id,
        checkIn,
        checkOut
      });
      const order = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
        amount: order.amount,
        currency: order.currency,
        name: 'The Balified Villa',
        description: `Room stay + ${addonsPayload.length} Add-on(s)`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingData: {
                room: room._id,
                checkIn,
                checkOut,
                guests,
                totalAmount: finalAmount,
                addons: addonsPayload
              }
            });
            if (verifyRes.data.booking) {
              toast.success('Your premium booking is confirmed!');
              navigate('/mybookings');
            }
          } catch (err) {
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

  const roomAddons = room?.addons || [];

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Step Progress Tracker */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <span>1. Dates & Room</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary-600">2. Enhance Stay</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-300">3. Confirmation</span>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enhance Your Experience</h1>
          <p className="text-sm text-gray-500 mt-1">Select from our premium handpicked services to make your stay unforgettable.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Selectable Add-on Services List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-500" />
                    Premium Add-on Services
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Customize your villa stay with these amenities</p>
                </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {roomAddons.map((addon) => {
                      const IconComponent = categoryIcons[addon.iconType] || Layers;
                      const isSelected = selectedAddons.some(a => a._id === addon._id);
                      return (
                        <div
                          key={addon._id}
                          onClick={() => handleAddonClick(addon)}
                          className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50/20 shadow-md shadow-primary-500/5'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                isSelected ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600'
                              }`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className={`w-5 h-5 rounded-full border transition-all flex items-center justify-center ${
                                isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{addon.name}</h3>
                          </div>
                          <p className="text-lg font-black text-gray-900 mt-2">
                            ₹{addon.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Skip Option Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No Addons Needed?</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Skip these extras and proceed directly to room checkout.</p>
                    </div>
                    <button
                      onClick={() => initiatePayment(true)}
                      className="px-5 py-2.5 text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Skip & Pay Base Room Price
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Room Billing Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                  Selected Stay
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-3">{room?.name}</h2>
                <p className="text-xs text-gray-500">{room?.propertyType || 'Entire Villa'}</p>
              </div>

              {/* Dates and Guests summary */}
              <div className="grid grid-cols-2 gap-4 py-4 px-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nights</p>
                    <p className="text-sm font-bold text-gray-700">{nights} night(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Guests</p>
                    <p className="text-sm font-bold text-gray-700">{guests} Guest(s)</p>
                  </div>
                </div>
              </div>

              {/* Detailed Date-by-date Breakdown */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Stay Price Breakdown</h4>
                <div className="space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  {breakdown && breakdown.map((day, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">{formatDateLabel(day.dateStr)}</span>
                      <span className="font-bold text-gray-800">₹{day.price.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="h-px bg-gray-100 my-2" />
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-600">Stay Subtotal ({nights} nights)</span>
                    <span className="text-gray-900">₹{staySubtotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Selected Addons breakdown */}
              {selectedAddons.length > 0 && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Selected Extras</h4>
                  <div className="space-y-2 bg-primary-50/10 p-4 rounded-2xl border border-primary-100/30">
                    {selectedAddons.map((addon) => (
                      <div key={addon._id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-bold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-primary-500" />
                          {addon.name}
                        </span>
                        <span className="font-bold text-gray-800">₹{addon.price.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="h-px bg-primary-100/20 my-2" />
                    <div className="flex justify-between items-center text-xs font-bold text-primary-700">
                      <span>Add-ons Total</span>
                      <span>₹{addonsTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Billing */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">All Taxes Included</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-gray-900">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={() => initiatePayment(false)}
                disabled={bookingLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20 active:scale-[0.99] border-none cursor-pointer"
              >
                {bookingLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Confirm & Pay
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
    </div>
  );
};

export default AddonsPage;
