import { useMemo, useState, useEffect } from 'react';
import { BedDouble, CalendarDays, Shield, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import {
  formatCompactPrice, getBlockedReason, getDatePrice, hasCustomPrice, toDateStr
} from '../utils';

/**
 * Center column. One calendar showing BOTH kinds of day indicators that used
 * to live in two separate calendars: per-day custom prices (green) and blocked
 * ranges (red shield). Selecting dates opens the config sheet.
 */
const RoomCalendarPanel = ({ room, onRangeSelect, onOpenSection }) => {
  const [range, setRange] = useState(undefined);
  const [month, setMonth] = useState(new Date());

  useEffect(() => { setRange(undefined); }, [room?._id]);

  const modifiers = useMemo(() => ({
    customPrice: (date) => !!room && hasCustomPrice(room, toDateStr(date)),
    blocked: (date) => !!room && !!getBlockedReason(room.blockedDates, toDateStr(date)),
  }), [room]);

  const modifiersClassNames = {
    customPrice: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blocked: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  const handleSelect = (next) => {
    setRange(next);
    if (!next?.from) { onRangeSelect?.(null); return; }
    onRangeSelect?.({ from: toDateStr(next.from), to: toDateStr(next.to || next.from) });
  };

  const renderDay = ({ date, activeModifiers }) => {
    const dateStr = toDateStr(date);
    const blockedReason = room ? getBlockedReason(room.blockedDates, dateStr) : null;
    const price = room ? getDatePrice(room, dateStr) : 0;
    const custom = room ? hasCustomPrice(room, dateStr) : false;
    const selected = activeModifiers?.selected;
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center leading-none"
        title={blockedReason ? `Blocked: ${blockedReason}` : undefined}
      >
        <span className="text-[11px] font-bold">{date.getDate()}</span>
        {room && (
          <span
            className={cn(
              'mt-1 text-[8px] font-black leading-none',
              selected ? 'text-white/90' : custom ? 'text-emerald-600' : 'text-gray-500'
            )}
          >
            ₹{formatCompactPrice(price)}
          </span>
        )}
        {blockedReason && !selected && (
          <Shield className="absolute bottom-1 h-2.5 w-2.5 fill-rose-100 text-rose-500" />
        )}
      </div>
    );
  };

  if (!room) {
    return (
      <Card className="flex h-full min-h-[420px] items-center justify-center">
        <div className="text-center">
          <BedDouble className="mx-auto mb-3 h-12 w-12 text-gray-200" />
          <p className="text-sm font-black text-gray-500">Select a property</p>
          <p className="mt-1 text-xs text-gray-400">
            Pick a room from the list to see its pricing &amp; availability calendar.
          </p>
        </div>
      </Card>
    );
  }

  const blockedCount = room.blockedDates?.length || 0;
  const customCount = room.datePrices?.length || 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 border-b border-gray-100 p-5">
        <div className="min-w-0">
          <CardTitle className="truncate text-base font-black">{room.name}</CardTitle>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Pricing &amp; availability calendar
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge variant="success" className="text-[9px]">{customCount} custom prices</Badge>
          <Badge variant="destructive" className="text-[9px]">{blockedCount} blocks</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center gap-4 p-5">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          showOutsideDays={false}
          components={{ DayContent: renderDay }}
        />

        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Custom price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-600" /> Selected
          </span>
        </div>

        <div className="mt-auto w-full space-y-2 border-t border-gray-100 pt-4">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {range?.from
              ? `Selected: ${toDateStr(range.from)}${range.to ? ` → ${toDateStr(range.to)}` : ''}`
              : 'Select one or more dates to configure them'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenSection?.('pricing')}
            >
              <Tag className="mr-1.5 h-4 w-4" /> Pricing
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenSection?.('availability')}
            >
              <Shield className="mr-1.5 h-4 w-4" /> Availability
            </Button>
            <Button className="flex-1" onClick={() => onOpenSection?.('general')}>
              <CalendarDays className="mr-1.5 h-4 w-4" /> Configure
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomCalendarPanel;
