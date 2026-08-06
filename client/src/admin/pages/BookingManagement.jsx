import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  CreditCard,
  User,
  Home,
  Calendar,
  CalendarPlus,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  MessageSquare,
  Share2,
  CircleCheckBig,
  MoreHorizontal
} from 'lucide-react';
import api from '../../api';
import { toast } from 'react-hot-toast';

// Shadcn UI Imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusVariant = {
  confirmed: 'success',
  pending: 'warning',
  completed: 'secondary',
  cancelled: 'destructive'
};

const paymentVariant = {
  paid: 'success',
  unpaid: 'warning',
  refunded: 'secondary',
  partially_paid: 'warning'
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

const BookingManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundingBooking, setRefundingBooking] = useState(null);

  // Date Filter States
  const [dateFilter, setDateFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Payment Notes Modal State
  const [paymentModalBooking, setPaymentModalBooking] = useState(null);
  const [paymentModalNotes, setPaymentModalNotes] = useState('');

  // Add-on Details Modal State
  const [activeAddonsBooking, setActiveAddonsBooking] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch bookings from API
  const fetchBookings = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);
      const res = await api.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      if (showLoadingSpinner) toast.error('Failed to load bookings');
      console.error(err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(true);

    const markViewed = async () => {
      try {
        await api.patch('/bookings/mark-viewed');
      } catch (err) {
        console.error('Failed to mark bookings as viewed:', err);
      }
    };
    markViewed();

    // Poll for new bookings in real-time every 8 seconds
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Reset page to 1 when search, filter, source filter, date filter, or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sourceFilter, dateFilter, startDate, endDate, itemsPerPage]);

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

  const handleProcessRefund = async () => {
    if (!refundingBooking) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/bookings/${refundingBooking._id}/refund`);
      toast.success(res.data.message || 'Refund mail was sent successfully');
      
      // Update local state
      const updatedBookings = bookings.map(b => 
        b._id === refundingBooking._id ? { ...b, paymentStatus: 'refunded' } : b
      );
      setBookings(updatedBookings);
      setRefundingBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
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
    const roomName = b.rooms && b.rooms.length > 0 ? b.rooms.map(r => r.name).join(' ') : (b.room?.name || '');
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

    // Source Filter Logic
    const matchSource =
      sourceFilter === 'All' ||
      (sourceFilter === 'Admin' && b.createdByAdmin) ||
      (sourceFilter === 'Online' && !b.createdByAdmin);

    // Date Filter Logic
    let matchDate = true;
    if (dateFilter !== 'All') {
      const createdDate = new Date(b.createdAt);
      createdDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      if (dateFilter === 'Today') {
        matchDate = createdDate.getTime() === today.getTime();
      } else if (dateFilter === 'Yesterday') {
        matchDate = createdDate.getTime() === yesterday.getTime();
      } else if (dateFilter === 'ThisMonth') {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        matchDate = createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      } else if (dateFilter === 'LastMonth') {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - 1);
        const lastMonth = targetDate.getMonth();
        const lastMonthYear = targetDate.getFullYear();
        matchDate = createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear;
      } else if (dateFilter === 'Custom' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const createdTime = new Date(b.createdAt).getTime();
        matchDate = createdTime >= start.getTime() && createdTime <= end.getTime();
      }
    }

    return matchSearch && matchStatus && matchSource && matchDate;
  });

  // Stats Calculations
  const totalRevenue = bookings.reduce((sum, b) => getEffectiveStatus(b) !== 'cancelled' ? sum + b.totalAmount : sum, 0);
  const totalBookingsCount = bookings.length;
  const confirmedCount = bookings.filter(b => getEffectiveStatus(b) === 'confirmed').length;
  const pendingCount = bookings.filter(b => getEffectiveStatus(b) === 'pending').length;
  const completedCount = bookings.filter(b => getEffectiveStatus(b) === 'completed').length;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayBookingsCount = bookings.filter(b => {
    if (!b.createdAt) return false;
    const createdDate = new Date(b.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === todayDate.getTime();
  }).length;

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

  // WhatsApp Share Helper
  const handleShareWhatsApp = (booking) => {
    const rawPhone = booking.user?.phone || '';
    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      toast.error('Customer phone number not available');
      return;
    }
    const cleanPhone = phone.startsWith('91') ? phone : (phone.length === 10 ? `91${phone}` : phone);

    const roomName = booking.rooms && booking.rooms.length > 0
      ? booking.rooms.map(r => r.name).join(', ')
      : (booking.room?.name || 'Villa Room');
    const customerName = booking.user?.name || 'Customer';
    const cIn = booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const cOut = booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const due = booking.dueAmount > 0 ? booking.dueAmount : (booking.paymentStatus === 'unpaid' ? booking.totalAmount : 0);

    const paymentUrl = `${window.location.origin}/booking-details/${booking._id}`;

    const message = 
`Hello *${customerName}*,

Please complete your booking payment for *The Balified Villa*:

• *Room:* ${roomName}
• *Dates:* ${cIn} - ${cOut}
• *Due Amount:* ₹${due.toLocaleString('en-IN')}

🔗 *Payment Link:* ${paymentUrl}

Thank you!`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="truncate">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
            <Calendar className="w-5 h-5 text-primary-600 shrink-0" />
            <span className="truncate">Bookings Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Admin Panel Room Bookings • Create Customer Booking & Share WhatsApp Payment Link
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/create-booking')}
          className="shadow text-xs flex items-center gap-2 transition-all shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
          Create Room Booking
        </Button>
      </div>

      {/* Dynamic Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-emerald-50/50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 truncate">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold truncate">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-1 truncate">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>Excludes Cancelled</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="bg-gradient-to-br from-violet-50/50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-violet-600 truncate">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-violet-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold truncate">{totalBookingsCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">All records history</p>
          </CardContent>
        </Card>

        {/* Today's Bookings */}
        <Card className="bg-gradient-to-br from-purple-50/50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-purple-600 truncate">Today's Bookings</CardTitle>
            <Clock className="h-4 w-4 text-purple-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold truncate">{todayBookingsCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Placed today</p>
          </CardContent>
        </Card>

        {/* Confirmed */}
        <Card className="bg-gradient-to-br from-green-50/50 to-white cursor-pointer hover:bg-green-50/30 transition-colors" onClick={() => setStatusFilter('confirmed')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-green-600 truncate">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold truncate">{confirmedCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Awaiting check-in</p>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="bg-gradient-to-br from-amber-50/50 to-white cursor-pointer hover:bg-amber-50/30 transition-colors" onClick={() => setStatusFilter('pending')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 truncate">Pending Action</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold truncate">{pendingCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Requires approval</p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="bg-gradient-to-br from-blue-50/50 to-white cursor-pointer hover:bg-blue-50/30 transition-colors" onClick={() => setStatusFilter('completed')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-600 truncate">Completed</CardTitle>
            <Home className="h-4 w-4 text-blue-600 shrink-0" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold truncate">{completedCount}</div>
            <p className="text-[10px] text-gray-400 mt-1 truncate">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1 flex-1 sm:max-w-xs shadow-sm w-full">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <Input
            type="text"
            placeholder="Search guest, room, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none p-0 h-8 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-slate-900 placeholder:text-gray-400"
          />
        </div>

        <div className="w-full sm:w-auto min-w-[130px]">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
            <SelectTrigger className="h-10 bg-white text-slate-900 border border-gray-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source Filter (All / Online / Admin Created) */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <Select value={sourceFilter} onValueChange={(val) => setSourceFilter(val)}>
            <SelectTrigger className="h-10 bg-white text-slate-900 border border-gray-200">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sources</SelectItem>
              <SelectItem value="Online">Online / Customer</SelectItem>
              <SelectItem value="Admin">Admin Created</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Filter Dropdown */}
        <div className="w-full sm:w-auto min-w-[140px]">
          <Select value={dateFilter} onValueChange={(val) => setDateFilter(val)}>
            <SelectTrigger className="h-10 bg-white text-slate-900 border border-gray-200">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Dates</SelectItem>
              <SelectItem value="Today">Today</SelectItem>
              <SelectItem value="Yesterday">Yesterday</SelectItem>
              <SelectItem value="ThisMonth">This Month</SelectItem>
              <SelectItem value="LastMonth">Last Month</SelectItem>
              <SelectItem value="Custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Pickers */}
        {dateFilter === 'Custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 text-sm bg-white text-slate-900 border border-gray-200"
            />
            <span className="text-gray-400 text-xs shrink-0 font-medium">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 text-sm bg-white text-slate-900 border border-gray-200"
            />
          </div>
        )}
      </div>

      {/* Bookings Table Container */}
      <Card className="overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading records...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">ID</TableHead>
                <TableHead className="whitespace-nowrap">Guest Details</TableHead>
                <TableHead className="whitespace-nowrap">Room Type</TableHead>
                <TableHead className="whitespace-nowrap">Add-ons</TableHead>
                <TableHead className="whitespace-nowrap">Check In - Out</TableHead>
                <TableHead className="whitespace-nowrap">Guests</TableHead>
                <TableHead className="whitespace-nowrap">Amount</TableHead>
                <TableHead className="whitespace-nowrap">Payment</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((b) => {
                const roomName = b.rooms && b.rooms.length > 0 
                  ? b.rooms.map(r => r.name).join(', ') 
                  : b.room?.name || 'Deleted Room';

                const guestName = b.guestName || b.user?.name || 'Deleted User';
                const guestEmail = b.guestEmail || b.user?.email || 'N/A';
                const guestPhone = b.guestPhone || b.user?.phone || 'No Phone';
                const effectiveStatus = getEffectiveStatus(b);
                const checkInFormatted = b.checkIn ? new Date(b.checkIn).toLocaleDateString() : 'N/A';
                const checkOutFormatted = b.checkOut ? new Date(b.checkOut).toLocaleDateString() : 'N/A';

                return (
                  <TableRow 
                    key={b._id} 
                    className={effectiveStatus === 'cancelled' ? 'bg-red-50/30 hover:bg-red-50/50' : ''}
                  >
                    {/* Booking ID */}
                    <TableCell className="font-mono text-xs truncate max-w-[100px] whitespace-nowrap" title={b._id}>
                      {b._id ? `${b._id.slice(-8).toUpperCase()}` : 'N/A'}
                    </TableCell>

                    {/* Guest Details */}
                    <TableCell className="truncate max-w-[160px] whitespace-nowrap" title={`${guestName} | ${guestEmail} | ${guestPhone}`}>
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-gray-900 truncate">{guestName}</span>
                        {b.createdByAdmin && (
                          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] font-extrabold px-1.5 py-0 shrink-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 truncate block">{guestEmail}</span>
                    </TableCell>

                    {/* Room Type */}
                    <TableCell className="truncate max-w-[140px] whitespace-nowrap" title={roomName}>
                      <span className="font-medium text-gray-700 truncate block">{roomName}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider truncate block">{b.room?.category || 'N/A'}</span>
                    </TableCell>

                    {/* Add-ons */}
                    <TableCell className="truncate max-w-[90px] whitespace-nowrap">
                      {b.addons && b.addons.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveAddonsBooking(b)}
                          className="h-7 px-2 text-[10px] font-medium"
                        >
                          {b.addons.length} Service{b.addons.length > 1 ? 's' : ''}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">None</span>
                      )}
                    </TableCell>

                    {/* Check In - Out */}
                    <TableCell className="truncate max-w-[150px] whitespace-nowrap font-medium text-xs text-gray-650" title={`${checkInFormatted} to ${checkOutFormatted}`}>
                      {checkInFormatted} - {checkOutFormatted}
                    </TableCell>

                    {/* Guests */}
                    <TableCell className="truncate max-w-[90px] whitespace-nowrap text-xs text-gray-600" title={`${b.adults || 1} adults, ${b.children || 0} children`}>
                      {b.adults || 1}A, {b.children || 0}C
                      {Number(b.extraBedCount) > 0 && (
                        <span className="ml-1 inline-block text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded" title={`${b.extraBedCount} Extra Bed(s)`}>
                          +{b.extraBedCount} Bed
                        </span>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="truncate max-w-[110px] whitespace-nowrap text-sm font-semibold text-gray-950">
                      ₹{b.totalAmount}
                    </TableCell>

                    {/* Payment Status */}
                    <TableCell className="truncate max-w-[110px] whitespace-nowrap">
                      <Badge variant={paymentVariant[b.paymentStatus || 'unpaid']} className="uppercase text-[9px] tracking-wide font-bold px-2 py-0.5">
                        {b.paymentStatus === 'partially_paid' ? 'part' : (b.paymentStatus || 'unpaid')}
                      </Badge>
                    </TableCell>

                    {/* Booking Status */}
                    <TableCell className="truncate max-w-[110px] whitespace-nowrap">
                      <Badge variant={statusVariant[effectiveStatus || 'pending']} className="uppercase text-[9px] tracking-wide font-bold px-2 py-0.5">
                        {effectiveStatus}
                      </Badge>
                    </TableCell>

                    {/* Actions Dropdown */}
                    <TableCell className="text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedBooking(b)}>
                            <Eye className="mr-2 h-4 w-4 text-violet-600" />
                            View Details
                          </DropdownMenuItem>
                          {effectiveStatus !== 'completed' && effectiveStatus !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => handleShareWhatsApp(b)}>
                              <Share2 className="mr-2 h-4 w-4 text-emerald-600" />
                              WhatsApp Link
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => {
                            setPaymentModalBooking(b);
                            setPaymentModalNotes(b.paymentNotes || '');
                          }}>
                            <MessageSquare className="mr-2 h-4 w-4 text-amber-600" />
                            Notes & Log
                          </DropdownMenuItem>

                          {effectiveStatus === 'cancelled' && b.paymentStatus === 'paid' && (
                            <DropdownMenuItem onClick={() => setRefundingBooking(b)}>
                              <CircleCheckBig className="mr-2 h-4 w-4 text-red-600" />
                              Process Refund
                            </DropdownMenuItem>
                          )}

                          {effectiveStatus === 'pending' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUpdateStatus(b._id, 'confirmed')} disabled={actionLoading}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Confirm Booking
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(b._id, 'cancelled')} disabled={actionLoading}>
                                <XCircle className="mr-2 h-4 w-4 text-red-650" />
                                Cancel Booking
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <h4 className="font-bold text-gray-700 text-sm">No records found</h4>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term.</p>
          </div>
        )}
      </Card>

      {/* Pagination Controls */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-100 rounded-xl px-6 py-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium truncate max-w-full">
            Showing <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-gray-800">
              {Math.min(indexOfLastItem, filtered.length)}
            </span>{' '}
            of <span className="font-bold text-gray-800">{filtered.length}</span> bookings
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Show</span>
              <Select value={String(itemsPerPage)} onValueChange={(val) => setItemsPerPage(Number(val))}>
                <SelectTrigger className="h-8 w-[70px] bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent minWidth="80px">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 p-1 border border-gray-100 rounded-xl shrink-0">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 text-xs text-gray-400 font-bold select-none">
                      ...
                    </span>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 text-xs p-0"
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-500" />
              Booking Transaction Details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs pt-1 truncate">
              ID: {selectedBooking?._id}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 pt-2">
              {/* Guest Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Guest Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm">
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Name</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedBooking.guestName || selectedBooking.user?.name || 'Deleted User'}</span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Email Address</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedBooking.guestEmail || selectedBooking.user?.email || 'N/A'}</span>
                  </div>
                  <div className="truncate col-span-1 md:col-span-2">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Phone Number</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedBooking.guestPhone || selectedBooking.user?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Room Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> Property & Room Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm">
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Room Type</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {selectedBooking.rooms && selectedBooking.rooms.length > 0 
                        ? selectedBooking.rooms.map(r => r.name).join(', ') 
                        : selectedBooking.room?.name || 'Deleted Room'}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Category</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedBooking.room?.category || 'N/A'}</span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Base Rate</span>
                    <span className="font-semibold text-gray-800 truncate block">₹{selectedBooking.room?.price || 0} / night</span>
                  </div>
                </div>
              </div>

              {/* Stay details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Stay & Check Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs">
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Check In</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Check Out</span>
                    <span className="font-semibold text-gray-800 truncate block">{selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Duration</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {getNights(selectedBooking.checkIn, selectedBooking.checkOut)} Night(s)
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Guests</span>
                    <span className="font-semibold text-gray-800 truncate block">
                      {selectedBooking.adults || 1}A, {selectedBooking.children || 0}C
                    </span>
                  </div>
                  {Number(selectedBooking.extraBedCount) > 0 && (
                    <div className="truncate">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Extra Bed</span>
                      <span className="font-semibold text-amber-700 truncate block">
                        {selectedBooking.extraBedCount} Bed(s) — ₹{Number(selectedBooking.extraBedPrice || 0).toLocaleString('en-IN')}/night
                      </span>
                    </div>
                  )}
                  {selectedBooking.specialRequests && (
                    <div className="col-span-2 md:col-span-4 border-t border-gray-200/50 pt-2.5 mt-1 truncate">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Special Requests</span>
                      <span className="text-xs text-gray-600 truncate block">{selectedBooking.specialRequests}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Addons */}
              {selectedBooking.addons && selectedBooking.addons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Add-on Services
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs">
                    {selectedBooking.addons.map((addon, aIdx) => (
                      <div key={aIdx} className="truncate">
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{addon.name}</span>
                        <span className="font-semibold text-gray-800 block">₹{addon.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Razorpay & Amount Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs">
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Order ID</span>
                    <span className="font-semibold text-gray-700 truncate block">{selectedBooking.razorpayOrderId || 'N/A'}</span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Payment ID</span>
                    <span className="font-semibold text-gray-700 truncate block">{selectedBooking.razorpayPaymentId || 'N/A'}</span>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Payment Status</span>
                    <Badge variant={paymentVariant[selectedBooking.paymentStatus || 'unpaid']} className="uppercase text-[9px] mt-1 font-bold">
                      {selectedBooking.paymentStatus || 'unpaid'}
                    </Badge>
                  </div>
                  <div className="truncate">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Amount</span>
                    <span className="font-bold text-gray-800 text-sm block mt-0.5">₹{selectedBooking.totalAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedBooking && getEffectiveStatus(selectedBooking) === 'pending' && (
              <>
                <Button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedBooking._id, 'confirmed')}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 h-9"
                >
                  Confirm Booking
                </Button>
                <Button
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus(selectedBooking._id, 'cancelled')}
                  variant="destructive"
                  className="h-9"
                >
                  Cancel Booking
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setSelectedBooking(null)} className="h-9">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add-on Services Dialog */}
      <Dialog open={!!activeAddonsBooking} onOpenChange={(open) => !open && setActiveAddonsBooking(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-600" />
              Add-on Services
            </DialogTitle>
            <DialogDescription className="truncate">
              Selected room: {activeAddonsBooking?.room?.name || 'Villa Room'}
            </DialogDescription>
          </DialogHeader>

          {activeAddonsBooking && (
            <div className="space-y-4 pt-2">
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[250px] overflow-y-auto">
                {activeAddonsBooking.addons.map((addon, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50/50 text-xs">
                    <span className="font-semibold text-gray-800 truncate pr-2 max-w-[200px]" title={addon.name}>{addon.name}</span>
                    <span className="font-bold text-violet-700 shrink-0">₹{addon.price}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">Total Add-on Cost</span>
                <span className="text-base font-bold text-gray-900 shrink-0">
                  ₹{activeAddonsBooking.addons.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setActiveAddonsBooking(null)} className="h-9 w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <Dialog open={!!refundingBooking} onOpenChange={(open) => !open && setRefundingBooking(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <CircleCheckBig className="w-5 h-5" />
              Confirm Refund Process
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {refundingBooking && (
            <div className="space-y-3 pt-2 text-sm text-gray-600">
              <p>
                Are you sure you want to process the refund of <span className="font-bold">₹{refundingBooking.totalAmount.toLocaleString()}</span> for <span className="font-bold">{refundingBooking.user?.name || 'Guest'}</span>?
              </p>
              <p className="text-xs text-gray-450 bg-gray-50 p-3 rounded-lg border border-gray-200/50">
                This will update the payment status to <strong className="text-gray-700">refunded</strong> and notify the user via email.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRefundingBooking(null)} className="h-9">
              Cancel
            </Button>
            <Button
              disabled={actionLoading}
              onClick={handleProcessRefund}
              variant="destructive"
              className="h-9 flex items-center gap-2"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Notes & Completion Dialog */}
      <Dialog open={!!paymentModalBooking} onOpenChange={(open) => !open && setPaymentModalBooking(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" />
              Payment Notes & Log
            </DialogTitle>
            <DialogDescription className="font-mono text-xs truncate">
              ID: {paymentModalBooking?._id?.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {paymentModalBooking && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-bold text-gray-800">₹{paymentModalBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Paid Amount:</span>
                  <span className="font-bold text-emerald-600">₹{paymentModalBooking.paidAmount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Due Balance:</span>
                  <span className="font-bold text-amber-600">₹{paymentModalBooking.dueAmount || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest truncate">Notes & Log Data</label>
                <Textarea
                  value={paymentModalNotes}
                  onChange={(e) => setPaymentModalNotes(e.target.value)}
                  placeholder="Enter manual payment log details here..."
                  className="resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {paymentModalBooking && paymentModalBooking.dueAmount > 0 && (
              <Button
                onClick={async () => {
                  try {
                    await api.patch(`/bookings/${paymentModalBooking._id}/payment-complete`);
                    toast.success('Payment completed successfully!');
                    setPaymentModalBooking(null);
                    fetchBookings();
                  } catch (err) {
                    toast.error('Failed to complete payment');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 h-9 w-full flex justify-center items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                Mark Paid
              </Button>
            )}
            <Button
              onClick={async () => {
                try {
                  await api.patch(`/bookings/${paymentModalBooking._id}/payment-notes`, { notes: paymentModalNotes });
                  toast.success('Notes saved successfully!');
                  setPaymentModalBooking(null);
                  fetchBookings();
                } catch (err) {
                  toast.error('Failed to save notes');
                }
              }}
              className="h-9 w-full"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManagement;
