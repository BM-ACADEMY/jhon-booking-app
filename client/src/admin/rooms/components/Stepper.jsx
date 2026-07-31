import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Numbered step header (no shadcn primitive exists for this).
 * `steps` = [{ id, label, icon? }], `current` = index of the active step.
 */
const Stepper = ({ steps, current, onStepClick }) => (
  <ol className="flex w-full items-center">
    {steps.map((step, index) => {
      const isDone = index < current;
      const isActive = index === current;
      const clickable = typeof onStepClick === 'function' && index <= current;
      return (
        <li
          key={step.id}
          className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}
        >
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onStepClick(index)}
            className={cn(
              'flex shrink-0 flex-col items-center gap-1.5 text-center',
              clickable ? 'cursor-pointer' : 'cursor-default'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition-all',
                isActive && 'border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-500/25',
                isDone && 'border-emerald-500 bg-emerald-500 text-white',
                !isActive && !isDone && 'border-gray-200 bg-white text-gray-400'
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span
              className={cn(
                'hidden text-[10px] font-bold uppercase tracking-widest sm:block',
                isActive ? 'text-primary-700' : isDone ? 'text-emerald-600' : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </button>
          {index < steps.length - 1 && (
            <span
              className={cn(
                'mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-3',
                index < current ? 'bg-emerald-500' : 'bg-gray-200'
              )}
            />
          )}
        </li>
      );
    })}
  </ol>
);

export default Stepper;
