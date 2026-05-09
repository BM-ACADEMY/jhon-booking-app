import { CalendarCheck, Users, BedDouble, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../components/StatCard';

const recentBookings = [
  { id: 'BK001', guest: 'Alice Johnson', room: 'Deluxe Suite', checkIn: '2026-05-10', checkOut: '2026-05-13', amount: '$450', status: 'confirmed' },
  { id: 'BK002', guest: 'Robert Smith', room: 'Presidential Suite', checkIn: '2026-05-11', checkOut: '2026-05-14', amount: '$920', status: 'pending' },
  { id: 'BK003', guest: 'Emily Davis', room: 'Standard Room', checkIn: '2026-05-09', checkOut: '2026-05-10', amount: '$120', status: 'completed' },
  { id: 'BK004', guest: 'Michael Brown', room: 'Deluxe Room', checkIn: '2026-05-12', checkOut: '2026-05-15', amount: '$340', status: 'cancelled' },
  { id: 'BK005', guest: 'Sarah Wilson', room: 'Suite Room', checkIn: '2026-05-13', checkOut: '2026-05-16', amount: '$580', status: 'confirmed' },
];

const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value="248" icon={CalendarCheck} change="12%" changeType="up" color="blue" />
        <StatCard title="Total Revenue" value="$32,450" icon={DollarSign} change="8.2%" changeType="up" color="green" />
        <StatCard title="Active Rooms" value="24" icon={BedDouble} change="2" changeType="up" color="primary" />
        <StatCard title="Total Guests" value="1,042" icon={Users} change="5.1%" changeType="up" color="purple" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">78%</p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">19 of 24 rooms occupied</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Pending Bookings</p>
            <Clock className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">14</p>
          <p className="text-xs text-yellow-600 mt-2 font-medium">Awaiting confirmation</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Today's Check-ins</p>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">6</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">4 check-outs today</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Booking ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Guest</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Room</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Check In</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Check Out</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((booking) => {
                const status = statusConfig[booking.status];
                return (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-mono text-gray-600">{booking.id}</td>
                    <td className="px-6 py-3.5 text-sm font-medium text-gray-800">{booking.guest}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 hidden md:table-cell">{booking.room}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 hidden lg:table-cell">{booking.checkIn}</td>
                    <td className="px-6 py-3.5 text-sm text-gray-600 hidden lg:table-cell">{booking.checkOut}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{booking.amount}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
