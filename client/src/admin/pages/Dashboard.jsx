import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Users, BedDouble, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../../api';

const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bookings/stats/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading dashboard metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-500 font-bold">
        Failed to load dashboard statistics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats.totalBookings.toString()} icon={CalendarCheck} color="blue" />
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="green" />
        <StatCard title="Occupied Rooms" value={stats.occupiedRoomsCount.toString()} icon={BedDouble} color="primary" />
        <StatCard title="Total Guests" value={stats.totalGuests.toString()} icon={Users} color="purple" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{Math.round(stats.occupancyRate)}%</p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.occupancyRate}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{stats.occupiedRoomsCount} of {stats.totalRooms} rooms occupied</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Today's Check-ins</p>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.todayCheckIns}</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">{stats.todayCheckOuts} check-out(s) today</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
        </div>
        <div className="overflow-x-auto">
          {stats.recentBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold">
              No recent bookings found.
            </div>
          ) : (
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
                {stats.recentBookings.map((booking) => {
                  const status = statusConfig[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700', icon: Clock };
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 text-sm font-mono text-gray-600" title={booking.id}>
                        {booking.id ? `${booking.id.slice(-8).toUpperCase()}` : 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-gray-800">{booking.guest}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 hidden md:table-cell">{booking.room}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 hidden lg:table-cell">{booking.checkIn}</td>
                      <td className="px-6 py-3.5 text-sm text-gray-600 hidden lg:table-cell">{booking.checkOut}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-gray-800">{booking.amount}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
