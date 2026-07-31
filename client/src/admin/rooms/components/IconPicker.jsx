import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ICON_LIST, getIconComp } from '../utils';

/** Compact icon chooser used by the highlights & amenities rows (same ICON_LIST as before). */
const IconPicker = ({ value, onChange, disabled = false, size = 'md', accent = 'text-primary-600' }) => {
  const [open, setOpen] = useState(false);
  const Current = getIconComp(value);
  const box = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const icon = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          title={`Icon: ${value || 'Star'}`}
          className={cn(
            'flex shrink-0 items-center justify-center border border-gray-200 bg-white shadow-sm transition-colors',
            !disabled && 'cursor-pointer hover:border-primary-300 hover:bg-primary-50',
            disabled && 'opacity-60 cursor-not-allowed',
            box,
            accent
          )}
        >
          <Current className={icon} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <div className="grid grid-cols-6 gap-1">
          {ICON_LIST.map((ic) => {
            const Comp = ic.icon;
            return (
              <button
                key={ic.name}
                type="button"
                title={ic.name}
                onClick={() => { onChange(ic.name); setOpen(false); }}
                className={cn(
                  'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
                  value === ic.name
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Comp className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default IconPicker;
