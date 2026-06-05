import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, CreditCard, ChevronLeft, ChevronRight, Loader2, BedDouble, Star, X, Users, Check, Bath } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import BookingCardSkeleton from '../components/BookingCardSkeleton';

const SERVER_URL = import.meta.env.VITE_BASE_URL;

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Review Modal States
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [commRating, setCommRating] = useState(5);
  const [cleanRating, setCleanRating] = useState(5);
  const [comfRating, setComfRating] = useState(5);
  const [facRating, setFacRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoveredStars, setHoveredStars] = useState({});

  // Cancellation States
  const [cancelPolicyHours, setCancelPolicyHours] = useState(24);
  const [hotelCheckInTime, setHotelCheckInTime] = useState('14:00');
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [refundingLoader, setRefundingLoader] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/my');
        setBookings(res.data);
      } catch (err) {
        console.error('Failed to fetch bookings', err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data) {
          setCancelPolicyHours(res.data.cancelDurationHrs ?? 24);
          setHotelCheckInTime(res.data.checkInTime ?? '14:00');
        }
      } catch (err) {
        console.error('Failed to fetch cancel duration settings', err);
      }
    };

    fetchBookings();
    fetchSettings();
  }, []);

  const handleOpenReviewModal = (booking, initialRating = 5) => {
    setSelectedBooking(booking);
    if (booking.isReviewed && booking.review) {
      setCommRating(booking.review.ratings?.communication || 5);
      setCleanRating(booking.review.ratings?.cleanliness || 5);
      setComfRating(booking.review.ratings?.comfort || 5);
      setFacRating(booking.review.ratings?.facilities || 5);
      setComment(booking.review.comment || '');
    } else {
      setCommRating(initialRating);
      setCleanRating(initialRating);
      setComfRating(initialRating);
      setFacRating(initialRating);
      setComment('');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        bookingId: selectedBooking._id,
        communication: commRating,
        cleanliness: cleanRating,
        comfort: comfRating,
        facilities: facRating,
        comment,
      });
      toast.success(res.data.message || 'Review submitted successfully!');

      // Update booking list to reflect isReviewed and include the review details
      setBookings(prev => prev.map(b => b._id === selectedBooking._id ? { ...b, isReviewed: true, review: res.data.review } : b));
      setSelectedBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const canCancelBooking = (booking) => {
    if (booking.status !== 'confirmed' && booking.status !== 'pending') return false;

    const checkInDate = new Date(booking.checkIn);
    const [hours, minutes] = hotelCheckInTime.split(':');
    checkInDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const deadline = new Date(checkInDate.getTime() - cancelPolicyHours * 60 * 60 * 1000);
    return new Date() < deadline;
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    setRefundingLoader(true);
    try {
      await api.post(`/bookings/${cancellingBooking._id}/cancel`);
      toast.success('Your booking has been cancelled successfully.');
      
      // Update local state
      setBookings(prev => prev.map(b => b._id === cancellingBooking._id ? { ...b, status: 'cancelled' } : b));
      setCancellingBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
      console.error(err);
    } finally {
      setRefundingLoader(false);
    }
  };

  const handleCancelClick = (booking) => {
    if (canCancelBooking(booking)) {
      setCancellingBooking(booking);
    } else {
      toast.error(`You can only cancel this booking up to ${cancelPolicyHours} hours before check-in.`);
    }
  };

  const handlePayBalance = async (booking) => {
    try {
      const orderRes = await api.post(`/bookings/${booking._id}/balance-razorpay-order`);
      const order = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'The Balified Villa',
        description: `Remaining balance payment for booking`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post(`/bookings/${booking._id}/verify-balance-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success('Balance payment completed successfully!');
            // Update local state
            setBookings(prev => prev.map(b => b._id === booking._id ? {
              ...b,
              paymentStatus: 'paid',
              paidAmount: b.totalAmount,
              dueAmount: 0
            } : b));
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: { email: booking.user?.email || '' },
        theme: { color: '#EAB308' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate balance payment');
    }
  };


  const indexOfLastBooking = currentPage * itemsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(bookings.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900">My Bookings</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage your upcoming and past stays</p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Your dream stay is just a few clicks away. Start exploring our curated properties.</p>
            <Link to="/rooms" className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary-500/25 hover:bg-primary-700 transition-all">
              Explore Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {currentBookings.map((booking) => {
              const checkOutDate = new Date(booking.checkOut);
              checkOutDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = checkOutDate < today;
              return (
                <div key={booking._id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col">
                  {/* Top Section: Room Preview & Info Row */}
                  <div className="flex flex-col md:flex-row md:h-[280px]">
                    {/* Room Preview */}
                    <div className="w-full md:w-72 h-48 md:h-[280px] relative bg-gray-100 flex-shrink-0">
                      {booking.room.images?.[0] ? (
                        <img
                          src={getImageUrl(booking.room.images[0])}
                          alt={booking.room.name}
                          className={`w-full h-full object-cover transition-all duration-500 ${isPast ? 'grayscale opacity-75' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BedDouble className="w-12 h-12 text-gray-200" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          isPast ? 'bg-gray-100 text-gray-500 border-gray-200' :
                          booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          booking.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {isPast ? 'completed' : booking.status}
                        </span>
                      </div>
                    </div>

                    {/* Booking Info */}
                    <div className="p-5 md:p-6 flex-1 flex flex-col justify-between md:h-[280px]">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{booking.room.category}</p>
                            <h2 className="text-xl font-black text-gray-900 line-clamp-2">
                              {booking.rooms && booking.rooms.length > 0
                                ? booking.rooms.map(r => r.name).join(', ')
                                : booking.room.name}
                            </h2>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">₹{booking.totalAmount?.toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Total Price</p>
                            {booking.dueAmount > 0 && (
                              <div className="text-[9px] font-bold mt-1 text-slate-500">
                                Paid: <span className="text-emerald-600">₹{booking.paidAmount?.toLocaleString('en-IN')}</span>
                                <br />
                                Due: <span className="text-amber-600">₹{booking.dueAmount?.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-gray-50">
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Check-In</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Check-Out</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Users className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Guests</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">
                              {booking.adults || booking.guests || 1} Adult{(booking.adults || booking.guests || 1) > 1 ? 's' : ''}
                              {booking.children > 0 ? `, ${booking.children} Child${booking.children > 1 ? 'ren' : ''}` : ''}
                              {booking.infants > 0 ? `, ${booking.infants} Infant${booking.infants > 1 ? 's' : ''}` : ''}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <BedDouble className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Rooms</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">{booking.roomsCount || 1} Room{(booking.roomsCount || 1) > 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        {booking.rooms && booking.rooms.length > 1 && (
                          <div className="mt-4">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Booked Rooms</span>
                            <div className="flex flex-wrap gap-2">
                              {booking.rooms.map((r, rIdx) => (
                                <Link
                                  key={rIdx}
                                  to={`/rooms/${r._id}`}
                                  className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-95 text-gray-700 pl-1.5 pr-2.5 py-1 rounded-lg text-[10px] font-bold border border-gray-200 shadow-sm transition-all"
                                >
                                  <div className="w-5 h-5 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200/40">
                                    {r.images?.length > 0 ? (
                                      <img src={getImageUrl(r.images[0])} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <BedDouble className="w-3 h-3 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  {r.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {booking.addons && booking.addons.length > 0 ? (
                          <div className="mt-2 h-[36px] overflow-hidden">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Selected Add-ons</span>
                            <div className="flex flex-wrap gap-1.5">
                              {booking.addons.map((addon, aIdx) => (
                                <span key={aIdx} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-primary-100">
                                  {addon.name} (₹{addon.price})
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 h-[36px] invisible" aria-hidden="true" />
                        )}
                      </div>

                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-50 pt-3 gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Booked on {new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                          {booking.razorpayPaymentId && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                              <CreditCard className="w-4 h-4" />
                              Payment Secure
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                          {booking.dueAmount > 0 && booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handlePayBalance(booking)}
                              className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-yellow-250 bg-yellow-50 hover:bg-yellow-100 text-slate-900 active:scale-[0.98] transition-all cursor-pointer"
                            >
                              Pay Balance (₹{booking.dueAmount?.toLocaleString('en-IN')})
                            </button>
                          )}
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                                canCancelBooking(booking)
                                  ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-100 active:scale-[0.98]"
                                  : "bg-gray-50 text-gray-400 border-gray-200"
                              }`}
                            >
                              Cancel Stay
                            </button>
                          )}
                          <Link to={`/rooms/${booking.room._id}`} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section: Feedback Bar — all cards, hidden once reviewed */}
                  {!booking.isReviewed && (
                    <div
                      onClick={() => handleOpenReviewModal(booking)}
                      className="bg-gray-50/30 hover:bg-primary-50/30 border-t border-gray-100 px-6 md:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between transition-all gap-2 sm:gap-4 group cursor-pointer"
                    >
                      {/* Text label */}
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest group-hover:text-primary-700 transition-colors">
                          Rate Us
                        </p>
                        <p className="text-xs font-bold text-gray-400 group-hover:text-primary-600/80 transition-colors">
                          Leave a quick review
                        </p>
                      </div>

                      {/* Stars + Rate label */}
                      <div
                        className="flex items-center gap-1.5 flex-shrink-0"
                        onMouseLeave={() => setHoveredStars(prev => ({ ...prev, [booking._id]: 0 }))}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((starIndex) => {
                            const isHovered = starIndex <= (hoveredStars[booking._id] || 0);
                            return (
                              <button
                                key={starIndex}
                                type="button"
                                onMouseEnter={() => setHoveredStars(prev => ({ ...prev, [booking._id]: starIndex }))}
                                onClick={() => handleOpenReviewModal(booking, starIndex)}
                                className="p-0.5 hover:scale-110 active:scale-95 transition-all focus:outline-none cursor-pointer"
                              >
                                <Star
                                  className={`w-4 h-4 transition-colors ${isHovered ? 'fill-[#FCE83A] text-[#cabb31]' : 'text-gray-300'}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span
                          onClick={() => handleOpenReviewModal(booking)}
                          className="text-xs font-black text-gray-400 hover:text-primary-600 ml-1 transition-colors cursor-pointer"
                        >
                          Rate
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-100 px-6 py-4 rounded-3xl shadow-sm gap-4">
                <div className="flex flex-1 justify-between w-full sm:hidden">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-900">{indexOfFirstBooking + 1}</span> to{' '}
                      <span className="font-bold text-gray-900">
                        {Math.min(indexOfLastBooking, bookings.length)}
                      </span>{' '}
                      of <span className="font-bold text-gray-900">{bookings.length}</span> bookings
                    </p>
                  </div>
                  <div>
                    <nav className="flex items-center gap-2" aria-label="Pagination">
                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:scale-100 shadow-sm transition-all"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all active:scale-95 ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700'
                              : 'text-gray-700 border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 shadow-sm'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:scale-100 shadow-sm transition-all"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedBooking(null)}
          />

          {/* Content Card */}
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 relative z-10 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{selectedBooking.room.category}</p>
                <h2 className="text-xl font-black text-gray-900 leading-snug">
                  {selectedBooking.isReviewed ? 'Edit Review for' : 'Review'} {selectedBooking.room.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Ratings */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category Ratings</h3>

                {/* Communication */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                  <span className="text-sm font-bold text-gray-700">Communication</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommRating(star)}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= commRating ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                  <span className="text-sm font-bold text-gray-700">Cleanliness</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCleanRating(star)}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= cleanRating ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comfort */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                  <span className="text-sm font-bold text-gray-700">Comfort</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setComfRating(star)}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= comfRating ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facilities */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-gray-700">Facilities</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFacRating(star)}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= facRating ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Detailed Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your stay experience! What did you enjoy? What could we improve?"
                  className="w-full bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-primary-300/40 focus:ring-1 focus:ring-primary-500 rounded-xl p-4 text-sm outline-none transition-all placeholder-gray-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-black uppercase tracking-widest py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary-600/10 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingReview && <Loader2 className="w-4 h-4 animate-spin" />}
                {selectedBooking.isReviewed ? 'Update Review' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setCancellingBooking(null)}
          />
          <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 relative z-10 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black text-red-650 uppercase tracking-widest block mb-1">Cancel Reservation</span>
                <h2 className="text-xl font-black text-gray-900 leading-snug">Are you absolutely sure?</h2>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-gray-500 leading-relaxed">
                You are about to cancel your stay at <span className="font-bold text-gray-800">{cancellingBooking.room?.name}</span> scheduled for <span className="font-semibold text-gray-800">{new Date(cancellingBooking.checkIn).toLocaleDateString()}</span>.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1.5">Refund Policy</h4>
                <p className="text-xs text-amber-705 leading-relaxed">
                  Your payment of <span className="font-bold">₹{cancellingBooking.totalAmount.toLocaleString('en-IN')}</span> will be fully refunded to your original payment method. The refund will take <span className="font-bold">3 to 4 working days</span> to reflect in your account.
                </p>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setCancellingBooking(null)}
                  className="w-1/2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                >
                  No, Keep Stay
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={refundingLoader}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {refundingLoader && <Loader2 className="w-4 h-4 animate-spin" />}
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
