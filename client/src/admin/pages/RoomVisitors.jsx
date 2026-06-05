import { useState, useEffect } from 'react';
import { Search, Eye, Users, Calendar, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const RoomVisitors = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states for detailed visits
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const getLast30DaysData = () => {
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
    if (graphFilter === '30days') return getLast30DaysData();
    return getLast7DaysData();
  };

  const graphData = getFilteredGraphData();
  const maxCount = graphData.length > 0 ? (Math.max(...graphData.map(d => d.count)) || 1) : 1;

  const svgWidth = 760;
  const svgHeight = 160;
  const paddingLeft = 50;
  const paddingRight = 25;
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
    setIsModalOpen(true);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setVisits([]);
  };

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
    <div className="space-y-6">
      
      {/* Premium Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Rooms Card */}
        <div className="text-left bg-gradient-to-br from-violet-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-violet-600 tracking-widest">Total Properties</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalRooms}</h3>
            </div>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">All registered rooms & villas</p>
        </div>

        {/* Total Unique Visitors Card */}
        <div className="text-left bg-gradient-to-br from-emerald-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Unique Visitors</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{totalUniqueVisitors}</h3>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">Aggregated per person unique visits</p>
        </div>

        {/* Most Popular Property Card */}
        <div className="text-left bg-gradient-to-br from-amber-50 to-white border border-gray-200 rounded-2xl p-5 shadow-sm transition-all duration-300 group relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-125 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Most Visited Property</p>
              <h3 className="text-lg font-black text-gray-900 mt-1 truncate max-w-[200px]">
                {mostVisitedRoom ? mostVisitedRoom.name : 'N/A'}
              </h3>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform flex-shrink-0">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-medium">
            {mostVisitedRoom ? `${mostVisitedRoom.visitorsCount} Unique Visitors` : 'No views recorded yet'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-72 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full bg-transparent"
          />
        </div>
      </div>

      {/* Rooms Views Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-450">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
            <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Fetching property visitor stats...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Property Name', 'Category', 'Base Price', 'Max Capacity', 'Unique Visitors', 'Action'].map((h) => (
                    <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wider px-5 py-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentRooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-gray-800">{room.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{room.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 font-semibold">₹{room.price?.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-550 font-medium">{room.guests} Guests</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full text-xs font-bold border border-violet-100">
                        <Eye className="w-3.5 h-3.5" />
                        {room.visitorsCount || 0} Visitors
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleOpenDetails(room)}
                        className="flex items-center gap-1.5 bg-gray-950 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none outline-none transition-all"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredRooms.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-gray-50/30">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium">No properties found matching your search</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredRooms.length > 0 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-800">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-bold text-gray-800">
              {Math.min(indexOfLastItem, filteredRooms.length)}
            </span>{' '}
            of <span className="font-bold text-gray-800">{filteredRooms.length}</span> properties
          </div>

          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detailed Visits Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Visitor Logs: {selectedRoom?.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-semibold">
                  Date-wise analysis of unique visits log
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all cursor-pointer border-none outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {visitsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
                  <p className="text-xs font-bold tracking-widest animate-pulse">Loading detailed logs...</p>
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <h4 className="font-bold text-gray-800">No visitors logged yet</h4>
                  <p className="text-xs text-gray-400 mt-1">Logs will appear here once visitors view this property's details page.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Traffic Trend Graph */}
                  {visits.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-pulse"></span>
                          Traffic Trend Analyzer
                        </h4>
                        <span className="text-[10px] bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider self-start sm:self-auto">
                          Max Volume: {maxCount} views
                        </span>
                      </div>

                      {/* Time-Based Filter Pills */}
                      <div className="flex gap-1.5 mb-6 bg-gray-50 p-1 rounded-xl w-fit border border-gray-100">
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
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${
                              graphFilter === tab.id
                                ? 'bg-white text-violet-600 shadow-sm'
                                : 'text-gray-400 hover:text-gray-650'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {graphData.length === 0 ? (
                        <div className="h-32 flex items-center justify-center border border-dashed border-gray-150 rounded-xl bg-gray-50/20 text-xs text-gray-400 font-bold">
                          No views recorded for this selection.
                        </div>
                      ) : (
                        <div className="relative w-full overflow-x-auto pb-4">
                          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[700px] h-auto">
                            <defs>
                              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.45" />
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Solid Horizontal Grid Lines */}
                            <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="#e2e8f0" strokeWidth="1" />
                            <line x1={paddingLeft} y1={paddingTop + chartH / 2} x2={svgWidth - paddingRight} y2={paddingTop + chartH / 2} stroke="#e2e8f0" strokeWidth="1" />
                            <line x1={paddingLeft} y1={paddingTop + chartH} x2={svgWidth - paddingRight} y2={paddingTop + chartH} stroke="#94a3b8" strokeWidth="1.5" />

                            {/* Left Y-Axis Vertical Line */}
                            <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + chartH} stroke="#94a3b8" strokeWidth="1.5" />

                            {/* Left Y-Axis Labels */}
                            <text x={paddingLeft - 10} y={paddingTop + 4} textAnchor="end" className="text-[10px] font-bold fill-gray-400 select-none">
                              {maxCount}
                            </text>
                            <text x={paddingLeft - 10} y={paddingTop + chartH / 2 + 4} textAnchor="end" className="text-[10px] font-bold fill-gray-400 select-none">
                              {Math.round(maxCount / 2)}
                            </text>
                            <text x={paddingLeft - 10} y={paddingTop + chartH + 4} textAnchor="end" className="text-[10px] font-bold fill-gray-400 select-none">
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
                                  stroke: '#7c3aed',
                                  strokeWidth: '3.5px'
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
                                  <circle cx={p.x} cy={p.y} r="10" fill="#7c3aed" opacity="0.15" className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200" />
                                  <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" stroke="#7c3aed" strokeWidth="2.5" className="cursor-pointer" />
                                  <text x={p.x} y={p.y - 10} textAnchor="middle" className="text-[10px] font-black fill-violet-750 select-none opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200">
                                    {p.count}
                                  </text>
                                  <text x={p.x} y={svgHeight - 8} textAnchor="middle" className="text-[9px] font-black fill-gray-400 select-none uppercase tracking-wider">
                                    {p.date}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="text-left px-5 py-3.5 w-24">S.No</th>
                            <th className="text-left px-5 py-3.5">Date</th>
                            <th className="text-left px-5 py-3.5">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visits.map((visit, index) => (
                            <tr key={visit._id} className="hover:bg-gray-50/30 text-xs">
                              <td className="px-5 py-3.5 text-gray-500 font-mono font-bold">{index + 1}</td>
                              <td className="px-5 py-3.5 text-gray-800 font-semibold whitespace-nowrap">
                                {new Date(visit.visitedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-5 py-3.5 text-gray-700 font-medium whitespace-nowrap">
                                {new Date(visit.visitedAt).toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={handleCloseModal}
                className="bg-white hover:bg-gray-150 border border-gray-200 text-gray-700 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RoomVisitors;
