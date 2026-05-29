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

const OverviewGraph = ({ data }) => {
  const [metric, setMetric] = useState('revenue'); // 'revenue' or 'bookings'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map(d => d[metric]);
  const maxValue = Math.max(...values, metric === 'revenue' ? 1000 : 10);
  
  // Round max value up to a clean number for nice Y-axis ticks
  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxValue))) || 1;
  const cleanInterval = orderOfMagnitude / 2 || 1;
  const yAxisMax = Math.ceil(maxValue / cleanInterval) * cleanInterval || 10;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i * chartWidth) / (data.length - 1);
    const y = paddingTop + chartHeight - (d[metric] / yAxisMax) * chartHeight;
    return { x, y, ...d };
  });

  // Generate line path
  const linePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Generate area path
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  // Y Axis ticks (5 ticks from 0 to yAxisMax)
  const yTicks = Array.from({ length: 5 }, (_, i) => (yAxisMax * i) / 4);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Overview Trend</h3>
          <p className="text-[10px] text-gray-400">Monthly breakdown of bookings and revenue</p>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex bg-gray-100 p-0.5 rounded-lg self-start">
          <button
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${metric === 'revenue' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Revenue ($)
          </button>
          <button
            onClick={() => setMetric('bookings')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${metric === 'bookings' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Bookings
          </button>
        </div>
      </div>

      <div className="relative w-full mt-2">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#185adb" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#185adb" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / yAxisMax) * chartHeight;
            return (
              <g key={i} className="opacity-60">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#f1f5f9" 
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 3} 
                  textAnchor="end" 
                  className="fill-gray-400 text-[10px] font-medium font-sans"
                >
                  {metric === 'revenue' ? `$${Math.round(tick).toLocaleString()}` : Math.round(tick)}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {areaPath && (
            <path 
              d={areaPath} 
              fill="url(#chartGradient)" 
              className="transition-all duration-300"
            />
          )}

          {/* The line itself */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#185adb" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* X Axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={paddingTop + chartHeight + 20}
              textAnchor="middle"
              className="fill-gray-400 text-[10px] font-semibold font-sans"
            >
              {p.name.split(' ')[0]}
            </text>
          ))}

          {/* Interactive dots and hit targets */}
          {points.map((p, i) => (
            <g 
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill="transparent"
                className="cursor-pointer"
              />
              
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? "6" : "4"}
                className={`fill-white stroke-[#185adb] transition-all duration-150 cursor-pointer ${hoveredIndex === i ? 'stroke-[3px]' : 'stroke-2'}`}
              />
            </g>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute z-10 bg-slate-900 text-white rounded-lg p-2 shadow-xl border border-slate-800 flex flex-col text-[10px] font-sans pointer-events-none transition-all duration-100"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              transform: 'translate(-50%, -100%)',
              top: `${(points[hoveredIndex].y / height) * 100 - 15}%`,
            }}
          >
            <span className="font-semibold text-gray-300">{points[hoveredIndex].name}</span>
            <span className="font-bold text-white mt-0.5">
              {metric === 'revenue' 
                ? `$${points[hoveredIndex].revenue.toLocaleString()}` 
                : `${points[hoveredIndex].bookings} bookings`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
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

      {/* Overview Trend & Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph Card */}
        <div className="lg:col-span-2">
          <OverviewGraph data={stats.monthlyStats} />
        </div>

        {/* Secondary stats stacked on the right */}
        <div className="space-y-4 lg:col-span-1 flex flex-col justify-between">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex-1 flex flex-col justify-center">
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

          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Today's Check-ins</p>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.todayCheckIns}</p>
            <p className="text-xs text-blue-600 mt-2 font-medium">{stats.todayCheckOuts} check-out(s) today</p>
          </div>
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
