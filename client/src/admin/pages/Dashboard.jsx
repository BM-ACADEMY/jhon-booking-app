import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell,
} from 'recharts';
import {
  CalendarCheck, Users, BedDouble, IndianRupee, TrendingUp, Clock, CheckCircle2,
  XCircle, Loader2, ChevronLeft, ChevronRight, Trophy, LogIn,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import api from '../../api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';

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

// ─── Revenue / Bookings Trend ─────────────────────────────────────────────────
const overviewChartConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
  bookings: { label: 'Bookings', color: 'var(--color-chart-1)' },
};

const OverviewGraph = ({ data }) => {
  const [metric, setMetric] = useState('revenue');
  if (!data || data.length === 0) return null;

  return (
    <Card className="border-border shadow-sm h-full">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Overview Trend</CardTitle>
          <CardDescription className="text-xs mt-0.5">Monthly bookings &amp; revenue performance</CardDescription>
        </div>
        <Tabs value={metric} onValueChange={setMetric}>
          <TabsList className="h-8 bg-muted p-0.5">
            <TabsTrigger value="revenue" className="text-[11px] px-3 h-7 font-semibold">Revenue</TabsTrigger>
            <TabsTrigger value="bookings" className="text-[11px] px-3 h-7 font-semibold">Bookings</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pl-2 pr-4">
        <ChartContainer config={overviewChartConfig} className="aspect-auto h-65 w-full">
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillOverview" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.35} />
                <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/70" />
            <XAxis
              dataKey="name"
              tickFormatter={(v) => v.split(' ')[0]}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              className="text-[11px]"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={54}
              className="text-[11px]"
              tickFormatter={(v) => (metric === 'revenue' ? formatCompactCurrency(v) : v)}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--color-border)', strokeDasharray: '4 4' }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: `var(--color-${name})` }} />
                        {overviewChartConfig[name]?.label}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {name === 'revenue' ? formatCurrency(value) : `${value} bookings`}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey={metric}
              type="monotone"
              fill="url(#fillOverview)"
              stroke={`var(--color-${metric})`}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-card)' }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// ─── Booking Status Donut ─────────────────────────────────────────────────────
const statusChartConfig = {
  confirmed: { label: 'Confirmed', color: 'var(--color-chart-2)' },
  pending: { label: 'Pending', color: 'var(--color-chart-3)' },
  completed: { label: 'Completed', color: 'var(--color-chart-1)' },
  cancelled: { label: 'Cancelled', color: 'var(--color-chart-5)' },
};

const BookingStatusDonut = ({ statusBreakdown }) => {
  const data = useMemo(() => (
    Object.keys(statusChartConfig).map((key) => ({
      status: key,
      value: statusBreakdown[key] || 0,
    }))
  ), [statusBreakdown]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="border-border shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Booking Status</CardTitle>
        <CardDescription className="text-xs mt-0.5">Distribution across all bookings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto aspect-square max-h-55 w-full">
          <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-55">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie data={data} dataKey="value" nameKey="status" innerRadius={58} outerRadius={85} strokeWidth={3} paddingAngle={total > 0 ? 2 : 0}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={`var(--color-${entry.status})`} stroke="var(--color-card)" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">{total}</span>
            <span className="text-[11px] text-muted-foreground">Total bookings</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4">
          {data.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
            return (
              <div key={entry.status} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: `var(--color-${entry.status})` }} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-foreground leading-tight">{statusChartConfig[entry.status].label}</p>
                  <p className="text-[10px] text-muted-foreground">{entry.value} · {pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Monthly Revenue Bar ──────────────────────────────────────────────────────
const revenueBarConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
};

const MonthlyRevenueBar = ({ data }) => (
  <Card className="border-border shadow-sm h-full">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
      <CardDescription className="text-xs mt-0.5">Last 6 months earnings (₹)</CardDescription>
    </CardHeader>
    <CardContent className="pl-2 pr-4">
      <ChartContainer config={revenueBarConfig} className="aspect-auto h-55 w-full">
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/70" />
          <XAxis dataKey="name" tickFormatter={(v) => v.split(' ')[0]} tickLine={false} axisLine={false} tickMargin={10} className="text-[11px]" />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={54} className="text-[11px]" tickFormatter={formatCompactCurrency} />
          <ChartTooltip
            cursor={{ fill: 'var(--color-muted)' }}
            content={<ChartTooltipContent formatter={(value) => (
              <div className="flex w-full items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-xs" style={{ backgroundColor: 'var(--color-revenue)' }} />
                  Revenue
                </span>
                <span className="font-mono font-semibold text-foreground">{formatCurrency(value)}</span>
              </div>
            )} />}
          />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  </Card>
);

// ─── Top Performing Rooms ─────────────────────────────────────────────────────
const topRoomsConfig = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
};

const TopRooms = ({ rooms }) => {
  if (!rooms || rooms.length === 0) {
    return (
      <Card className="border-border shadow-sm h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-chart-3" /> Top Performing Rooms
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">Ranked by total revenue generated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">No booking data yet.</div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [...rooms].sort((a, b) => a.revenue - b.revenue);

  return (
    <Card className="border-border shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-chart-3" /> Top Performing Rooms
        </CardTitle>
        <CardDescription className="text-xs mt-0.5">Ranked by total revenue generated</CardDescription>
      </CardHeader>
      <CardContent className="pl-2 pr-4">
        <ChartContainer config={topRoomsConfig} className="aspect-auto w-full" style={{ height: Math.max(160, chartData.length * 44) }}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/70" />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} className="text-[11px]" />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              width={118}
              className="text-[11px]"
              tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--color-muted)' }}
              content={<ChartTooltipContent formatter={(value, _name, item) => (
                <div className="flex w-full flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-mono font-semibold text-foreground">{formatCurrency(value)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Bookings</span>
                    <span className="font-mono font-semibold text-foreground">{item.payload.bookings}</span>
                  </div>
                </div>
              )} />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 6, 6, 0]} maxBarSize={22} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const BOOKINGS_PER_PAGE = 8;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingPage, setBookingPage] = useState(1);

  useEffect(() => {
    const fetchStats = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const res = await api.get('/bookings/stats/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchStats(true);

    const interval = setInterval(() => {
      fetchStats(false);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 bg-card rounded-xl border border-border shadow-sm">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Loading dashboard metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-border shadow-sm text-muted-foreground font-bold">
        Failed to load dashboard statistics.
      </div>
    );
  }

  const statusBreakdown = {
    confirmed: stats.confirmedBookings ?? 0,
    pending: stats.pendingBookings ?? 0,
    completed: stats.completedBookings ?? 0,
    cancelled: stats.cancelledBookings ?? 0,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back — here's what's happening with your property today.</p>
        </div>
        <Badge variant="secondary" className="gap-2 py-1.5 px-3 w-fit border border-border/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-2 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-2" />
          </span>
          Live · refreshes every 8s
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={stats.totalBookings.toString()} icon={CalendarCheck} color="blue" />
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={IndianRupee} color="green" />
        <StatCard title="Occupied Rooms" value={stats.occupiedRoomsCount.toString()} icon={BedDouble} color="primary" />
        <StatCard title="Total Guests" value={stats.totalGuests.toString()} icon={Users} color="purple" />
      </div>

      {/* Overview Trend & Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <OverviewGraph data={stats.monthlyStats} />
        </div>

        <div className="space-y-4 lg:col-span-1 flex flex-col">
          <Card className="border-border shadow-sm flex-1 flex flex-col justify-center p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
              <TrendingUp className="w-4 h-4 text-chart-2" />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{Math.round(stats.occupancyRate)}%</p>
            <div className="mt-3 w-full bg-muted rounded-full h-2">
              <div className="bg-chart-2 h-2 rounded-full transition-all duration-500" style={{ width: `${stats.occupancyRate}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.occupiedRoomsCount} of {stats.totalRooms} rooms occupied</p>
          </Card>

          <Card className="border-border shadow-sm flex-1 flex flex-col justify-center p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-muted-foreground">Today's Check-ins</p>
              <LogIn className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{stats.todayCheckIns}</p>
            <p className="text-xs text-primary mt-2 font-medium">{stats.todayCheckOuts} check-out(s) today</p>
          </Card>
        </div>
      </div>

      {/* Pie Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BookingStatusDonut statusBreakdown={statusBreakdown} />
        <MonthlyRevenueBar data={stats.monthlyStats} />
      </div>

      {/* Top Performing Rooms */}
      <TopRooms rooms={stats.topRooms} />

      {/* Recent Bookings Table — paginated */}
      {(() => {
        const allBookings = stats.recentBookings;
        const totalPages = Math.max(1, Math.ceil(allBookings.length / BOOKINGS_PER_PAGE));
        const safePage = Math.min(bookingPage, totalPages);
        const startIdx = (safePage - 1) * BOOKINGS_PER_PAGE;
        const pageRows = allBookings.slice(startIdx, startIdx + BOOKINGS_PER_PAGE);
        const endIdx = Math.min(startIdx + BOOKINGS_PER_PAGE, allBookings.length);

        const goTo = (p) => setBookingPage(Math.max(1, Math.min(p, totalPages)));

        const pageNums = [];
        const delta = 2;
        for (let i = 1; i <= totalPages; i++) {
          if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
            pageNums.push(i);
          }
        }
        const pageItems = [];
        pageNums.forEach((num, idx) => {
          if (idx > 0 && num - pageNums[idx - 1] > 1) pageItems.push('...');
          pageItems.push(num);
        });

        return (
          <Card className="border-border shadow-sm py-0 gap-0">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent Bookings</h2>
                {allBookings.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Showing {startIdx + 1}–{endIdx} of {allBookings.length} bookings
                  </p>
                )}
              </div>
              <Button asChild variant="link" size="sm" className="h-auto p-0">
                <Link to="/admin/bookings">View all</Link>
              </Button>
            </div>

            <div className="overflow-x-auto">
              {allBookings.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground font-medium">No recent bookings found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead className="hidden md:table-cell">Room</TableHead>
                      <TableHead className="hidden lg:table-cell">Check In</TableHead>
                      <TableHead className="hidden lg:table-cell">Check Out</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((booking) => {
                      const status = statusConfig[booking.status] || { label: booking.status, variant: 'outline', icon: Clock };
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-muted-foreground" title={booking.id}>
                            {booking.id ? `${String(booking.id).slice(-8).toUpperCase()}` : 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{booking.guest}</TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">{booking.room}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">{booking.checkIn}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">{booking.checkOut}</TableCell>
                          <TableCell className="font-semibold text-foreground">{booking.amount}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant} className="gap-1">
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
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => goTo(safePage - 1)} disabled={safePage === 1} className="gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>

                <div className="flex items-center gap-1">
                  {pageItems.map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === safePage ? 'default' : 'ghost'}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => goTo(item)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                </div>

                <Button variant="outline" size="sm" onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} className="gap-1">
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
