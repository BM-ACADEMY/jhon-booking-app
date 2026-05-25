import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  ArrowLeft, Star, Users, BedDouble, Bath, MapPin, Wifi, Check,
  ChevronLeft, ChevronRight, Loader2, Calendar, Share2, Heart, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../api';

const SERVER_URL = 'http://localhost:5000';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const getIcon = (name) => Icons[name] || Icons.Check;

const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, toggleUserWishlist } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const isWishlisted = user?.wishlist?.includes(id) || false;

  const checkInQuery = searchParams.get('checkIn') || '';
  const checkOutQuery = searchParams.get('checkOut') || '';
  const guestsQuery = parseInt(searchParams.get('guests') || '1', 10);

  // Booking form
  const [checkIn, setCheckIn] = useState(checkInQuery);
  const [checkOut, setCheckOut] = useState(checkOutQuery);
  const [guests, setGuests] = useState(guestsQuery);

  useEffect(() => {
    if (checkInQuery) setCheckIn(checkInQuery);
    if (checkOutQuery) setCheckOut(checkOutQuery);
    if (guestsQuery) setGuests(guestsQuery);
  }, [checkInQuery, checkOutQuery, guestsQuery]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/rooms/${id}`);
        setRoom(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
    </div>
  );

  if (!room) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <BedDouble className="w-16 h-16 text-gray-200" />
      <p className="text-gray-500 font-bold">Property not found.</p>
      <Link to="/rooms" className="text-primary-600 font-black text-sm hover:underline">← Back to Rooms</Link>
    </div>
  );

  const images = room.images?.length > 0 ? room.images : [];
  const nights = checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 0;
  const total = nights * (room.price || 0);

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

    if (nights < 0) {
        toast.error('Invalid date range');
        return;
      }

    try {
      setBookingLoading(true);
      
      // 1. Create Razorpay Order
      const orderRes = await api.post('/bookings/razorpay-order', {
        amount: total,
        currency: 'INR',
        roomId: room._id,
        checkIn,
        checkOut
      });

      const order = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE', // Should use env
        amount: order.amount,
        currency: order.currency,
        name: 'Jhon Booking',
        description: `Booking for ${room.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3. Verify Payment on Backend
            const verifyRes = await api.post('/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingData: {
                room: room._id,
                checkIn,
                checkOut,
                guests,
                totalAmount: total
              }
            });

            if (verifyRes.data.booking) {
              toast.success('Booking confirmed!');
              navigate('/bookings/my');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#d4891f'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate booking');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back Nav */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <button className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Share">
              <Share2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={async () => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                await toggleUserWishlist(id);
              }}
              className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Save"
            >
              <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full">
              {room.category}
            </span>
            {room.isFeatured && (
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                ✦ Featured
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-2">{room.name}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5 font-bold">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              {room.rating ? room.rating.toFixed(1) : 'New'}
              {room.reviewCount > 0 && <span className="font-medium text-gray-400">({room.reviewCount} reviews)</span>}
            </span>
            {room.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                {[room.address, room.city, room.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        {images.length > 0 ? (
          <div className="relative rounded-3xl overflow-hidden mb-10 bg-gray-100">
            <div className="aspect-[16/9] sm:aspect-[2/1] relative overflow-hidden">
              <img
                src={getImageUrl(images[activeImg])}
                alt={images[activeImg]?.label || room.name}
                className="w-full h-full object-cover transition-all duration-500"
              />
              {images[activeImg]?.label && (
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {images[activeImg].label}
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                    className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all">
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button onClick={() => setActiveImg(i => (i + 1) % images.length)}
                    className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all">
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {activeImg + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`cursor-pointer flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-primary-500 shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[2/1] bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mb-10">
            <BedDouble className="w-24 h-24 text-white/10" />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-10">

            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Guests', value: room.guests },
                { icon: BedDouble, label: 'Bedrooms', value: room.bedrooms },
                { icon: BedDouble, label: 'Beds', value: room.beds },
                { icon: Bath, label: 'Bathrooms', value: room.bathrooms },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                  <Icon className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Highlights */}
            {room.highlights?.length > 0 && (
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary-500 rounded-full" /> Why guests love it
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {room.highlights.map((h, i) => {
                    const Icon = getIcon(h.icon);
                    return (
                      <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{h.text}</p>
                          {h.subtext && <p className="text-xs text-gray-500 mt-0.5">{h.subtext}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {room.description && (
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary-500 rounded-full" /> About this property
                </h2>
                <div
                  className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: room.description }}
                />
              </div>
            )}

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary-500 rounded-full" /> Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map((a, i) => {
                    const Icon = getIcon(a.icon);
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary-600 shadow-sm flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{a.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location */}
            {room.city && (
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary-500 rounded-full" /> Location
                </h2>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 flex-shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{room.city}{room.state ? `, ${room.state}` : ''}</p>
                    {room.address && <p className="text-sm text-gray-500 mt-0.5">{room.address}</p>}
                    {room.country && <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{room.country}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-3xl border border-gray-200 shadow-2xl shadow-gray-200/50 p-6 space-y-5">
              {/* Price */}
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">${room.price}</span>
                  {room.originalPrice && (
                    <span className="text-gray-400 text-base line-through">${room.originalPrice}</span>
                  )}
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  per {room.priceUnit || 'night'}
                </span>
                {room.rating > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-gray-700">{room.rating.toFixed(1)}</span>
                    {room.reviewCount > 0 && <span className="text-xs text-gray-400">· {room.reviewCount} reviews</span>}
                  </div>
                )}
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Check-in</label>
                  <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-gray-50 focus:bg-white cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Check-out</label>
                  <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-gray-50 focus:bg-white cursor-pointer" />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Guests</label>
                <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50">
                  <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                    className="cursor-pointer w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-primary-600 font-black text-lg transition-colors">−</button>
                  <span className="flex-1 text-center font-black text-gray-900">{guests}</span>
                  <button onClick={() => setGuests(g => Math.min(room.guests || 10, g + 1))}
                    className="cursor-pointer w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:text-primary-600 font-black text-lg transition-colors">+</button>
                </div>
                <p className="text-[10px] text-gray-400 font-bold mt-1">Max {room.guests} guests</p>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">${room.price} × {nights} night{nights !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-gray-900">${room.price * nights}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleBooking}
                disabled={bookingLoading || !room.isAvailable}
                className="w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl transition-all shadow-xl shadow-primary-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bookingLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {room.isAvailable ? 'Reserve Now' : 'Check Availability'}
              </button>

              <p className="text-[10px] text-gray-400 text-center font-medium">You won't be charged yet</p>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" /> Secure Booking
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Free Cancellation
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
