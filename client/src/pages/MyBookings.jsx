import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, CreditCard, ChevronRight, Loader2, BedDouble } from 'lucide-react';
import api from '../api';

const SERVER_URL = 'http://localhost:5000';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
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
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row">
                {/* Room Preview */}
                <div className="w-full md:w-64 h-48 md:h-auto relative bg-gray-100 flex-shrink-0">
                  {booking.room.images?.[0] ? (
                    <img src={getImageUrl(booking.room.images[0])} alt={booking.room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BedDouble className="w-12 h-12 text-gray-200" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      booking.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">{booking.room.category}</p>
                        <h2 className="text-xl font-black text-gray-900 line-clamp-1">{booking.room.name}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">${booking.totalAmount}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total Paid</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 py-4 border-y border-gray-50">
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
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
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
                    <Link to={`/rooms/${booking.room._id}`} className="p-2 hover:bg-gray-50 rounded-xl transition-all">
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
