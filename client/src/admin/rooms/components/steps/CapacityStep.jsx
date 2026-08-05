import {
  Bath,
  BedDouble,
  Clock,
  IndianRupee,
  Shield,
  ShowerHead,
  Users,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const CAPACITY_FIELDS = [
  { id: "maxOccupancy", label: "Max Occupancy", icon: Users },
  { id: "bathrooms", label: "Bathrooms", icon: Bath },
  { id: "showers", label: "Showers", icon: ShowerHead },
];

/** Numeric capacity grid + extra bed feature + availability toggle — reused by room config sheet & wizard */
export const CapacityFields = ({
  form,
  patch,
  readOnly = false,
  showAvailability = true,
}) => {
  const allowExtraBed = !!form.allowExtraBed;
  const extraBedCount = Number(form.extraBedCount) || 0;
  const extraBedPrice = Number(form.extraBedPrice) || 0;

  return (
    <div className="space-y-6">
      {/* Basic Capacity Grid (Bedrooms & Beds removed) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {CAPACITY_FIELDS.map((field) => (
          <div
            key={field.id}
            className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 p-3"
          >
            <field.icon className="mb-2 h-4 w-4 text-primary-500" />
            <Label className="mb-2 text-center text-[9px]">{field.label}</Label>
            <input
              type="number"
              min="0"
              disabled={readOnly}
              value={
                form[field.id] !== undefined && form[field.id] !== null
                  ? form[field.id]
                  : 0
              }
              onChange={(e) => patch({ [field.id]: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-black outline-none transition-all focus:border-primary-500 disabled:opacity-60"
            />
          </div>
        ))}
      </div>

      {/* Extra Bed Concept Section */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100/80 rounded-xl">
              <BedDouble className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                Extra Bed Option
              </h4>
              <p className="text-[11px] text-amber-700 font-medium">
                Allow guests to request extra beds with custom per-bed pricing
              </p>
            </div>
          </div>
          <Switch
            checked={allowExtraBed}
            disabled={readOnly}
            onCheckedChange={(v) => patch({ allowExtraBed: v })}
          />
        </div>

        {/* Dynamic Extra Bed Pricing & Count Details (Opens when Extra Bed is toggled ON) */}
        {allowExtraBed && (
          <div className="pt-3 border-t border-amber-200/60 space-y-4 animate-in fade-in duration-200">
            {/* Top Per Bed Price & Count Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white border border-amber-200 px-4 py-2.5 shadow-sm">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5 text-amber-600" />
                Max Extra Bed Count:{" "}
                <strong className="text-amber-800 font-black text-sm">
                  {extraBedCount}
                </strong>
              </span>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                Top Price / Bed:{" "}
                <strong className="text-emerald-700 font-black text-sm">
                  ₹{extraBedPrice.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Extra Bed Count Allowed *
                </Label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    placeholder="e.g. 1 or 2"
                    value={
                      form.extraBedCount !== undefined &&
                      form.extraBedCount !== null
                        ? form.extraBedCount
                        : 0
                    }
                    onChange={(e) => patch({ extraBedCount: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Maximum number of extra beds guests can add.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Price Per Extra Bed (₹) *
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    disabled={readOnly}
                    placeholder="e.g. 500"
                    value={
                      form.extraBedPrice !== undefined &&
                      form.extraBedPrice !== null
                        ? form.extraBedPrice
                        : 0
                    }
                    onChange={(e) => patch({ extraBedPrice: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  Amount charged per extra bed per night.
                </p>
              </div>
            </div>
          </div>
        )}
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
};

const CapacityStep = (props) => <CapacityFields {...props} />;

export default CapacityStep;
