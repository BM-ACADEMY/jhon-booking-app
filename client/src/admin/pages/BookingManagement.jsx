import { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';

const bookings = [
  { id: 'BK001', guest: 'Alice Johnson', email: 'alice@mail.com', room: 'Deluxe Suite', checkIn: '2026-05-10', checkOut: '2026-05-13', guests: 2, amount: 450, status: 'confirmed', paymentStatus: 'paid' },
  { id: 'BK002', guest: 'Robert Smith', email: 'robert@mail.com', room: 'Presidential Suite', checkIn: '2026-05-11', checkOut: '2026-05-14', guests: 3, amount: 920, status: 'pending', paymentStatus: 'unpaid' },
  { id: 'BK003', guest: 'Emily Davis', email: 'emily@mail.com', room: 'Standard Room', checkIn: '2026-05-09', checkOut: '2026-05-10', guests: 1, amount: 120, status: 'completed', paymentStatus: 'paid' },
  { id: 'BK004', guest: 'Michael Brown', email: 'michael@mail.com', room: 'Deluxe Room', checkIn: '2026-05-12', checkOut: '2026-05-15', guests: 2, amount: 340, status: 'cancelled', paymentStatus: 'refunded' },
  { id: 'BK005', guest: 'Sarah Wilson', email: 'sarah@mail.com', room: 'Suite Room', checkIn: '2026-05-13', checkOut: '2026-05-16', guests: 2, amount: 580, status: 'confirmed', paymentStatus: 'paid' },
];

const statusConfig = {
  confirmed: { label: 'Confirmed', class: 'bg-green-100 text-green-700' },
  pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-700' },
};

const paymentConfig = {
  paid: 'bg-green-100 text-green-700',
  unpaid: 'bg-orange-100 text-orange-700',
  refunded: 'bg-gray-100 text-gray-700',
};

const BookingManagement = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const statuses = ['All', 'pending', 'confirmed', 'completed', 'cancelled'];
  const filtered = bookings.filter((b) => {
    const matchSearch = b.guest.toLowerCase().includes(search.toLowerCase()) || b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by guest or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm text-gray-600 outline-none bg-transparent"
          >
            {statuses.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Booking ID', 'Guest', 'Room', 'Check In / Out', 'Guests', 'Amount', 'Payment', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-gray-600">{b.id}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{b.guest}</p>
                    <p className="text-xs text-gray-400">{b.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{b.room}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-600">
                    <p>{b.checkIn}</p>
                    <p className="text-gray-400">to {b.checkOut}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-center text-gray-600">{b.guests}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-800">${b.amount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${paymentConfig[b.paymentStatus]}`}>
                      {b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[b.status].class}`}>
                      {statusConfig[b.status].label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View">
                        <Eye className="w-4 h-4" />
                      </button>
                      {b.status === 'pending' && (
                        <>
                          <button className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Confirm">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Cancel">
                            <XCircle className="w-4 h-4" />
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p>No bookings found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
