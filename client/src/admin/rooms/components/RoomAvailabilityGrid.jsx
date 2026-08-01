import { useEffect, useMemo, useRef, useState } from 'react';
import { BedDouble, ChevronLeft, ChevronRight, LayoutGrid, ShieldOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  formatCompactPrice, getBlockedReason, getDatePrice, hasCustomPrice, imageSrc, toDateStr,
} from '../utils';

const DAY_W = 44; // px per day column
const ROOM_COL_W = 208; // px for the frozen room column
const ROW_H = 64; // px per room row
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const buildMonthDays = (year, month) => {
  const total = daysInMonth(year, month);
  const days = [];
  for (let d = 1; d <= total; d += 1) days.push(new Date(year, month, d));
  return days;
};

const monthOptions = (center) => {
  const opts = [];
  for (let i = -12; i <= 12; i += 1) {
    const d = new Date(center.getFullYear(), center.getMonth() + i, 1);
    opts.push(d);
  }
  return opts;
};

const STATUS_BAR = {
  pending: 'bg-amber-600 text-white',
  confirmed: 'bg-[#008080] text-white',
  completed: 'bg-slate-600 text-white',
};

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

/**
 * Center panel: a multi-room availability grid (rooms as rows, dates as columns)
 * showing per-day price, blocked-date hatching, and guest booking bars. Dragging
 * across empty day cells in a room's row selects a range for pricing/blocking;
 * clicking a booking bar opens the reservation summary.
 */
const RoomAvailabilityGrid = ({
  rooms, bookings, loading, getCatColor, focusedRoom, onClearFocus, onRangeSelect, onOpenSection, onOpenReservation,
}) => {
  const showRoomColumn = rooms && rooms.length > 1;
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [windowStart, setWindowStart] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [activeDate, setActiveDate] = useState(() => toDateStr(today));
  const [drag, setDrag] = useState(null); // { roomId, fromStr, toStr }
  const scrollerRef = useRef(null);
  const rowRefs = useRef({});

  const months = useMemo(() => ([
    { year: windowStart.getFullYear(), month: windowStart.getMonth() },
    { year: windowStart.getFullYear(), month: windowStart.getMonth() + 1 },
  ].map(({ year, month }) => {
    const norm = new Date(year, month, 1);
    return { year: norm.getFullYear(), month: norm.getMonth() };
  })), [windowStart]);

  const allDays = useMemo(
    () => months.flatMap((m) => buildMonthDays(m.year, m.month)),
    [months]
  );
  const dayIndex = useMemo(() => {
    const map = new Map();
    allDays.forEach((d, i) => map.set(toDateStr(d), i));
    return map;
  }, [allDays]);
  const totalWidth = allDays.length * DAY_W;

  useEffect(() => {
    if (!focusedRoom) return;
    rowRefs.current[focusedRoom._id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusedRoom]);

  useEffect(() => {
    const onUp = () => setDrag(null);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, []);

  const shiftMonths = (delta) => setWindowStart((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  const goToday = () => {
    setWindowStart(new Date(today.getFullYear(), today.getMonth(), 1));
    setActiveDate(toDateStr(today));
  };
  const frozenW = showRoomColumn ? ROOM_COL_W : 0;
  const rowH = showRoomColumn ? ROW_H : 240;

  const bookingsByRoom = useMemo(() => {
    const map = new Map();
    (bookings || []).forEach((b) => {
      if (b.status === 'cancelled') return;
      const roomRefs = [
        b.room, ...(Array.isArray(b.rooms) ? b.rooms : []),
      ].filter(Boolean);
      const roomIds = new Set(roomRefs.map((r) => (typeof r === 'string' ? r : r._id)));
      roomIds.forEach((rid) => {
        if (!map.has(rid)) map.set(rid, []);
        map.get(rid).push(b);
      });
    });
    return map;
  }, [bookings]);

  const singleMonthDays = useMemo(() => {
    if (!focusedRoom) return null;
    return buildMonthDays(windowStart.getFullYear(), windowStart.getMonth());
  }, [focusedRoom, windowStart]);
  const singleMonthLeadPad = focusedRoom
    ? new Date(windowStart.getFullYear(), windowStart.getMonth(), 1).getDay()
    : 0;
  const focusedRoomBookings = focusedRoom ? (bookingsByRoom.get(focusedRoom._id) || []) : [];
  const bookingForDate = (dateStr) => focusedRoomBookings.find((b) => {
    const s = toDateStr(b.checkIn);
    const e = toDateStr(b.checkOut);
    return dateStr >= s && dateStr <= e;
  });

  const finishDrag = (roomId, fromStr, toStr) => {
    const room = rooms.find((r) => r._id === roomId);
    if (!room) return;
    const [from, to] = fromStr <= toStr ? [fromStr, toStr] : [toStr, fromStr];
    onRangeSelect?.(room, { from, to });
  };

  const handleCellMouseDown = (room, dateStr) => (e) => {
    e.preventDefault();
    setActiveDate(dateStr);
    setDrag({ roomId: room._id, fromStr: dateStr, toStr: dateStr });
  };
  const handleCellMouseEnter = (room, dateStr) => () => {
    setDrag((prev) => (prev && prev.roomId === room._id ? { ...prev, toStr: dateStr } : prev));
  };
  const handleCellMouseUp = (room, dateStr) => () => {
    setDrag((prev) => {
      if (prev && prev.roomId === room._id) finishDrag(room._id, prev.fromStr, dateStr);
      return null;
    });
  };

  if (loading) {
    return (
      <Card className="flex h-full min-h-[420px] items-center justify-center rounded-2xl shadow-sm border-slate-200">
        <p className="text-sm font-bold text-slate-400">Loading availability…</p>
      </Card>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <Card className="flex h-full min-h-[420px] items-center justify-center rounded-2xl shadow-sm border-slate-200">
        <div className="text-center">
          <BedDouble className="mx-auto mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm font-black text-slate-600">No properties found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search or add a new room.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0 rounded-2xl shadow-sm border-slate-200 bg-white">
      {/* Toolbar - Clean Shadcn style Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 bg-slate-50/40">
        <div className="flex items-center gap-2">
          <Select
            value={toDateStr(windowStart).slice(0, 7)}
            onValueChange={(val) => {
              const [y, m] = val.split('-').map(Number);
              setWindowStart(new Date(y, m - 1, 1));
            }}
          >
            <SelectTrigger className="w-[170px] bg-white border-slate-200 font-semibold shadow-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions(today).map((d) => {
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                return (
                  <SelectItem key={key} value={key} className="font-medium">
                    {d.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={goToday} className="bg-white border-slate-200 font-bold shadow-xs hover:bg-slate-50">
            Today
          </Button>
          {focusedRoom && (
            <Button variant="outline" size="sm" onClick={onClearFocus} className="bg-white border-slate-200 font-semibold shadow-xs hover:bg-slate-50">
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> All rooms
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {focusedRoom && (
            <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {focusedRoom.name}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-slate-200 hover:bg-slate-50 shadow-xs" onClick={() => shiftMonths(-1)}>
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-white border-slate-200 hover:bg-slate-50 shadow-xs" onClick={() => shiftMonths(1)}>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {focusedRoom ? (
        // Single room: Month Calendar styled like Shadcn UI Calendar
        <div className="flex-1 overflow-y-auto select-none p-5 bg-white">
          <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
              <div key={label} className="py-1">{label}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: singleMonthLeadPad }).map((_, i) => {
              const prevMonthEnd = new Date(windowStart.getFullYear(), windowStart.getMonth(), 0).getDate();
              const num = prevMonthEnd - singleMonthLeadPad + 1 + i;
              return (
                <div
                  key={`pad-${i}`}
                  className="flex h-20 items-center justify-center rounded-xl border border-transparent text-sm font-normal text-slate-300 opacity-40 select-none"
                >
                  {num}
                </div>
              );
            })}
            {singleMonthDays.map((d) => {
              const dateStr = toDateStr(d);
              const isToday = dateStr === toDateStr(today);
              const isActive = activeDate === dateStr;
              const blockedReason = getBlockedReason(focusedRoom.blockedDates, dateStr);
              const price = getDatePrice(focusedRoom, dateStr);
              const custom = hasCustomPrice(focusedRoom, dateStr);
              const booking = bookingForDate(dateStr);
              const status = booking ? getEffectiveStatus(booking) : null;
              const inDrag = drag && drag.roomId === focusedRoom._id
                && dateStr >= (drag.fromStr <= drag.toStr ? drag.fromStr : drag.toStr)
                && dateStr <= (drag.fromStr <= drag.toStr ? drag.toStr : drag.fromStr);

              // Multi-day booking positioning logic
              const checkInStr = booking ? toDateStr(booking.checkIn) : null;
              const checkOutStr = booking ? toDateStr(booking.checkOut) : null;
              const isStart = booking && dateStr === checkInStr;
              const isEnd = booking && dateStr === checkOutStr;
              const isSingleDay = isStart && isEnd;
              const isEndOfWeek = d.getDay() === 6;
              const isStartOfWeek = d.getDay() === 0;

              return (
                <div
                  key={dateStr}
                  onMouseDown={!booking ? handleCellMouseDown(focusedRoom, dateStr) : () => setActiveDate(dateStr)}
                  onMouseEnter={!booking ? handleCellMouseEnter(focusedRoom, dateStr) : undefined}
                  onMouseUp={!booking ? handleCellMouseUp(focusedRoom, dateStr) : undefined}
                  onClick={() => {
                    setActiveDate(dateStr);
                    if (booking) onOpenReservation?.(booking);
                  }}
                  title={
                    booking
                      ? `${booking.user?.name || 'Guest'} · ${status} · ₹${booking.totalAmount || price}`
                      : blockedReason ? `Blocked: ${blockedReason}` : `₹${price}`
                  }
                  className={cn(
                    'relative flex h-22 cursor-pointer flex-col justify-between rounded-xl border p-2.5 transition-all duration-150 select-none',
                    // Dragging state
                    inDrag && 'border-primary-400 bg-primary-50 text-primary-900 shadow-xs',
                    // Active Focus state
                    isActive && !inDrag && 'ring-2 ring-teal-500 border-teal-500 bg-teal-50/20 shadow-md z-30 scale-[1.01]',
                    // Clean cell states when not active
                    !isActive && !inDrag && custom && !blockedReason && 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:bg-emerald-50/80 hover:border-emerald-300',
                    !isActive && !inDrag && !custom && !blockedReason && 'border-slate-200/80 bg-slate-50/50 text-slate-800 hover:bg-slate-100/70 hover:border-slate-300',
                    !isActive && !inDrag && blockedReason && 'border-slate-200 bg-slate-100/70 text-slate-400',
                    isToday && !isActive && !inDrag && 'ring-1 ring-primary-500 border-primary-300'
                  )}
                >
                  {/* Blocked Room Design (Single diagonal line across the cell) */}
                  {blockedReason && !booking && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                      <svg
                        className="h-full w-full"
                        preserveAspectRatio="none"
                        viewBox="0 0 100 100"
                      >
                        <line x1="0" y1="100" x2="100" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}

                  {/* Cell Header: Date Number + Price subtext */}
                  <div className="flex items-center justify-between w-full relative z-10">
                    <span className={cn(
                      'text-xs font-black tracking-tight',
                      isActive ? 'text-teal-700' : isToday ? 'text-primary-600' : 'text-slate-800'
                    )}>
                      {d.getDate()}
                    </span>
                    {!booking && !blockedReason && (
                      <span className="text-[11px] font-black text-slate-700 bg-slate-100/90 px-1.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                        ₹{formatCompactPrice(price)}
                      </span>
                    )}
                  </div>

                  {/* Booking Pill Capsule Banner (Connected seamlessly for multi-day bookings) */}
                  {booking ? (
                    <div
                      className={cn(
                        'h-6 py-0.5 text-[10px] font-bold text-white shadow-xs flex items-center justify-between gap-1 transition-all hover:brightness-105 hover:scale-[1.01] relative cursor-pointer',
                        status === 'confirmed' ? 'bg-[#008080]' : status === 'pending' ? 'bg-amber-600' : 'bg-slate-600',
                        // Single-day vs Multi-day start, middle, end shapes & negative margins for bridging gap
                        isSingleDay && 'rounded-full px-2.5 w-full z-20',
                        !isSingleDay && isStart && cn(
                          'rounded-l-full pl-2.5 pr-1 z-20',
                          isEndOfWeek ? 'rounded-r-md w-full' : 'rounded-r-none -mr-4 w-[calc(100%+16px)]'
                        ),
                        !isSingleDay && isEnd && cn(
                          'rounded-r-full pr-2.5 pl-1 z-20',
                          isStartOfWeek ? 'rounded-l-md w-full' : 'rounded-l-none -ml-4 w-[calc(100%+16px)]'
                        ),
                        !isSingleDay && !isStart && !isEnd && cn(
                          'z-20 px-1',
                          isStartOfWeek ? 'rounded-l-md' : 'rounded-l-none -ml-4',
                          isEndOfWeek ? 'rounded-r-md' : 'rounded-r-none -mr-4',
                          !isStartOfWeek && !isEndOfWeek ? 'w-[calc(100%+32px)]' : 'w-[calc(100%+16px)]'
                        )
                      )}
                    >
                      {(isStart || isSingleDay) && (
                        <span className="truncate font-extrabold text-[10.5px]">
                          {booking.user?.name || 'Guest'}
                        </span>
                      )}

                      {(isEnd || isSingleDay) && (
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          <span className="font-semibold opacity-95 text-[10px] truncate">
                            ₹{Number(booking.totalAmount || price).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 shrink-0">
                            {status === 'confirmed' ? 'Confirmed' : status}
                          </span>
                        </div>
                      )}

                      {!isStart && !isEnd && !isSingleDay && (
                        <span className="mx-auto text-[9px] font-bold opacity-60 tracking-widest select-none">
                          ···
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-3" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <div ref={scrollerRef} className="flex-1 overflow-auto select-none bg-white">
        <div style={{ width: frozenW + totalWidth, minWidth: '100%' }}>
          {/* Month band */}
          <div className="sticky top-0 z-30 flex bg-white">
            {showRoomColumn && (
              <div className="sticky left-0 z-40 shrink-0 border-b border-r border-slate-100 bg-white" style={{ width: frozenW }} />
            )}
            {months.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                className="shrink-0 border-b border-slate-100 bg-slate-50/80 py-1.5 text-center text-xs font-black text-slate-700"
                style={{ width: daysInMonth(m.year, m.month) * DAY_W }}
              >
                {new Date(m.year, m.month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            ))}
          </div>

          {/* Day header band */}
          <div className="sticky top-[29px] z-30 flex bg-white">
            {showRoomColumn && (
              <div className="sticky left-0 z-40 shrink-0 border-b border-r border-slate-100 bg-white" style={{ width: frozenW }} />
            )}
            {allDays.map((d) => {
              const dateStr = toDateStr(d);
              const isToday = dateStr === toDateStr(today);
              const isActive = dateStr === activeDate;
              return (
                <div
                  key={dateStr}
                  onClick={() => setActiveDate(dateStr)}
                  className={cn(
                    'shrink-0 border-b border-l border-slate-100 py-1 text-center cursor-pointer transition-colors',
                    isActive ? 'bg-teal-600 text-white font-black shadow-xs' : isToday ? 'bg-primary-50' : 'hover:bg-slate-50'
                  )}
                  style={{ width: DAY_W }}
                >
                  <div className={cn('text-[9px] font-bold uppercase', isActive ? 'text-teal-100' : 'text-slate-400')}>{WEEKDAYS[d.getDay()]}</div>
                  <div className={cn('text-[11px] font-black', isActive ? 'text-white' : isToday ? 'text-primary-600' : 'text-slate-700')}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Room rows */}
          {rooms.map((room) => {
            const isFocused = focusedRoom?._id === room._id;
            const roomBookings = bookingsByRoom.get(room._id) || [];
            return (
              <div
                key={room._id}
                ref={(el) => { rowRefs.current[room._id] = el; }}
                className={cn('flex border-b border-slate-100 hover:bg-slate-50/40 transition-colors', isFocused && 'bg-primary-50/30')}
                style={{ height: rowH }}
              >
                {/* Frozen room cell */}
                {showRoomColumn && (
                  <div
                    className={cn(
                      'sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-slate-100 bg-white p-2',
                      isFocused && 'bg-primary-50/60'
                    )}
                    style={{ width: frozenW }}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {room.images?.[0] ? (
                        <img src={imageSrc(room.images[0])} alt={room.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BedDouble className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900">{room.name}</p>
                      <span className={cn('inline-block rounded-full px-1.5 py-0.5 text-[8px] font-black', getCatColor(room.category))}>
                        {room.category}
                      </span>
                    </div>
                  </div>
                )}

                {/* Day cells + booking bars */}
                <div className="relative flex" style={{ width: totalWidth }}>
                  {allDays.map((d) => {
                    const dateStr = toDateStr(d);
                    const blockedReason = getBlockedReason(room.blockedDates, dateStr);
                    const price = getDatePrice(room, dateStr);
                    const custom = hasCustomPrice(room, dateStr);
                    const isActive = dateStr === activeDate;
                    const inDrag = drag && drag.roomId === room._id
                      && dateStr >= (drag.fromStr <= drag.toStr ? drag.fromStr : drag.toStr)
                      && dateStr <= (drag.fromStr <= drag.toStr ? drag.toStr : drag.fromStr);
                    return (
                      <div
                        key={dateStr}
                        onMouseDown={handleCellMouseDown(room, dateStr)}
                        onMouseEnter={handleCellMouseEnter(room, dateStr)}
                        onMouseUp={handleCellMouseUp(room, dateStr)}
                        title={blockedReason ? `Blocked: ${blockedReason}` : `₹${price}`}
                        className={cn(
                          'relative flex shrink-0 cursor-pointer flex-col items-center justify-center border-l border-slate-100 text-[10px] font-black transition-colors overflow-hidden',
                          inDrag && 'bg-primary-200/60',
                          isActive && !inDrag && 'bg-teal-50/50 ring-1 ring-inset ring-teal-400',
                          !inDrag && !isActive && custom && !blockedReason && 'bg-emerald-50 text-emerald-700',
                          !inDrag && !isActive && !custom && !blockedReason && 'text-slate-700 hover:bg-slate-50',
                          blockedReason && 'bg-slate-100/70 text-slate-400'
                        )}
                        style={{ width: DAY_W }}
                      >
                        {blockedReason && (
                          <svg
                            className="absolute inset-0 h-full w-full pointer-events-none"
                            preserveAspectRatio="none"
                            viewBox="0 0 100 100"
                          >
                            <line x1="0" y1="100" x2="100" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
                          </svg>
                        )}
                        {!blockedReason && `₹${formatCompactPrice(price)}`}
                      </div>
                    );
                  })}

                  {/* Booking bars - Capsule Pill style like Image 3 */}
                  {roomBookings.map((b) => {
                    const startStr = toDateStr(b.checkIn);
                    const endStr = toDateStr(b.checkOut);
                    if (endStr < toDateStr(allDays[0]) || startStr > toDateStr(allDays[allDays.length - 1])) return null;
                    const startIdx = dayIndex.has(startStr) ? dayIndex.get(startStr) : 0;
                    const endIdx = dayIndex.has(endStr) ? dayIndex.get(endStr) : allDays.length - 1;
                    const left = startIdx * DAY_W + 2;
                    const width = Math.max((endIdx - startIdx + 1) * DAY_W - 4, DAY_W - 4);
                    const status = getEffectiveStatus(b);
                    const guestName = b.user?.name || 'Guest';
                    return (
                      <div
                        key={`${b._id}-${room._id}`}
                        role="button"
                        tabIndex={0}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onOpenReservation?.(b); }}
                        title={`${guestName} · ${startStr} → ${endStr} · ₹${b.totalAmount} · ${status}`}
                        className={cn(
                          'absolute top-1/2 z-10 flex -translate-y-1/2 items-center justify-between overflow-hidden rounded-full px-2.5 text-[10px] font-bold text-white shadow-xs transition-all hover:scale-[1.01] hover:brightness-105 cursor-pointer',
                          status === 'confirmed' ? 'bg-[#008080]' : status === 'pending' ? 'bg-amber-600' : 'bg-slate-600'
                        )}
                        style={{ left, width, height: 26 }}
                      >
                        <span className="truncate max-w-[45%] font-extrabold">{guestName}</span>
                        {b.totalAmount && (
                          <span className="font-medium opacity-90 truncate hidden sm:inline">₹{Number(b.totalAmount).toLocaleString('en-IN')}</span>
                        )}
                        <span className="text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-white/20 shrink-0">
                          {status === 'confirmed' ? 'Confirmed' : status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Legend + hint */}
      <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/40">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Custom price</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" /> Blocked</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#008080]" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Completed</span>
        <span className="text-slate-300">|</span>
        <span>Drag across empty dates to set pricing / blocking</span>
      </div>
    </Card>
  );
};

export default RoomAvailabilityGrid;
