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
  const [isToggledOn, setIsToggledOn] = useState(false);

  // Prefill from the dates picked on the main calendar.
  useEffect(() => {
    if (selectedRange?.from) setBlockStartDate(selectedRange.from);
    if (selectedRange?.to) setBlockEndDate(selectedRange.to);
    else if (selectedRange?.from) setBlockEndDate(selectedRange.from);
  }, [selectedRange?.from, selectedRange?.to]);

  useEffect(() => {
    if (blockStartDate && blockEndDate) {
      const blocked = form.blockedDates?.some(
        (b) =>
          new Date(b.startDate).toDateString() === new Date(blockStartDate).toDateString() &&
          new Date(b.endDate).toDateString() === new Date(blockEndDate).toDateString()
      );
      setIsToggledOn(!!blocked);
    } else {
      setIsToggledOn(false);
    }
  }, [blockStartDate, blockEndDate, form.blockedDates]);

  const handleToggleChange = (val) => {
    if (!val) {
      // Toggle off: remove the block if it exists
      const idx = form.blockedDates?.findIndex(
        (b) =>
          new Date(b.startDate).toDateString() === new Date(blockStartDate).toDateString() &&
          new Date(b.endDate).toDateString() === new Date(blockEndDate).toDateString()
      );
      if (idx !== undefined && idx !== -1) {
        onRemoveBlock?.(idx);
      }
      setIsToggledOn(false);
    } else {
      setIsToggledOn(true);
    }
  };

  const submitBlock = () => {
    const ok = onAddBlock?.(blockStartDate, blockEndDate, blockReason);
    if (ok) {
      setBlockReason('Maintenance');
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Block Room Dates
          </h4>

          {blockStartDate && blockEndDate ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-1 bg-zinc-50 border border-zinc-200 px-3 py-2.5 rounded-lg">
                <span className="text-xs font-semibold text-zinc-500">Selected Dates</span>
                <span className="text-xs font-bold text-zinc-900">
                  {blockStartDate === blockEndDate 
                    ? new Date(blockStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : `${new Date(blockStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${new Date(blockEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                  }
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-zinc-100">
                <span className="text-sm font-semibold text-zinc-800">Block Room for Selected Dates</span>
                <div className="scale-110 pr-1">
                  <Switch
                    checked={isToggledOn}
                    onCheckedChange={handleToggleChange}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs font-medium text-zinc-400">
              Select a date on the calendar to configure blocking
            </div>
          )}

          {isToggledOn && blockStartDate && blockEndDate && (
            <div className="space-y-3 pt-2 border-t border-zinc-100 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <Label htmlFor="block-reason" className="text-xs font-semibold text-zinc-700">Reason / Note</Label>
                <Input
                  id="block-reason"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Maintenance, Owner use"
                  className="border-zinc-200 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  size="sm" 
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4"
                  onClick={submitBlock}
                >
                  Apply Block
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" /> Active Date Blocks
        </h4>
        {(!form.blockedDates || form.blockedDates.length === 0) ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400 shadow-sm">
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
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 hover:bg-zinc-50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-950">{startStr} – {endStr}</span>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mt-0.5">
                        {block.reason || 'Maintenance'}
                      </p>
                    </div>
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      title="Remove Block"
                      onClick={() => onRemoveBlock?.(idx)}
                      className="cursor-pointer p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
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
