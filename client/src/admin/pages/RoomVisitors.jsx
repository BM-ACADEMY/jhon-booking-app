import { useState, useEffect } from 'react';
import { Search, Eye, Users, Calendar, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

// Shadcn UI imports
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '../../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const RoomVisitors = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Sheet states for detailed visits
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [graphFilter, setGraphFilter] = useState('7days');

  const getTodayData = () => {
    const todayStr = new Date().toDateString();
    const todayVisits = visits.filter(v => new Date(v.visitedAt).toDateString() === todayStr);
    const data = [];
    for (let hour = 0; hour < 24; hour += 2) {
      const dateObj = new Date();
      dateObj.setHours(hour, 0, 0, 0);
      const label = dateObj.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true });
      const count = todayVisits.filter(v => {
        const h = new Date(v.visitedAt).getHours();
        return h >= hour && h < hour + 2;
      }).length;
      data.push({ date: label, count });
    }
    return data;
  };

  const getYesterdayData = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const yesterdayVisits = visits.filter(v => new Date(v.visitedAt).toDateString() === yesterdayStr);
    const data = [];
    for (let hour = 0; hour < 24; hour += 2) {
      const dateObj = new Date();
      dateObj.setHours(hour, 0, 0, 0);
      const label = dateObj.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true });
      const count = yesterdayVisits.filter(v => {
        const h = new Date(v.visitedAt).getHours();
        return h >= hour && h < hour + 2;
      }).length;
      data.push({ date: label, count });
    }
    return data;
  };

  const getLast7DaysData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = visits.filter(v => new Date(v.visitedAt).toDateString() === dayStr).length;
      data.push({ date: label, count });
    }
    return data;
  };

  const getLast35DaysData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = visits.filter(v => new Date(v.visitedAt).toDateString() === dayStr).length;
      data.push({ date: label, count });
    }
    return data;
  };

  const getFilteredGraphData = () => {
    if (!visits || visits.length === 0) return [];
    if (graphFilter === 'today') return getTodayData();
    if (graphFilter === 'yesterday') return getYesterdayData();
    if (graphFilter === '30days') return getLast35DaysData();
    return getLast7DaysData();
  };

  const graphData = getFilteredGraphData();
  const maxCount = graphData.length > 0 ? (Math.max(...graphData.map(d => d.count)) || 1) : 1;

  const svgWidth = 500;
  const svgHeight = 160;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const points = (() => {
    if (graphData.length === 0) return [];
    if (graphData.length === 1) {
      const single = graphData[0];
      const y = paddingTop + chartH - (single.count / maxCount) * chartH;
      return [
        { x: paddingLeft, y, date: '', count: single.count },
        { x: paddingLeft + chartW / 2, y, date: single.date, count: single.count, isReal: true },
        { x: svgWidth - paddingRight, y, date: '', count: single.count }
      ];
    }
    return graphData.map((d, index) => {
      const x = paddingLeft + (index / (graphData.length - 1)) * chartW;
      const y = paddingTop + chartH - (d.count / maxCount) * chartH;
      return { x, y, ...d, isReal: true };
    });
  })();

  const getBezierPath = (pts) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const linePath = getBezierPath(points);
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`
    : '';

  const fetchRoomsStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rooms/admin/visitors-stats');
      setRooms(res.data);
    } catch (err) {
      console.error('Error fetching room visitor stats:', err);
      toast.error('Failed to load room visitor stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsStats();
  }, []);

  const handleOpenDetails = async (room) => {
    setSelectedRoom(room);
    setIsSheetOpen(true);
    setVisitsLoading(true);
    try {
      const res = await api.get(`/rooms/admin/visits/${room._id}`);
      setVisits(res.data);
    } catch (err) {
      console.error('Error fetching room visits logs:', err);
      toast.error('Failed to load detailed visits logs');
    } finally {
      setVisitsLoading(false);
    }
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedRoom(null);
    setVisits([]);
  };

  // Get month-wise visitors aggregated
  const getMonthWiseVisits = () => {
    const monthlyData = {};
    visits.forEach(visit => {
      const date = new Date(visit.visitedAt);
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      monthlyData[monthName] = (monthlyData[monthName] || 0) + 1;
    });
    return Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
  };

  const monthWiseVisits = getMonthWiseVisits();

  const maxMonthCount = monthWiseVisits.length > 0 ? Math.max(...monthWiseVisits.map(m => m.count)) : 1;

  // Filter rooms based on search
  const filteredRooms = rooms.filter(room => 
    room.name?.toLowerCase().includes(search.toLowerCase()) ||
    room.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats Calculations
  const totalRooms = rooms.length;
  const totalUniqueVisitors = rooms.reduce((sum, r) => sum + (r.visitorsCount || 0), 0);
  const mostVisitedRoom = rooms.length > 0 
    ? [...rooms].sort((a, b) => b.visitorsCount - a.visitorsCount)[0]
    : null;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRooms = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6 py-6 text-left">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Room Visitors</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor your property visitors and analyze traffic trends.
        </p>
      </div>

      {/* Premium Statistics Panel using Standard Shadcn Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Properties</CardTitle>
            <Calendar className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalRooms}</div>
            <p className="text-xs text-slate-500 mt-1">All registered rooms & villas</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Unique Visitors</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalUniqueVisitors}</div>
            <p className="text-xs text-slate-500 mt-1">Unique platform views recorded</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Most Visited Property</CardTitle>
            <Eye className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-900 truncate">
              {mostVisitedRoom ? mostVisitedRoom.name : 'N/A'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {mostVisitedRoom ? `${mostVisitedRoom.visitorsCount} Unique Visitors` : 'No views recorded'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar / Search Bar using Shadcn UI Input directly */}
      <div className="flex items-center gap-2 max-w-sm">
        <Input
          type="text"
          placeholder="Search by property or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-slate-700 bg-white border border-slate-100"
        />
      </div>

      {/* Rooms Views Table using Shadcn UI Table */}
      <Card className="border border-slate-100 shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-slate-900" />
            <p className="text-xs font-bold uppercase tracking-wider animate-pulse">Loading stats...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 text-xs px-6 py-4">Property Name</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs px-6 py-4">Category</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs px-6 py-4">Base Price</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs px-6 py-4">Unique Visitors</TableHead>
                <TableHead className="font-semibold text-slate-700 text-xs px-6 py-4 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRooms.map((room) => (
                <TableRow key={room._id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                  <TableCell className="font-medium text-slate-900 px-6 py-4 max-w-[200px] truncate" title={room.name}>
                    {room.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 max-w-[180px]">
                    <Badge variant="secondary" className="truncate max-w-full block text-center" title={room.category}>
                      {room.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-900 font-semibold px-6 py-4">₹{room.price?.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="font-semibold text-slate-900">{room.visitorsCount || 0}</span> total
                      <span className="text-slate-300">|</span>
                      <span className="font-semibold text-slate-900">{room.monthVisitorsCount || 0}</span> this month
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetails(room)}
                      className="border-slate-100 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md"
                    >
                      Detail Logs
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filteredRooms.length === 0 && (
          <div className="text-center py-20 text-slate-400 bg-slate-50/20">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-medium">No properties found</p>
          </div>
        )}
      </Card>

      {/* Pagination Controls using Shadcn UI Buttons */}
      {!loading && filteredRooms.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-6 py-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-slate-800">
              {Math.min(indexOfLastItem, filteredRooms.length)}
            </span>{' '}
            of <span className="font-bold text-slate-800">{filteredRooms.length}</span> properties
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="text-xs font-semibold h-8 disabled:opacity-50"
              >
                Prev
              </Button>
              <span className="flex items-center px-2 text-xs font-bold text-slate-750">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="text-xs font-semibold h-8 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detailed Visits Sheet (Sliding from Right) */}
      <Sheet open={isSheetOpen} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent className="sm:max-w-2xl w-[90vw] overflow-y-auto p-6 flex flex-col gap-6 bg-white text-left border-l border-slate-100 shadow-2xl">
          <SheetHeader className="pb-4 border-b border-slate-100">
            <SheetTitle className="text-xl font-bold text-slate-900">
              Visitor Logs
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Property: <span className="font-semibold text-slate-900">{selectedRoom?.name}</span>
            </SheetDescription>
          </SheetHeader>

          {visitsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 flex-1">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-slate-900" />
              <p className="text-xs font-bold tracking-widest animate-pulse">Loading detailed logs...</p>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 border border-slate-100 rounded-xl flex-1 flex flex-col justify-center">
              <Eye className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <h4 className="font-bold text-gray-800">No visitors logged yet</h4>
              <p className="text-xs text-slate-450 mt-1 px-4">
                Logs will appear here once visitors view this property's details page.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="total" className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="total">Total Visitors Logs</TabsTrigger>
                <TabsTrigger value="month-wise">Month-wise Visitors</TabsTrigger>
              </TabsList>

              {/* Tab 1: Total Visitors Logs & Trend Chart */}
              <TabsContent value="total" className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-1 outline-none">
                {/* Traffic Trend Graph */}
                <Card className="border border-slate-100 p-4 shadow-sm bg-white">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Traffic Trend
                    </h4>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold border border-slate-100">
                      Max Volume: {maxCount} views
                    </span>
                  </div>

                  {/* Time-Based Filter Pills */}
                  <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit border border-slate-100/50">
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'yesterday', label: 'Yesterday' },
                      { id: '7days', label: '7 Days' },
                      { id: '30days', label: '30 Days' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setGraphFilter(tab.id)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${
                          graphFilter === tab.id
                            ? 'bg-white text-slate-900 shadow-sm font-bold'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {graphData.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border border-dashed border-slate-100 rounded-xl bg-slate-50/20 text-xs text-slate-455 font-bold">
                      No views recorded for this selection.
                    </div>
                  ) : (
                    <div className="relative w-full overflow-x-auto">
                      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[450px] h-auto">
                        <defs>
                          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#64748b" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#64748b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Solid Horizontal Grid Lines */}
                        <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="#e2e8f0" strokeWidth="1" />
                        <line x1={paddingLeft} y1={paddingTop + chartH / 2} x2={svgWidth - paddingRight} y2={paddingTop + chartH / 2} stroke="#e2e8f0" strokeWidth="1" />
                        <line x1={paddingLeft} y1={paddingTop + chartH} x2={svgWidth - paddingRight} y2={paddingTop + chartH} stroke="#cbd5e1" strokeWidth="1.5" />

                        {/* Left Y-Axis Vertical Line */}
                        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartH} stroke="#cbd5e1" strokeWidth="1.5" />

                        {/* Left Y-Axis Labels */}
                        <text x={paddingLeft - 8} y={paddingTop + 3} textAnchor="end" className="text-[9px] font-medium fill-slate-400 select-none">
                          {maxCount}
                        </text>
                        <text x={paddingLeft - 8} y={paddingTop + chartH / 2 + 3} textAnchor="end" className="text-[9px] font-medium fill-slate-400 select-none">
                          {Math.round(maxCount / 2)}
                        </text>
                        <text x={paddingLeft - 8} y={paddingTop + chartH + 3} textAnchor="end" className="text-[9px] font-medium fill-slate-400 select-none">
                          0
                        </text>

                        {/* Area Fill */}
                        {areaPath && (
                          <path 
                            d={areaPath} 
                            style={{ fill: 'url(#area-gradient)' }} 
                          />
                        )}

                        {/* Line Stroke */}
                        {linePath && (
                          <path 
                            d={linePath} 
                            style={{
                              fill: 'none',
                              stroke: '#64748b',
                              strokeWidth: '2px'
                            }}
                            strokeLinecap="round"
                            strokeLinejoin="round" 
                          />
                        )}

                        {/* Interactive Dots */}
                        {points.map((p, idx) => {
                          if (!p.isReal) return null;
                          return (
                            <g key={idx} className="group/dot">
                              <title>{`${p.count} Views on ${p.date}`}</title>
                              <circle cx={p.x} cy={p.y} r="6" fill="#64748b" opacity="0.15" className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200" />
                              <circle cx={p.x} cy={p.y} r="3" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" className="cursor-pointer" />
                              <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-medium fill-slate-700 select-none opacity-0 group-hover/dot:opacity-100 transition-opacity duration-205">
                                {p.count}
                              </text>
                              <text x={p.x} y={svgHeight - 6} textAnchor="middle" className="text-[8px] font-medium fill-slate-400 select-none uppercase tracking-wider">
                                {p.date}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}
                </Card>

                {/* Table of detailed visits */}
                <div className="rounded-lg border border-slate-100 overflow-hidden bg-white shadow-sm">
                  <div className="max-h-[250px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 border-b border-slate-100">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-500 text-[10px] w-16 py-2.5 px-4 text-left">S.No</TableHead>
                          <TableHead className="font-semibold text-slate-500 text-[10px] py-2.5 px-4 text-left">Date</TableHead>
                          <TableHead className="font-semibold text-slate-500 text-[10px] py-2.5 px-4 text-left">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visits.map((visit, index) => (
                          <TableRow key={visit._id} className="hover:bg-slate-50/50 text-xs border-b border-slate-100">
                            <TableCell className="font-mono text-slate-400 py-2.5 px-4 text-left">{index + 1}</TableCell>
                            <TableCell className="text-slate-800 font-semibold py-2.5 px-4 whitespace-nowrap text-left">
                              {new Date(visit.visitedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell className="text-slate-650 py-2.5 px-4 whitespace-nowrap text-left">
                              {new Date(visit.visitedAt).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: true
                              })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Month-wise Visitors */}
              <TabsContent value="month-wise" className="space-y-6 flex-1 min-h-0 outline-none overflow-y-auto">
                <Card className="border border-slate-100 p-4 shadow-sm bg-white text-left rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-850">Monthly Traffic Insights</h4>
                  </div>
                  <p className="text-xs text-slate-400">
                    Understand performance and guest engagement month by calendar month.
                  </p>
                </Card>

                {/* Month-wise interactive visual bars list */}
                <div className="space-y-4">
                  {monthWiseVisits.map(({ month, count }) => {
                    const percentage = Math.round((count / maxMonthCount) * 100);
                    return (
                      <div key={month} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-205 transition-all flex flex-col gap-2.5 text-left">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-805">{month}</span>
                          <span className="text-xs font-semibold text-violet-750 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100/50">
                            {count} visits
                          </span>
                        </div>
                        {/* Beautiful gradient progress bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <SheetFooter className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleCloseSheet}
              className="text-xs font-semibold border-slate-100 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer h-9 rounded-md"
            >
              Close details
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default RoomVisitors;
