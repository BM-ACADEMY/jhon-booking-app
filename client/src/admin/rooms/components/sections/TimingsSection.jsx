import { Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';

const TimingsSection = ({ form, patch, readOnly = false }) => {
  const TIME_OPTIONS = [];
  for (let h = 0; h < 24; h++) {
    const hr12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    ['00', '30'].forEach(m => {
      const time24 = `${String(h).padStart(2, '0')}:${m}`;
      const time12 = `${hr12}:${m} ${ampm}`;
      TIME_OPTIONS.push({ val24: time24, val12: time12 });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-indigo-100/80 rounded-xl">
          <Clock className="h-4 w-4 text-indigo-700" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900">
            Room Specific Check-In & Check-Out Timings
          </h4>
          <p className="text-[11px] text-indigo-700 font-medium">
            Optional manual override for this room. If left empty, global or category timings will apply.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">Check-In Time *</Label>
          <select
            disabled={readOnly}
            value={form.checkInTime || '14:00'}
            onChange={(e) => patch({ checkInTime: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 cursor-pointer"
          >
            {TIME_OPTIONS.map(opt => (
              <option key={opt.val24} value={opt.val24}>{opt.val12}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">Check-Out Time *</Label>
          <select
            disabled={readOnly}
            value={form.checkOutTime || '11:00'}
            onChange={(e) => patch({ checkOutTime: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 cursor-pointer"
          >
            {TIME_OPTIONS.map(opt => (
              <option key={opt.val24} value={opt.val24}>{opt.val12}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TimingsSection;
