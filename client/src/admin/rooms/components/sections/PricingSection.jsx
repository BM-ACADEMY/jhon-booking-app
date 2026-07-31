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
  form, patch, priceUnits = [], readOnly = false, onManageUnits,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-1.5">
      <Label htmlFor="room-price">Base Price (₹) *</Label>
      <Input
        id="room-price"
        type="number"
        value={form.price}
        disabled={readOnly}
        onChange={(e) => patch({ price: e.target.value })}
        placeholder="e.g. 500"
      />
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="room-price-unit">Price Unit</Label>
        {!readOnly && onManageUnits && (
          <button
            type="button"
            onClick={onManageUnits}
            className="cursor-pointer text-[10px] font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add New Unit
          </button>
        )}
      </div>
      <Select
        value={form.priceUnit || undefined}
        disabled={readOnly}
        onValueChange={(v) => patch({ priceUnit: v })}
      >
        <SelectTrigger id="room-price-unit">
          <SelectValue placeholder="Select unit" />
        </SelectTrigger>
        <SelectContent>
          {priceUnits.map((u) => (
            <SelectItem key={u._id} value={u.name}>{u.label}</SelectItem>
          ))}
          {priceUnits.length === 0 && <SelectItem value="night">Per Night</SelectItem>}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-1.5 sm:col-span-2">
      <Label htmlFor="room-original-price">Original Price (₹, optional)</Label>
      <Input
        id="room-original-price"
        type="number"
        value={form.originalPrice}
        disabled={readOnly}
        onChange={(e) => patch({ originalPrice: e.target.value })}
        placeholder="Shown struck-through on the listing"
      />
    </div>
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
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-primary-500" /> Base Pricing Setup
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
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-primary-500" /> Dynamic Daily Pricing
        </h4>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Pick a date on the calendar to set a custom price for that day. Days with a custom
          price are highlighted in green. Without one, the base price (₹{form.price || 0}) applies.
        </p>

        {selectedDate ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Selected Date</span>
              <span className="text-xs font-bold text-gray-900 bg-white border border-gray-100 px-2.5 py-1 rounded-lg shadow-sm">
                {selectedDate}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-price">Price for this day (₹)</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-price"
                  type="number"
                  value={customPriceInput}
                  disabled={readOnly}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder={`e.g. ${form.price || '500'}`}
                />
                <Button
                  type="button"
                  disabled={readOnly}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onSetCustomPrice?.(selectedDate, customPriceInput)}
                >
                  Set Price
                </Button>
              </div>
            </div>
            {!readOnly && (
              <div className="pt-2 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => onResetCustomPrice?.(selectedDate)}
                  className="cursor-pointer text-[10px] font-black uppercase text-red-500 hover:text-red-700 underline"
                >
                  Reset to Base Price
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 py-8 text-center text-gray-400">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-bold">Select a date on the calendar to configure pricing</p>
          </div>
        )}
      </div>

      {customList.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
            <Settings2 className="w-3.5 h-3.5 text-emerald-500" /> Custom Priced Days ({customList.length})
          </h4>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {customList.map((dp, i) => (
              <div
                key={`${dp.date}-${i}`}
                className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2"
              >
                <span className="text-xs font-bold text-emerald-800">
                  {String(dp.date).substring(0, 10)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-700">₹{dp.price}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      title="Reset to base price"
                      onClick={() => onResetCustomPrice?.(String(dp.date).substring(0, 10))}
                      className="cursor-pointer p-1 text-gray-400 hover:text-red-500 transition-colors"
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
