import { BedDouble, Info, Settings2, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { imageSrc } from '../utils';

/** One room entry in the left sidebar list. */
const RoomListItem = ({ room, selected, categoryColor, onSelect, onView, onConfigure, onDelete }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => onSelect(room)}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(room); } }}
    className={cn(
      'group w-full cursor-pointer rounded-2xl border bg-white p-3 text-left shadow-sm transition-all hover:shadow-md',
      selected
        ? 'border-primary-500 ring-2 ring-primary-500/20'
        : 'border-gray-100 hover:border-primary-200'
    )}
  >
    <div className="flex gap-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {room.images?.[0] ? (
          <img src={imageSrc(room.images[0])} alt={room.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BedDouble className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-black text-gray-900">{room.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-gray-600">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {room.rating || 'New'}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-black', categoryColor)}>
            {room.category}
          </span>
          <Badge
            variant={room.isAvailable ? 'success' : 'destructive'}
            className="px-2 py-0 text-[9px] font-black"
          >
            {room.isAvailable ? 'Available' : 'Occupied'}
          </Badge>
          {room.status === 'draft' && (
            <Badge variant="warning" className="px-2 py-0 text-[9px] font-black uppercase">Draft</Badge>
          )}
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-gray-900">₹{room.price}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
              / {room.priceUnit || 'night'}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              title="View details"
              onClick={(e) => { e.stopPropagation(); onView(room); }}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Configure"
              onClick={(e) => { e.stopPropagation(); onConfigure(room); }}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); onDelete(room); }}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default RoomListItem;
