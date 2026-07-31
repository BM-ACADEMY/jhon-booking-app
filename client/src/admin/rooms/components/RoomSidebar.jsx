import { BedDouble, Edit2, Loader2, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import RoomListItem from './RoomListItem';

/** Left column: search, category filter, category quick-actions and the room list. */
const RoomSidebar = ({
  rooms = [], categories = [], loading,
  search, onSearchChange,
  activeCategory, onCategoryChange,
  selectedRoomId, onSelectRoom, onViewRoom, onConfigureRoom, onDeleteRoom,
  onEditCategory, onDeleteCategory,
  getCatColor,
}) => {
  const activeCategoryObj = categories.find((c) => c.name === activeCategory);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="space-y-3 border-b border-gray-100 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rooms..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={activeCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Properties ({rooms.length})</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c.name}>
                  {c.name} ({rooms.filter((r) => r.category === c.name).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeCategoryObj && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Edit category"
                onClick={() => onEditCategory(activeCategoryObj)}
                className="cursor-pointer rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:text-primary-600"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Delete category"
                onClick={() => onDeleteCategory(activeCategoryObj)}
                className="cursor-pointer rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-20 text-center">
            <BedDouble className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-bold text-gray-400">No rooms found</p>
          </div>
        ) : (
          rooms.map((room) => (
            <RoomListItem
              key={room._id}
              room={room}
              selected={selectedRoomId === room._id}
              categoryColor={getCatColor(room.category)}
              onSelect={onSelectRoom}
              onView={onViewRoom}
              onConfigure={onConfigureRoom}
              onDelete={onDeleteRoom}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {rooms.length} {rooms.length === 1 ? 'property' : 'properties'}
      </div>
    </Card>
  );
};

export default RoomSidebar;
