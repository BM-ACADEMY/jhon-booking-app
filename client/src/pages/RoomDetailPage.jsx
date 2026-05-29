import { useState, useEffect } from 'react';
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

  const checkInQuery = searchParams.get('checkIn') || '';
  const checkOutQuery = searchParams.get('checkOut') || '';
  const guestsQuery = parseInt(searchParams.get('guests') || '1', 10);

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

        // Fetch reviews
        const reviewsRes = await api.get(`/reviews/room/${res.data._id || id}`);
        setReviews(reviewsRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
      const orderRes = await api.post('/bookings/razorpay-order', {
        amount: total,
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
        name: 'Premium Stays',
        description: `Booking for ${room.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/bookings/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingData: {
                room: room._id, checkIn, checkOut, guests, totalAmount: total
              }
            });
            if (verifyRes.data.booking) {
              toast.success('Booking confirmed!');
              setShowMobileBooking(false);
              navigate('/bookings/my');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || '' },
        theme: { color: '#FCE83A' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate booking');
    } finally {
      setBookingLoading(false);
    }
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
                    <div className="text-[26px] leading-none font-bold text-gray-900">₹{room.price ? room.price.toLocaleString('en-IN') : '450'}</div>
                    <div className="text-[13px] text-gray-500 font-medium mt-1">/night</div>
                  </div>
                </div>

                {/* Mobile Price View */}
                <div className="lg:hidden flex items-end gap-1 mb-6">
                  <span className="text-[28px] leading-none font-bold text-gray-900">₹{room.price ? room.price.toLocaleString('en-IN') : '450'}</span>
                  <span className="text-sm text-gray-500 font-medium mb-0.5">/night</span>
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
                      room.guests && { icon: Users, label: `${room.guests} guests` },
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
                  <span className="text-4xl font-bold text-gray-900">₹{room.price ? room.price.toLocaleString('en-IN') : '450'}</span>
                  <span className="text-gray-500 font-medium mb-1">/night</span>
                </div>

                <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden mb-6">
                  <div className="flex border-b border-gray-300">
                    <div className="flex-1 p-3 border-r border-gray-300">
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Check-in</label>
                      <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full text-sm outline-none bg-transparent cursor-pointer text-gray-700" />
                    </div>
                    <div className="flex-1 p-3">
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Check-out</label>
                      <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} className="w-full text-sm outline-none bg-transparent cursor-pointer text-gray-700" />
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-1">Guests</label>
                      <span className="text-sm text-gray-700">{guests} guest{guests > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">−</button>
                      <button onClick={() => setGuests(g => Math.min(room.guests || 10, g + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors">+</button>
                    </div>
                  </div>
                </div>

                {nights > 0 && (
                  <div className="space-y-3 mb-6 text-base text-gray-600">
                    <div className="flex justify-between">
                      <span className="underline decoration-gray-300">₹{room.price?.toLocaleString('en-IN')} × {nights} night{nights !== 1 ? 's' : ''}</span>
                      <span>₹{(room.price * nights).toLocaleString('en-IN')}</span>
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
                <span className="text-2xl font-bold text-gray-900">₹{room.price?.toLocaleString('en-IN')} <span className="text-sm text-gray-500 font-medium">/night</span></span>
              </div>
              <button onClick={() => setShowMobileBooking(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stacked Input Cards */}
            <div className="space-y-3 mb-2">
              {/* Check-In Card */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80 relative">
                <Calendar className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`bg-transparent w-full text-[15px] outline-none ${checkIn ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}
                  />
                </div>
              </div>

              {/* Check-Out Card */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80 relative">
                <Calendar className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col w-full">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className={`bg-transparent w-full text-[15px] outline-none ${checkOut ? 'font-bold text-gray-900' : 'font-medium text-gray-400'}`}
                  />
                </div>
              </div>

              {/* Guests Card */}
              <div className="bg-[#F8F9FA] rounded-2xl p-4 flex items-center gap-4 border border-gray-100/80">
                <Users className="w-6 h-6 text-gray-400" />
                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Guests</label>
                  <select
                    value={guests}
                    onChange={e => setGuests(parseInt(e.target.value))}
                    className="bg-transparent w-full font-bold text-gray-900 text-[15px] outline-none appearance-none"
                  >
                    {[...Array(room.guests || 10)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} {i === 0 ? 'guest' : 'guests'}</option>
                    ))}
                  </select>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-900 mr-1" />
              </div>
            </div>

            {/* Total Mobile Summary */}
            {nights > 0 && (
              <div className="flex justify-between items-center py-2 text-gray-900 font-bold text-lg border-t border-gray-100 pt-4">
                <span>Total</span>
                <span>₹{(total + 50).toLocaleString('en-IN')}</span>
              </div>
            )}

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

    </div>
  );
};

export default RoomDetailPage;
