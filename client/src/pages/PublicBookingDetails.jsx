import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle, Printer, ArrowLeft, Loader2, Sparkles, Building2, ShieldCheck, Mail, Phone, User, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';

const SERVER_URL = import.meta.env.VITE_BASE_URL || '';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return '/placeholder-villa.jpg';
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const getPlainText = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
};

const PublicBookingDetails = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const searchParams = window.location.search || '';
        const res = await api.get(`/bookings/public/${id}${searchParams}`);
        setBooking(res.data);
      } catch (err) {
        console.error('Error fetching public booking details:', err);
        setError('Booking details could not be found or link is invalid.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-20">
        <Loader2 className="w-10 h-10 text-[#c5a880] animate-spin mb-4" />
        <p className="text-gray-500 font-medium text-sm">Loading your booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-20 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
            !
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'The requested booking details could not be retrieved.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#1a1d20] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const primaryRoom = booking.room || (booking.rooms && booking.rooms[0]);
  const primaryImage = primaryRoom?.images?.[0] ? getImageUrl(primaryRoom.images[0]) : 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';

  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-IN', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  const nights = Math.max(1, Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-32 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#c5a880]" /> Print / Download Invoice
          </button>
        </div>

        {/* Invoice Container Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-md overflow-hidden print:shadow-none print:border-none">
          
          {/* Header Banner */}
          <div className="bg-[#1a1d20] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-[#c5a880] text-xs font-bold uppercase tracking-widest block mb-1">Booking Confirmation</span>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">The Balified Villa</h1>
              <p className="text-gray-400 text-xs mt-1">Order Ref: #{booking._id?.slice(-8).toUpperCase()}</p>
            </div>
            
            <div className="sm:text-right">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-2">
                <CheckCircle className="w-3.5 h-3.5" /> {booking.status || 'Confirmed'}
              </div>
              <p className="text-xs text-gray-400">Payment: <span className="text-white font-bold uppercase">{booking.paymentStatus}</span></p>
            </div>
          </div>

          {/* Main Body */}
          <div className="p-6 sm:p-8 space-y-8">

            {/* Room Banner */}
            <div className="flex flex-col md:flex-row gap-6 items-start bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <img
                src={primaryImage}
                alt={primaryRoom?.name || 'Villa Room'}
                className="w-full md:w-48 h-32 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c5a880] block mb-1">
                  {primaryRoom?.category || 'Luxury Accommodation'}
                </span>
                <h2 className="text-lg font-bold text-gray-900 mb-1">{primaryRoom?.name || 'Villa Suite'}</h2>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{getPlainText(primaryRoom?.description) || 'Exclusive luxury stay with premium amenities.'}</p>
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
                  <span>🏡 {booking.roomsCount || 1} Room(s)</span>
                  <span>👥 {booking.adults || 1} Adult(s), {booking.children || 0} Child(ren)</span>
                </div>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">CHECK-IN</span>
                <p className="text-sm font-bold text-gray-900">{checkInDate}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">From 2:00 PM</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">CHECK-OUT</span>
                <p className="text-sm font-bold text-gray-900">{checkOutDate}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Until 11:00 AM</p>
              </div>

              <div className="p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
                <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider block mb-1">DURATION</span>
                <p className="text-sm font-bold text-gray-900">{nights} Night(s)</p>
                <p className="text-[11px] text-yellow-600 mt-0.5 font-semibold">Total Stay</p>
              </div>
            </div>

            {/* Guest & Billing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Guest Details */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#c5a880]" /> Guest Details
                </h3>
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-gray-900 text-sm">{booking.user?.name || 'Guest'}</p>
                  <p className="text-gray-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /> {booking.user?.email || 'N/A'}</p>
                  <p className="text-gray-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {booking.user?.phone || 'N/A'}</p>
                  {booking.gstNumber && (
                    <p className="text-gray-600 font-semibold pt-1">GST: {booking.gstNumber}</p>
                  )}
                </div>
              </div>

              {/* Payment Meta */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#c5a880]" /> Payment Details
                </h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-gray-900">Razorpay Online</span>
                  </div>
                  {booking.razorpayOrderId && (
                    <div className="flex justify-between">
                      <span>Order ID:</span>
                      <span className="font-mono font-semibold text-gray-800 text-[11px]">{booking.razorpayOrderId}</span>
                    </div>
                  )}
                  {booking.razorpayPaymentId && (
                    <div className="flex justify-between">
                      <span>Payment ID:</span>
                      <span className="font-mono font-semibold text-gray-800 text-[11px]">{booking.razorpayPaymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span>Payment Type:</span>
                    <span className="font-bold text-[#c5a880] uppercase">{booking.paymentType === 'advance' ? 'Advance Paid' : 'Full Payment'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Addons Section if any */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Selected Add-on Services</h3>
                <div className="divide-y divide-gray-200">
                  {booking.addons.map((a, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-800">✨ {a.name}</span>
                      <span className="font-bold text-gray-900">₹{a.price?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Summary Breakdown */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Financial Summary</h3>
              <div className="space-y-2 text-xs text-gray-600 max-w-sm ml-auto">
                
                <div className="flex justify-between">
                  <span>Room Charge ({nights} Night/s):</span>
                  <span className="font-semibold text-gray-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900 text-sm">
                  <span>Grand Total:</span>
                  <span className="text-base text-gray-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 font-bold mt-3">
                  <span>Amount Paid:</span>
                  <span>₹{booking.paidAmount?.toLocaleString('en-IN')}</span>
                </div>

                {booking.dueAmount > 0 && (
                  <div className="flex justify-between text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-bold">
                    <span>Balance Due at Check-in:</span>
                    <span>₹{booking.dueAmount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Property Footer Info */}
            <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-500 space-y-1">
              <p className="font-bold text-gray-800">The Balified Villa</p>
              <p>Jalan Luxury Villa No. 8, Seminyak, Bali, Indonesia</p>
              <p>Contact: +62 361 123456 | Email: info@thebalifiedvilla.com</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicBookingDetails;
