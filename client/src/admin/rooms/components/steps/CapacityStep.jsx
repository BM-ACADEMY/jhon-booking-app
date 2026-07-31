import { Bath, BedDouble, Shield, ShowerHead, Users } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const CAPACITY_FIELDS = [
  { id: 'guests', label: 'Max Guests', icon: Users },
  { id: 'maxAdults', label: 'Max Adults', icon: Users },
  { id: 'maxChildren', label: 'Max Children', icon: Users },
  { id: 'bedrooms', label: 'Bedrooms', icon: BedDouble },
  { id: 'beds', label: 'Beds', icon: BedDouble },
  { id: 'bathrooms', label: 'Bathrooms', icon: Bath },
  { id: 'showers', label: 'Showers', icon: ShowerHead },
];

/** Numeric capacity grid + availability toggle — reused by the sheet's Policies section. */
export const CapacityFields = ({ form, patch, readOnly = false, showAvailability = true }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {CAPACITY_FIELDS.map((field) => (
        <div
          key={field.id}
          className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-3"
        >
          <field.icon className="mb-2 h-4 w-4 text-primary-500" />
          <Label className="mb-2 text-center text-[9px]">{field.label}</Label>
          <input
            type="number"
            disabled={readOnly}
            value={form[field.id] !== undefined && form[field.id] !== null ? form[field.id] : 0}
            onChange={(e) => patch({ [field.id]: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-black outline-none transition-all focus:border-primary-500 disabled:opacity-60"
          />
        </div>
      ))}
    </div>

    {showAvailability && (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
        <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-800">
          <Shield className="h-3.5 w-3.5" /> Guest Policies
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-emerald-900">
            Is this property currently available?
          </span>
          <Switch
            checked={!!form.isAvailable}
            disabled={readOnly}
            onCheckedChange={(v) => patch({ isAvailable: v })}
          />
        </div>
      </div>
    )}
  </div>
);

const CapacityStep = (props) => <CapacityFields {...props} />;

export default CapacityStep;
