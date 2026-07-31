import { Sparkles, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import IconPicker from '../IconPicker';

/** Key highlights add/remove rows — behaviour identical to the old Features tab. */
const FeaturesSection = ({ form, patch, readOnly = false }) => {
  const update = (i, key, value) => {
    patch((p) => {
      const next = [...p.highlights];
      next[i] = { ...next[i], [key]: value };
      return { ...p, highlights: next };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Key Highlights
        </h4>
        {!readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary-600 hover:bg-primary-50"
            onClick={() => patch((p) => ({
              ...p,
              highlights: [...(p.highlights || []), { icon: 'Star', text: '', subtext: '' }]
            }))}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Highlight
          </Button>
        )}
      </div>

      {(!form.highlights || form.highlights.length === 0) ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
          No highlights added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {form.highlights.map((h, i) => (
            <div key={i} className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <IconPicker
                value={h.icon}
                disabled={readOnly}
                onChange={(name) => update(i, 'icon', name)}
              />
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Main text (e.g. Great Location)"
                  value={h.text || ''}
                  disabled={readOnly}
                  onChange={(e) => update(i, 'text', e.target.value)}
                  className="h-8 bg-white text-sm font-bold"
                />
                <Input
                  placeholder="Subtext (e.g. 95% of recent guests gave 5 stars)"
                  value={h.subtext || ''}
                  disabled={readOnly}
                  onChange={(e) => update(i, 'subtext', e.target.value)}
                  className="h-8 bg-white text-xs"
                />
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => patch((p) => ({ ...p, highlights: p.highlights.filter((_, idx) => idx !== i) }))}
                  className="cursor-pointer p-2 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturesSection;
