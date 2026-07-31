import { Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import IconPicker from '../IconPicker';

/** Amenities add/remove rows — behaviour identical to the old Features tab. */
const AmenitiesSection = ({ form, patch, readOnly = false }) => {
  const update = (i, key, value) => {
    patch((p) => {
      const next = [...p.amenities];
      next[i] = { ...next[i], [key]: value };
      return { ...p, amenities: next };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-500" /> Amenities
        </h4>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary-600 hover:bg-primary-50"
            onClick={() => patch((p) => ({
              ...p,
              amenities: [...(p.amenities || []), { name: '', icon: 'Check' }]
            }))}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Amenity
          </Button>
        )}
      </div>

      {(!form.amenities || form.amenities.length === 0) ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          No amenities added yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {form.amenities.map((a, i) => (
            <div key={i} className="group flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2">
              <IconPicker
                value={a.icon}
                size="sm"
                accent="text-emerald-600"
                disabled={readOnly}
                onChange={(name) => update(i, 'icon', name)}
              />
              <Input
                placeholder="Amenity name"
                value={a.name || ''}
                disabled={readOnly}
                onChange={(e) => update(i, 'name', e.target.value)}
                className="h-8 flex-1 bg-white text-xs font-bold"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => patch((p) => ({ ...p, amenities: p.amenities.filter((_, idx) => idx !== i) }))}
                  className="cursor-pointer p-1.5 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;
