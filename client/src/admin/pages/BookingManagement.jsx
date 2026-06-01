import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Loader2,
  CreditCard,
  User,
  Home,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  Percent
} from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

const statusConfig = {
  confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-700 border border-green-200' },
  pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700 border border-yellow-250' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-700 border border-blue-200' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700 border border-red-200' },
};

// Auto-complete: if confirmed and checkout date has passed → treat as completed
const getEffectiveStatus = (booking) => {
  if (booking.status === 'confirmed' && booking.checkOut) {
    const checkOut = new Date(booking.checkOut);
    checkOut.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkOut < today) return 'completed';
  }
  return booking.status;
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Reset page to 1 when search, filter or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, itemsPerPage]);

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

  // Filtering Logic with safe fallbacks
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

    const effectiveStatus = getEffectiveStatus(b);
    const matchStatus = statusFilter === 'All' || effectiveStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats Calculations from full bookings list (uses effective status for accuracy)
  const totalRevenue = bookings.reduce((sum, b) => getEffectiveStatus(b) !== 'cancelled' ? sum + b.totalAmount : sum, 0);
  const totalBookingsCount = bookings.length;
  const confirmedCount = bookings.filter(b => getEffectiveStatus(b) === 'confirmed').length;
  const pendingCount = bookings.filter(b => getEffectiveStatus(b) === 'pending').length;
  const completedCount = bookings.filter(b => getEffectiveStatus(b) === 'completed').length;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Calculate booking nights helper
  const getNights = (inDate, outDate) => {
    if (!inDate || !outDate) return 0;
    const start = new Date(inDate);
    const end = new Date(outDate);
    const diff = end - start;
    return diff > 0 ? Math.round(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue Card */}
        <div
          className="text-left bg-gradient-to-br from-emerald-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Revenue</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[10px] text-emerald-600 font-bold">
            <TrendingUp className="w-3 h-3" />
            <span>Excludes Cancelled</span>
          </div>
        </div>

        {/* Total Bookings Card */}
        <div
          className="text-left bg-gradient-to-br from-violet-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-violet-600 tracking-widest">Total Bookings</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalBookingsCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">All records history</p>
        </div>

        {/* Confirmed Card */}
        <button
          className={`text-left bg-gradient-to-br from-green-50 to-white hover:from-green-100/70 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden focus:outline-none w-full ${
            statusFilter === 'confirmed'
              ? 'border-gray-200'
              : 'border-gray-200'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">Confirmed</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{confirmedCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-green-500/10 text-green-600 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Awaiting check-in</p>
        </button>

        {/* Pending Card */}
        <button
          className={`text-left bg-gradient-to-br from-amber-50 to-white hover:from-amber-100/70 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden focus:outline-none w-full ${
            statusFilter === 'pending'
              ? 'border-gray-200'
              : 'border-gray-200'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Pending Action</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{pendingCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Requires approval</p>
        </button>

        {/* Completed Card */}
        <button
          className={`text-left bg-gradient-to-br from-blue-50 to-white hover:from-blue-100/70 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden focus:outline-none w-full ${
            statusFilter === 'completed'
              ? 'border-gray-200'
              : 'border-gray-200'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Completed</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{completedCount}</h3>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Successfully completed</p>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 sm:max-w-xs shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search guest, room, ID, transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full bg-transparent"
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

      {/* Bookings Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Booking ID', 'Guest details', 'Room type', 'Check In / Out', 'Guests', 'Amount', 'Payment status', 'Booking status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.map((b) => (
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
                    <td className="px-5 py-3.5 text-sm font-black text-gray-800">₹{b.totalAmount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${paymentConfig[b.paymentStatus || 'unpaid']}`}>
                        {b.paymentStatus || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusConfig[getEffectiveStatus(b) || 'pending'].class}`}>
                        {statusConfig[getEffectiveStatus(b) || 'pending'].label}
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
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-250" />
            <h4 className="font-bold text-gray-700 text-sm">No records found</h4>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
          {/* Entries Indicator */}
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-gray-800">
              {Math.min(indexOfLastItem, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-gray-800">{filtered.length}</span> bookings
          </div>

          {/* Right Controls Group */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Show Entries Selector */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Show</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span>entries</span>
            </div>

            {/* Pagination Navigation */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-200/60 rounded-xl">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-gray-400 font-bold select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-violet-600 text-white shadow shadow-violet-500/10'
                        : 'hover:bg-white text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
                <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusConfig[getEffectiveStatus(selectedBooking) || 'pending'].class} mt-0.5`}>
                  {statusConfig[getEffectiveStatus(selectedBooking) || 'pending'].label}
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
