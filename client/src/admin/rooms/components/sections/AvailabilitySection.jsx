import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/**
 * Availability accordion section: master availability toggle + date blocking
 * (create ranges, list/remove existing ones). Same data shape as before.
 */
const AvailabilitySection = ({
  form, patch, readOnly = false,
  selectedRange, onAddBlock, onRemoveBlock,
}) => {
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('Maintenance');

  // Prefill from the dates picked on the main calendar.
  useEffect(() => {
    if (selectedRange?.from) setBlockStartDate(selectedRange.from);
    if (selectedRange?.to) setBlockEndDate(selectedRange.to);
    else if (selectedRange?.from) setBlockEndDate(selectedRange.from);
  }, [selectedRange?.from, selectedRange?.to]);

  const submitBlock = () => {
    const ok = onAddBlock?.(blockStartDate, blockEndDate, blockReason);
    if (ok) {
      setBlockStartDate('');
      setBlockEndDate('');
      setBlockReason('Maintenance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
        <div>
          <p className="text-sm font-bold text-emerald-900">Currently available</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/70 mt-0.5">
            Guest policies &amp; bookability
          </p>
        </div>
        <Switch
          checked={!!form.isAvailable}
          disabled={readOnly}
          onCheckedChange={(v) => patch({ isAvailable: v })}
        />
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 space-y-1.5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Date Blocking Policy
        </h4>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          Block dates to prevent bookings during maintenance, renovation, or owner use.
          Blocked dates will not be searchable or bookable.
        </p>
      </div>

      {!readOnly && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Create New Date Block
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-start">Start Date</Label>
              <Input
                id="block-start"
                type="date"
                value={blockStartDate}
                onChange={(e) => setBlockStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-end">End Date</Label>
              <Input
                id="block-end"
                type="date"
                value={blockEndDate}
                onChange={(e) => setBlockEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="block-reason">Reason / Note</Label>
            <Input
              id="block-reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Maintenance"
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={submitBlock}>Add Block Range</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-primary-500" /> Active Date Blocks
        </h4>
        {(!form.blockedDates || form.blockedDates.length === 0) ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
            No active date blocks configured.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {form.blockedDates.map((block, idx) => {
              const opts = { day: '2-digit', month: 'short', year: 'numeric' };
              const startStr = new Date(block.startDate).toLocaleDateString('en-GB', opts);
              const endStr = new Date(block.endDate).toLocaleDateString('en-GB', opts);
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-gray-800">{startStr} – {endStr}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-0.5">
                        {block.reason || 'Maintenance'}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      title="Remove Block"
                      onClick={() => onRemoveBlock?.(idx)}
                      className="cursor-pointer p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilitySection;
