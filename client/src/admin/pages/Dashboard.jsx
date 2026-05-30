import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Users, BedDouble, IndianRupee, TrendingUp, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../../api';

const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

// ─── Line / Area Chart ───────────────────────────────────────────────────────
const OverviewGraph = ({ data }) => {
  const [metric, setMetric] = useState('revenue');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 800;
  const height = 240;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map(d => d[metric]);
  const maxValue = Math.max(...values, metric === 'revenue' ? 1000 : 10);

  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxValue))) || 1;
  const cleanInterval = orderOfMagnitude / 2 || 1;
  const yAxisMax = Math.ceil(maxValue / cleanInterval) * cleanInterval || 10;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i * chartWidth) / (data.length - 1);
    const y = paddingTop + chartHeight - (d[metric] / yAxisMax) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const yTicks = Array.from({ length: 5 }, (_, i) => (yAxisMax * i) / 4);

  const formatYTick = (tick) => {
    if (metric === 'revenue') {
      if (tick >= 100000) return `₹${(tick / 100000).toFixed(1)}L`;
      if (tick >= 1000) return `₹${(tick / 1000).toFixed(0)}K`;
      return `₹${Math.round(tick)}`;
    }
    return Math.round(tick);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Overview Trend</h3>
          <p className="text-[10px] text-gray-400">Monthly breakdown of bookings and revenue</p>
        </div>
        <div className="flex bg-gray-100 p-0.5 rounded-lg self-start">
          <button
            onClick={() => setMetric('revenue')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${metric === 'revenue' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Revenue (₹)
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
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#185adb" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#185adb" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / yAxisMax) * chartHeight;
            return (
              <g key={i} className="opacity-60">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="fill-gray-400 text-[10px] font-medium font-sans">
                  {formatYTick(tick)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#chartGradient)" className="transition-all duration-300" />}
          {linePath && <path d={linePath} fill="none" stroke="#185adb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />}

          {points.map((p, i) => (
            <text key={i} x={p.x} y={paddingTop + chartHeight + 20} textAnchor="middle" className="fill-gray-400 text-[10px] font-semibold font-sans">
              {p.name.split(' ')[0]}
            </text>
          ))}

          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHoveredIndex(i)} onMouseLeave={() => setHoveredIndex(null)}>
              <circle cx={p.x} cy={p.y} r="18" fill="transparent" className="cursor-pointer" />
              <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? '6' : '4'} className={`fill-white stroke-[#185adb] transition-all duration-150 cursor-pointer ${hoveredIndex === i ? 'stroke-[3px]' : 'stroke-2'}`} />
            </g>
          ))}
        </svg>

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
                ? `₹${points[hoveredIndex].revenue.toLocaleString('en-IN')}`
                : `${points[hoveredIndex].bookings} bookings`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Booking Status Pie Chart ─────────────────────────────────────────────────
const BookingStatusPieChart = ({ statusBreakdown }) => {
  const [hovered, setHovered] = useState(null);

  if (!statusBreakdown) return null;

  const sliceConfig = [
    { key: 'confirmed', label: 'Confirmed', color: '#22c55e' },
    { key: 'pending',   label: 'Pending',   color: '#f59e0b' },
    { key: 'completed', label: 'Completed', color: '#3b82f6' },
    { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];

  const slices = sliceConfig.map(s => ({ ...s, value: statusBreakdown[s.key] || 0 }));
  const total = slices.reduce((s, d) => s + d.value, 0);

  const cx = 100, cy = 100, r = 80, innerR = 48;

  const getSlices = () => {
    let cumulativeAngle = -90; // start at top
    return slices.map(slice => {
      const pct = total > 0 ? slice.value / total : 0;
      const angle = pct * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const toRad = deg => (deg * Math.PI) / 180;
      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle));
      const y2 = cy + r * Math.sin(toRad(endAngle));
      const xi1 = cx + innerR * Math.cos(toRad(startAngle));
      const yi1 = cy + innerR * Math.sin(toRad(startAngle));
      const xi2 = cx + innerR * Math.cos(toRad(endAngle));
      const yi2 = cy + innerR * Math.sin(toRad(endAngle));

      const largeArc = angle > 180 ? 1 : 0;

      const d = angle < 0.1 ? '' :
        `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1} Z`;

      return { ...slice, d, pct: (pct * 100).toFixed(1), midAngle: startAngle + angle / 2 };
    });
  };

  const renderedSlices = getSlices();
  const hoveredSlice = hovered !== null ? renderedSlices[hovered] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 text-sm">Booking Status</h3>
        <p className="text-[10px] text-gray-400">Distribution by status</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-44 h-44">
            {total === 0 ? (
              <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
            ) : (
              renderedSlices.map((slice, i) =>
                slice.d ? (
                  <path
                    key={slice.key}
                    d={slice.d}
                    fill={slice.color}
                    opacity={hovered === null || hovered === i ? 1 : 0.45}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ transform: hovered === i ? `scale(1.04)` : 'scale(1)', transformOrigin: `${cx}px ${cy}px` }}
                  />
                ) : null
              )
            )}
            {/* Center label */}
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-800 font-bold" fontSize="22" fontWeight="700">
              {hoveredSlice ? hoveredSlice.value : total}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-400" fontSize="10">
              {hoveredSlice ? hoveredSlice.label : 'Total'}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full">
          {renderedSlices.map((slice, i) => (
            <div
              key={slice.key}
              className="flex items-center gap-2 cursor-pointer group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125" style={{ background: slice.color }} />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-700 leading-tight">{slice.label}</p>
                <p className="text-[10px] text-gray-400">{slice.value} · {slice.pct}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const BOOKINGS_PER_PAGE = 8;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingPage, setBookingPage] = useState(1);

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

  // Derive booking status breakdown from recentBookings + pendingBookings stat
  // We'll compute from the recentBookings but ideally the API returns this.
  // Build a statusBreakdown object from what we have:
  const statusBreakdown = {
    confirmed: stats.confirmedBookings ?? 0,
    pending: stats.pendingBookings ?? 0,
    completed: stats.completedBookings ?? 0,
    cancelled: stats.cancelledBookings ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats.totalBookings.toString()} icon={CalendarCheck} color="blue" />
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} color="green" />
        <StatCard title="Occupied Rooms" value={stats.occupiedRoomsCount.toString()} icon={BedDouble} color="primary" />
        <StatCard title="Total Guests" value={stats.totalGuests.toString()} icon={Users} color="purple" />
      </div>

      {/* Overview Trend & Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line Chart */}
        <div className="lg:col-span-2">
          <OverviewGraph data={stats.monthlyStats} />
        </div>

        {/* Right column: occupancy + check-ins */}
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

      {/* Pie Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BookingStatusPieChart statusBreakdown={statusBreakdown} />

        {/* Monthly Revenue Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Monthly Revenue</h3>
            <p className="text-[10px] text-gray-400">Last 6 months earnings (₹)</p>
          </div>
          <div className="space-y-3">
            {stats.monthlyStats?.map((m, i) => {
              const maxRev = Math.max(...stats.monthlyStats.map(x => x.revenue), 1);
              const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-gray-500 w-16 flex-shrink-0">{m.name.split(' ')[0]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 w-20 text-right flex-shrink-0">
                    ₹{m.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Bookings Table — paginated */}
      {(() => {
        const allBookings = stats.recentBookings;
        const totalPages  = Math.max(1, Math.ceil(allBookings.length / BOOKINGS_PER_PAGE));
        const safePage    = Math.min(bookingPage, totalPages);
        const startIdx    = (safePage - 1) * BOOKINGS_PER_PAGE;
        const pageRows    = allBookings.slice(startIdx, startIdx + BOOKINGS_PER_PAGE);
        const endIdx      = Math.min(startIdx + BOOKINGS_PER_PAGE, allBookings.length);

        const goTo = (p) => setBookingPage(Math.max(1, Math.min(p, totalPages)));

        // Generate visible page numbers (show max 5 around current)
        const pageNums = [];
        const delta = 2;
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
            pageNums.push(i);
          }
        }
        // Insert ellipsis markers
        const pageItems = [];
        pageNums.forEach((num, idx) => {
          if (idx > 0 && num - pageNums[idx - 1] > 1) pageItems.push('...');
          pageItems.push(num);
        });

        return (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
                {allBookings.length > 0 && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Showing {startIdx + 1}–{endIdx} of {allBookings.length} bookings
                  </p>
                )}
              </div>
              <Link to="/admin/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all</Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {allBookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-bold">No recent bookings found.</div>
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
                    {pageRows.map((booking) => {
                      const status = statusConfig[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-700', icon: Clock };
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3.5 text-sm font-mono text-gray-600" title={booking.id}>
                            {booking.id ? `${String(booking.id).slice(-8).toUpperCase()}` : 'N/A'}
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

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100">
                {/* Prev */}
                <button
                  onClick={() => goTo(safePage - 1)}
                  disabled={safePage === 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {pageItems.map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-gray-400">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => goTo(item)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          item === safePage
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  onClick={() => goTo(safePage + 1)}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
