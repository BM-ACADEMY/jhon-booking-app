import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer
} from 'recharts';
import {
  CalendarCheck, Users, BedDouble, IndianRupee, TrendingUp, Clock, CheckCircle2,
  XCircle, Loader2, ChevronLeft, ChevronRight, Trophy, LogIn, Calendar, Filter,
  Download, Search, Building2, Sparkles, X, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const statusConfig = {
  confirmed: { label: 'Confirmed', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  completed: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatCompactCurrency = (n) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${Math.round(n)}`;
};

const getMonthOptions = () => {
  const options = [];
  const date = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  for (let i = 0; i < 12; i++) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value: val, label });
  }
  return options;
};

// ─── Overview Trend Graph (Performance Optimized & Standard Shadcn Styling) ────
const overviewChartConfig = {
  revenue: { label: 'Revenue (₹)', color: '#2563eb' },
  bookings: { label: 'Bookings', color: '#10b981' },
};

const OverviewGraph = React.memo(({ data, activeRange, onRangeChange }) => {
  const [metric, setMetric] = useState('revenue');

  if (!data || data.length === 0) return null;

  return (
    <Card className="border border-border bg-card shadow-xs h-full flex flex-col justify-between rounded-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-foreground">Overview Performance</CardTitle>
            <Badge variant="secondary" className="text-[10px] font-medium">Analytics</Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Revenue &amp; booking frequency trend over selected timeframe
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Preset Pills */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => onRangeChange('3months')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === '3months' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => onRangeChange('30days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === '30days' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => onRangeChange('7days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === '7days' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metric === 'revenue' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric('bookings')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metric === 'bookings' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setMetric('both')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                metric === 'both' ? 'bg-indigo-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Both
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pl-1 pr-4 pb-2">
        <ChartContainer config={overviewChartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRevenueClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fillBookingsClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} className="text-[11px] font-medium fill-muted-foreground" />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={52}
              className="text-[11px] font-medium fill-muted-foreground"
              tickFormatter={formatCompactCurrency}
            />
            {metric === 'both' && (
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickMargin={8} width={32} className="text-[11px] font-medium fill-muted-foreground" />
            )}
            <ChartTooltip
              cursor={{ stroke: 'var(--color-border)', strokeDasharray: '3 3' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: name === 'revenue' ? '#2563eb' : '#10b981' }} />
                        {name === 'revenue' ? 'Revenue' : 'Bookings'}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {name === 'revenue' ? formatCurrency(value) : `${value} bookings`}
                      </span>
                    </div>
                  )}
                />
              }
            />
            {(metric === 'revenue' || metric === 'both') && (
              <Area
                yAxisId="left"
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenueClean)"
                stroke="#2563eb"
                strokeWidth={2.5}
                isAnimationActive={false}
                dot={false}
              />
            )}
            {(metric === 'bookings' || metric === 'both') && (
              <Area
                yAxisId={metric === 'both' ? 'right' : 'left'}
                dataKey="bookings"
                type="monotone"
                fill="url(#fillBookingsClean)"
                stroke="#10b981"
                strokeWidth={2.5}
                isAnimationActive={false}
                dot={false}
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});

OverviewGraph.displayName = 'OverviewGraph';

// ─── Booking Status Donut Chart (Memoized) ───────────────────────────────────
const statusChartConfig = {
  confirmed: { label: 'Confirmed', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
  completed: { label: 'Completed', color: '#2563eb' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

const BookingStatusDonut = React.memo(({ statusBreakdown }) => {
  const data = useMemo(() => (
    Object.keys(statusChartConfig).map((key) => ({
      status: key,
      value: statusBreakdown[key] || 0,
    }))
  ), [statusBreakdown]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <Card className="border border-border bg-card shadow-xs h-full flex flex-col justify-between rounded-xl">
      <CardHeader className="pb-2 border-b border-border/60">
        <CardTitle className="text-base font-semibold text-foreground">Booking Status Breakdown</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">Distribution of all reservation statuses</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="relative mx-auto aspect-square max-h-48 w-full">
          <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-48">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="status"
                innerRadius={54}
                outerRadius={78}
                strokeWidth={2}
                paddingAngle={total > 0 ? 2 : 0}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={statusChartConfig[entry.status].color} stroke="var(--color-card)" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">{total}</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Bookings</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-border/50">
          {data.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
            return (
              <div key={entry.status} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: statusChartConfig[entry.status].color }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight">{statusChartConfig[entry.status].label}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.value} · {pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

BookingStatusDonut.displayName = 'BookingStatusDonut';

// ─── Monthly Revenue Bar Chart (Memoized) ────────────────────────────────────
const revenueBarConfig = {
  revenue: { label: 'Revenue', color: '#2563eb' },
};

const MonthlyRevenueBar = React.memo(({ data }) => (
  <Card className="border border-border bg-card shadow-xs h-full flex flex-col justify-between rounded-xl">
    <CardHeader className="pb-2 border-b border-border/60">
      <CardTitle className="text-base font-semibold text-foreground">Earnings Breakdown</CardTitle>
      <CardDescription className="text-xs text-muted-foreground mt-0.5">Revenue generated across timeframe (₹)</CardDescription>
    </CardHeader>
    <CardContent className="pl-1 pr-3 pt-3">
      <ChartContainer config={revenueBarConfig} className="aspect-auto h-52 w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} className="text-[11px] font-medium fill-muted-foreground" />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={50} className="text-[11px] font-medium fill-muted-foreground" tickFormatter={formatCompactCurrency} />
          <ChartTooltip
            cursor={{ fill: 'var(--color-muted)' }}
            content={<ChartTooltipContent formatter={(value) => (
              <div className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-xs bg-primary" />
                  Revenue
                </span>
                <span className="font-mono font-semibold text-foreground">{formatCurrency(value)}</span>
              </div>
            )} />}
          />
          <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  </Card>
));

MonthlyRevenueBar.displayName = 'MonthlyRevenueBar';

// ─── Top Performing Rooms Showcase ───────────────────────────────────────────
const TopRoomsShowcase = React.memo(({ rooms }) => {
  const [viewMode, setViewMode] = useState('cards');

  if (!rooms || rooms.length === 0) {
    return (
      <Card className="border border-border bg-card shadow-xs p-6 rounded-xl">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-base font-semibold text-foreground">Top Performing Rooms</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Ranked by revenue generation</p>
        <div className="text-center py-10 text-xs text-muted-foreground">No booking data available for this timeframe.</div>
      </Card>
    );
  }

  const maxRevenue = Math.max(...rooms.map(r => r.revenue), 1);

  const getRankBadge = (index) => {
    if (index === 0) return { icon: '🥇', label: '#1 Top Earner', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    if (index === 1) return { icon: '🥈', label: '#2 High Performer', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20' };
    if (index === 2) return { icon: '🥉', label: '#3 Top 3', bg: 'bg-amber-700/10 text-amber-700 dark:text-amber-500 border-amber-700/20' };
    return { icon: `#${index + 1}`, label: `Rank #${index + 1}`, bg: 'bg-muted text-muted-foreground border-border' };
  };

  return (
    <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base font-semibold text-foreground">Top Performing Rooms</CardTitle>
            <Badge variant="outline" className="text-[10px] font-medium text-amber-600 border-amber-500/30">
              Ranked
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Accommodations ranked by revenue &amp; reservation count
          </CardDescription>
        </div>

        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border/50 text-xs">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'cards' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cards Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'table' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Rank Table
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-4">
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {rooms.map((room, idx) => {
              const rank = getRankBadge(idx);
              const pctOfMax = Math.round((room.revenue / maxRevenue) * 100);

              return (
                <div
                  key={room.id || idx}
                  className="rounded-xl border border-border/70 bg-card p-4 shadow-2xs hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${rank.bg}`}>
                        <span>{rank.icon}</span>
                        <span>{rank.label}</span>
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {room.category || 'Villa'}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-3">
                      {room.imageUrl ? (
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {room.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Base: <span className="font-semibold text-foreground">{formatCurrency(room.price)}</span> / night
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Total Earnings:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(room.revenue)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Reservations:</span>
                      <span className="font-mono font-semibold text-foreground">{room.bookings} bookings</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avg Daily Rate:</span>
                      <span className="font-mono text-muted-foreground">{formatCurrency(room.adr)}</span>
                    </div>

                    <div className="mt-2 space-y-0.5">
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${pctOfMax}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Room Details</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">ADR</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room, idx) => {
                  const rank = getRankBadge(idx);
                  return (
                    <TableRow key={room.id || idx}>
                      <TableCell className="font-bold text-xs">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${rank.bg}`}>
                          {rank.icon}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {room.imageUrl ? (
                            <img src={room.imageUrl} alt={room.name} className="w-8 h-8 rounded-md object-cover border border-border shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-xs text-foreground">{room.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatCurrency(room.price)} / night</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">{room.category || 'Villa'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-xs">{room.bookings}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatCurrency(room.adr)}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">{formatCurrency(room.revenue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

TopRoomsShowcase.displayName = 'TopRoomsShowcase';

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const BOOKINGS_PER_PAGE = 8;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingPage, setBookingPage] = useState(1);

  // Filters state
  const [activeRange, setActiveRange] = useState('6months');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Table filters
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('all');

  const monthOptions = useMemo(() => getMonthOptions(), []);

  // Fetch Dashboard Stats (Optimized)
  const fetchStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const params = {};
      if (selectedMonth) {
        params.month = selectedMonth;
      } else if (customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      } else if (activeRange) {
        params.range = activeRange;
      }

      const res = await api.get('/bookings/stats/dashboard', { params });
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [activeRange, selectedMonth, customStart, customEnd]);

  useEffect(() => {
    fetchStats(true);

    // Light 30s interval for background updates with cleanup
    const interval = setInterval(() => {
      fetchStats(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRangePreset = useCallback((range) => {
    setSelectedMonth('');
    setCustomStart('');
    setCustomEnd('');
    setShowCustomPicker(false);
    setActiveRange(range);
  }, []);

  const handleMonthSelect = useCallback((val) => {
    setSelectedMonth(val);
    setCustomStart('');
    setCustomEnd('');
    setShowCustomPicker(false);
    setActiveRange('month');
  }, []);

  const handleApplyCustomRange = useCallback(() => {
    if (customStart && customEnd) {
      setSelectedMonth('');
      setActiveRange('custom');
    }
  }, [customStart, customEnd]);

  const handleResetFilters = useCallback(() => {
    setSelectedMonth('');
    setCustomStart('');
    setCustomEnd('');
    setShowCustomPicker(false);
    setActiveRange('6months');
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!stats || !stats.recentBookings) return;
    const headers = ['Booking ID', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Amount (INR)', 'Status'];
    const rows = stats.recentBookings.map(b => [
      b.id,
      `"${b.guest}"`,
      `"${b.room}"`,
      b.checkIn,
      b.checkOut,
      b.rawAmount || b.amount,
      b.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dashboard_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [stats]);

  const statusBreakdown = useMemo(() => {
    if (!stats) return { confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
    return {
      confirmed: stats.confirmedBookings ?? 0,
      pending: stats.pendingBookings ?? 0,
      completed: stats.completedBookings ?? 0,
      cancelled: stats.cancelledBookings ?? 0,
    };
  }, [stats]);

  const filteredBookingsList = useMemo(() => {
    if (!stats || !stats.recentBookings) return [];
    return stats.recentBookings.filter(b => {
      const matchesSearch = tableSearch === '' ||
        (b.guest && b.guest.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (b.room && b.room.toLowerCase().includes(tableSearch.toLowerCase())) ||
        (b.id && String(b.id).toLowerCase().includes(tableSearch.toLowerCase()));

      const matchesStatus = tableStatus === 'all' || b.status === tableStatus;
      return matchesSearch && matchesStatus;
    });
  }, [stats, tableSearch, tableStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3 bg-card rounded-xl border border-border shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-semibold tracking-wider">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-border shadow-xs text-muted-foreground font-semibold">
        Failed to load dashboard statistics.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header & Action Filter Bar ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
            <Badge variant="secondary" className="gap-1.5 py-0.5 px-2 text-[10px] font-medium border border-border">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Live Sync
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time property metrics &amp; booking analytics</p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Range Presets */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/50 text-xs">
            <button
              onClick={() => handleRangePreset('7days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === '7days' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => handleRangePreset('30days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === '30days' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => handleRangePreset('this_month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === 'this_month' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleRangePreset('6months')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeRange === '6months' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              6 Months
            </button>
          </div>

          {/* Month Dropdown Selector */}
          <div className="w-44 sm:w-48">
            <Select value={selectedMonth} onValueChange={handleMonthSelect}>
              <SelectTrigger className="h-8 text-xs font-semibold bg-background border border-input hover:bg-accent hover:text-accent-foreground text-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select Month" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range Toggle */}
          <Button
            variant={showCustomPicker || activeRange === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="h-8 text-xs font-medium gap-1"
          >
            <Filter className="w-3.5 h-3.5" />
            Custom Date
          </Button>
        </div>
      </div>

      {/* Custom Date Picker Bar */}
      {showCustomPicker && (
        <div className="bg-card border border-border p-3.5 rounded-xl shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Start Date:</span>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 w-36 text-xs font-semibold bg-background border border-input text-foreground px-2 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">End Date:</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 w-36 text-xs font-semibold bg-background border border-input text-foreground px-2 cursor-pointer"
            />
          </div>
          <Button size="sm" onClick={handleApplyCustomRange} disabled={!customStart || !customEnd} className="h-8 text-xs font-medium">
            Apply Date Range
          </Button>
          {(activeRange !== '6months' || selectedMonth || customStart) && (
            <Button size="sm" variant="ghost" onClick={handleResetFilters} className="h-8 text-xs text-rose-500 hover:text-rose-600 gap-1">
              <X className="w-3.5 h-3.5" /> Reset Filter
            </Button>
          )}
        </div>
      )}

      {/* ── Key Stat Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={IndianRupee}
          change={stats.revenueChange}
          changeType={stats.revenueChange >= 0 ? 'up' : 'down'}
          subtitle={stats.revenueChange >= 0 ? 'Trending up this period' : 'Down this period'}
          description="Total earnings"
          color="green"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toString()}
          icon={CalendarCheck}
          change={stats.bookingsChange}
          changeType={stats.bookingsChange >= 0 ? 'up' : 'down'}
          subtitle={stats.bookingsChange >= 0 ? 'Increased reservation volume' : 'Decreased volume'}
          description="Confirmed & completed"
          color="blue"
        />
        <StatCard
          title="Occupied Rooms"
          value={`${stats.occupiedRoomsCount} / ${stats.totalRooms}`}
          icon={BedDouble}
          subtitle={`Occupancy rate: ${stats.occupancyRate}%`}
          description="Rooms occupied today"
          color="primary"
        />
        <StatCard
          title="Total Guests"
          value={stats.totalGuests.toString()}
          icon={Users}
          subtitle="Strong guest acquisition"
          description="Accommodated visitors count"
          color="purple"
        />
      </div>

      {/* ── Overview Performance & Secondary Stats ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <OverviewGraph data={stats.monthlyStats} activeRange={activeRange} onRangeChange={handleRangePreset} />
        </div>

        <div className="space-y-4 lg:col-span-1 flex flex-col justify-between">
          <Card className="border border-border bg-card p-4 shadow-xs flex-1 flex flex-col justify-between rounded-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Occupancy Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-2xl font-bold text-foreground tabular-nums">{Math.round(stats.occupancyRate)}%</p>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{stats.occupiedRoomsCount} occupied</span>
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${stats.occupancyRate}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2.5 pt-2 border-t border-border/50">
              {stats.totalRooms - stats.occupiedRoomsCount} of {stats.totalRooms} rooms currently available.
            </p>
          </Card>

          <Card className="border border-border bg-card p-4 shadow-xs flex-1 flex flex-col justify-between rounded-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Activity</span>
                <LogIn className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-foreground">{stats.todayCheckIns}</span>
                  <span className="text-xs text-muted-foreground ml-1">Check-ins</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-foreground">{stats.todayCheckOuts}</span>
                  <span className="text-xs text-muted-foreground ml-1">Check-outs</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-primary font-medium mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between">
              <span>Daily turnaround status</span>
              <Sparkles className="w-3.5 h-3.5" />
            </p>
          </Card>
        </div>
      </div>

      {/* ── Status Donut & Revenue Bar ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BookingStatusDonut statusBreakdown={statusBreakdown} />
        <MonthlyRevenueBar data={stats.monthlyStats} />
      </div>

      {/* ── Top Performing Rooms Showcase ─────────────────────────────────── */}
      <TopRoomsShowcase rooms={stats.topRooms} />

      {/* ── Recent Bookings Table ──────────────────────────────────────────── */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(filteredBookingsList.length / BOOKINGS_PER_PAGE));
        const safePage = Math.min(bookingPage, totalPages);
        const startIdx = (safePage - 1) * BOOKINGS_PER_PAGE;
        const pageRows = filteredBookingsList.slice(startIdx, startIdx + BOOKINGS_PER_PAGE);
        const endIdx = Math.min(startIdx + BOOKINGS_PER_PAGE, filteredBookingsList.length);

        const goTo = (p) => setBookingPage(Math.max(1, Math.min(p, totalPages)));

        return (
          <Card className="border border-border bg-card shadow-xs py-0 gap-0 rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent Reservations</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Showing {filteredBookingsList.length > 0 ? startIdx + 1 : 0}–{endIdx} of {filteredBookingsList.length} bookings
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search guest or room..."
                    value={tableSearch}
                    onChange={(e) => { setTableSearch(e.target.value); setBookingPage(1); }}
                    className="h-8 pl-7 text-xs bg-card"
                  />
                </div>

                <Select value={tableStatus} onValueChange={(val) => { setTableStatus(val); setBookingPage(1); }}>
                  <SelectTrigger className="h-8 w-28 text-xs bg-card">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                    <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                    <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Button asChild variant="link" size="sm" className="h-auto p-0 ml-1 text-xs">
                  <Link to="/admin/bookings">View all &rarr;</Link>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {filteredBookingsList.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground font-medium text-xs">
                  No matching bookings found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Guest Name</TableHead>
                      <TableHead className="hidden md:table-cell">Room</TableHead>
                      <TableHead className="hidden lg:table-cell">Check In</TableHead>
                      <TableHead className="hidden lg:table-cell">Check Out</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((booking) => {
                      const status = statusConfig[booking.status] || { label: booking.status, variant: 'outline', icon: Clock };
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={booking.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs text-muted-foreground" title={booking.id}>
                            {booking.id ? `#${String(booking.id).slice(-8).toUpperCase()}` : 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-foreground">{booking.guest}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{booking.room}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{booking.checkIn}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{booking.checkOut}</TableCell>
                          <TableCell className="font-mono font-semibold text-xs text-foreground">{booking.amount}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1 text-[10px] py-0.5 px-2">
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => goTo(safePage - 1)} disabled={safePage === 1} className="gap-1 text-xs h-7">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === safePage ? 'default' : 'ghost'}
                      size="icon"
                      className="h-7 w-7 text-xs"
                      onClick={() => goTo(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button variant="outline" size="sm" onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} className="gap-1 text-xs h-7">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </Card>
        );
      })()}
    </div>
  );
};

export default Dashboard;
