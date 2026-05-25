import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, X, Loader2, CreditCard, User, Home, Calendar } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

const statusConfig = {
  confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-700 border border-green-200' },
  pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700 border border-yellow-250' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-700 border border-blue-200' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700 border border-red-200' },
};

const paymentConfig = {
  paid: 'bg-green-100 text-green-700 border border-green-200',
  unpaid: 'bg-orange-100 text-orange-700 border border-orange-200',
  refunded: 'bg-gray-100 text-gray-700 border border-gray-250',
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update Booking Status Handler
  const handleUpdateStatus = async (id, status) => {
    try {
      setActionLoading(true);
      await api.patch(`/bookings/${id}/status`, { status });
      toast.success(`Booking status updated to ${status}`);
      // Refresh list
      const updatedBookings = bookings.map(b => b._id === id ? { ...b, status } : b);
      setBookings(updatedBookings);
      // Update selected modal details if open
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking(prev => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const statuses = ['All', 'pending', 'confirmed', 'completed', 'cancelled'];
  
  // Filtering Logic
  const filtered = bookings.filter((b) => {
    const guestName = b.user?.name || '';
    const guestEmail = b.user?.email || '';
    const guestPhone = b.user?.phone || '';
    const roomName = b.room?.name || '';
    const mongoId = b._id || '';
    const razorpayPayId = b.razorpayPaymentId || '';

    const matchSearch = 
      guestName.toLowerCase().includes(search.toLowerCase()) || 
      guestEmail.toLowerCase().includes(search.toLowerCase()) ||
      guestPhone.toLowerCase().includes(search.toLowerCase()) ||
      roomName.toLowerCase().includes(search.toLowerCase()) ||
      mongoId.toLowerCase().includes(search.toLowerCase()) ||
      razorpayPayId.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate booking nights helper
  const getNights = (inDate, outDate) => {
    if (!inDate || !outDate) return 0;
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diff = end - start;
    return diff > 0 ? Math.round(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 sm:max-w-xs shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search guest, room, ID, transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm text-gray-600 outline-none bg-transparent cursor-pointer font-bold"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150">
                  {['Booking ID', 'Guest details', 'Room type', 'Check In / Out', 'Guests', 'Amount', 'Payment status', 'Booking status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono text-gray-500" title={b._id}>
                      {b._id ? `${b._id.slice(-8).toUpperCase()}` : 'N/A'}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-gray-800">{b.user?.name || 'Deleted User'}</p>
                      <p className="text-xs text-gray-400 font-medium">{b.user?.email || 'N/A'}</p>
                      <p className="text-xs text-violet-650 font-bold mt-0.5">{b.user?.phone || 'No Phone'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-700">{b.room?.name || 'Deleted Room'}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{b.room?.category || 'N/A'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 font-semibold">
                      <p>{b.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-gray-400 font-medium">to {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-center text-gray-600">{b.guests}</td>
                    <td className="px-5 py-3.5 text-sm font-black text-gray-800">${b.totalAmount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${paymentConfig[b.paymentStatus || 'unpaid']}`}>
                        {b.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusConfig[b.status || 'pending'].class}`}>
                        {statusConfig[b.status || 'pending'].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition-colors cursor-pointer" 
                          title="View Details"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        {b.status === 'pending' && (
                          <>
                            <button 
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(b._id, 'confirmed')}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-40 cursor-pointer" 
                              title="Confirm"
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                            </button>
                            <button 
                              disabled={actionLoading}
                              onClick={() => handleUpdateStatus(b._id, 'cancelled')}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-40 cursor-pointer" 
                              title="Cancel"
                            >
                              <XCircle className="w-4.5 h-4.5" />
                            </button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(b._id, 'completed')}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors disabled:opacity-40 cursor-pointer" 
                            title="Complete Booking"
                          >
                            <CheckCircle className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <h4 className="font-bold text-gray-700 text-sm">No records found</h4>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-950 text-base flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-violet-600" />
                  Booking Transaction Details
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {selectedBooking._id}</p>
              </div>
              <button 
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-150 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Guest Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-violet-600 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Guest Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-150 rounded-2xl p-4">
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</span>
                    <span className="text-sm font-bold text-gray-800">{selectedBooking.user?.name || 'Deleted User'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</span>
                    <span className="text-sm font-bold text-gray-800">{selectedBooking.user?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</span>
                    <span className="text-sm font-bold text-gray-800">{selectedBooking.user?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Room Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-violet-600 tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> Property & Room Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-150 rounded-2xl p-4">
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Room Type</span>
                    <span className="text-sm font-bold text-gray-800">{selectedBooking.room?.name || 'Deleted Room'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</span>
                    <span className="text-sm font-bold text-gray-800">{selectedBooking.room?.category || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Rate</span>
                    <span className="text-sm font-semibold text-gray-800">${selectedBooking.room?.price || 0} / night</span>
                  </div>
                </div>
              </div>

              {/* Staying Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-violet-600 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Stay & Check Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 border border-gray-150 rounded-2xl p-4">
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Check In</span>
                    <span className="text-xs font-bold text-gray-800">{selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Check Out</span>
                    <span className="text-xs font-bold text-gray-800">{selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</span>
                    <span className="text-xs font-bold text-gray-800">
                      {getNights(selectedBooking.checkIn, selectedBooking.checkOut)} Night(s)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Guests</span>
                    <span className="text-xs font-bold text-gray-800">{selectedBooking.guests} Person(s)</span>
                  </div>
                  {selectedBooking.specialRequests && (
                    <div className="col-span-2 md:col-span-4 border-t border-gray-200/50 pt-2.5 mt-1">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Special Requests</span>
                      <span className="text-xs text-gray-650 font-medium">{selectedBooking.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Razorpay Transaction details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-violet-600 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Razorpay Transaction Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-150 rounded-2xl p-4">
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Razorpay Order ID</span>
                    <span className="text-xs font-mono font-bold text-gray-700">{selectedBooking.razorpayOrderId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Razorpay Payment ID</span>
                    <span className="text-xs font-mono font-bold text-gray-750">{selectedBooking.razorpayPaymentId || 'N/A'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Razorpay Signature</span>
                    <span className="text-[10px] font-mono break-all text-gray-500 select-all block leading-tight border border-gray-200/60 p-2 rounded bg-white mt-1">
                      {selectedBooking.razorpaySignature || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Status</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${paymentConfig[selectedBooking.paymentStatus || 'unpaid']}`}>
                      {selectedBooking.paymentStatus || 'unpaid'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Paid Amount</span>
                    <span className="text-sm font-black text-gray-800">${selectedBooking.totalAmount}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Current Booking Status</span>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusConfig[selectedBooking.status || 'pending'].class} mt-0.5`}>
                  {statusConfig[selectedBooking.status || 'pending'].label}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedBooking.status === 'pending' && (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedBooking._id, 'confirmed')}
                      className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all cursor-pointer shadow shadow-green-500/10"
                    >
                      Confirm Booking
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedBooking._id, 'cancelled')}
                      className="bg-red-650 hover:bg-red-750 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all cursor-pointer shadow shadow-red-500/10"
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateStatus(selectedBooking._id, 'completed')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl disabled:opacity-40 transition-all cursor-pointer shadow shadow-blue-500/10"
                  >
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
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

export default BookingManagement;
