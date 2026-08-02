import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Settings2, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { matchDate } from '../../utils';

/** Base price + price unit — shared by the wizard's General step and the sheet. */
export const BasePricingFields = ({
  form, patch, readOnly = false,
}) => (
  <div className="space-y-1.5">
    <Label htmlFor="room-price" className="text-xs font-semibold text-zinc-700">Base Price (₹) *</Label>
    <Input
      id="room-price"
      type="number"
      value={form.price}
      disabled={readOnly}
      onChange={(e) => patch({ price: e.target.value })}
      placeholder="e.g. 500"
      className="border-zinc-200 focus-visible:ring-zinc-400"
    />
  </div>
);

/**
 * Pricing accordion section: base pricing + per-day custom prices for the
 * currently selected calendar date.
 */
const PricingSection = ({
  form, patch, priceUnits = [], readOnly = false, onManageUnits,
  selectedDate, onSetCustomPrice, onResetCustomPrice,
}) => {
  const [customPriceInput, setCustomPriceInput] = useState('');

  // Mirrors handleSelectPricingDay: prefill with the day's custom price or base price.
  useEffect(() => {
    if (!selectedDate) { setCustomPriceInput(''); return; }
    const found = form.datePrices?.find((dp) => matchDate(dp.date, selectedDate));
    setCustomPriceInput(found ? String(found.price) : String(form.price || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, form.datePrices]);

  const customList = (form.datePrices || [])
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-4 shadow-sm">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-zinc-400" /> Base Pricing Setup
        </h4>
        <BasePricingFields
          form={form}
          patch={patch}
          priceUnits={priceUnits}
          readOnly={readOnly}
          onManageUnits={onManageUnits}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" /> Dynamic Daily Pricing
        </h4>
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Pick a date on the calendar to set a custom price for that day. Days with a custom
          price will use the specified rate; otherwise, the base price (₹{form.price || 0}) applies.
        </p>

        {selectedDate ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Selected Date</span>
              <span className="text-xs font-semibold text-zinc-900 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg">
                {selectedDate}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-price" className="text-xs font-semibold text-zinc-700">Price for this day (₹)</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-price"
                  type="number"
                  value={customPriceInput}
                  disabled={readOnly}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder={`e.g. ${form.price || '500'}`}
                  className="border-zinc-200 focus-visible:ring-zinc-400"
                />
                <Button
                  type="button"
                  disabled={readOnly}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium"
                  onClick={() => onSetCustomPrice?.(selectedDate, customPriceInput)}
                >
                  Set Price
                </Button>
              </div>
            </div>
            {!readOnly && (
              <div className="pt-2 border-t border-zinc-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => onResetCustomPrice?.(selectedDate)}
                  className="cursor-pointer text-[10px] font-bold uppercase text-red-500 hover:text-red-700 underline"
                >
                  Reset to Base Price
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 py-8 text-center text-zinc-400">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
            <p className="text-xs font-medium">Select a date on the calendar to configure pricing</p>
          </div>
        )}
      </div>

      {customList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" /> Custom Priced Days ({customList.length})
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {customList.map((dp, i) => (
              <div
                key={`${dp.date}-${i}`}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm"
              >
                <span className="text-xs font-semibold text-zinc-700">
                  {String(dp.date).substring(0, 10)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900">₹{dp.price}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      title="Reset to base price"
                      onClick={() => onResetCustomPrice?.(String(dp.date).substring(0, 10))}
                      className="cursor-pointer p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingSection;
