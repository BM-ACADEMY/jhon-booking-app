import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, BedDouble, Star } from 'lucide-react';

const sampleRooms = [
  { _id: '1', name: 'Deluxe Ocean View', category: 'Deluxe', price: 150, capacity: 2, isAvailable: true, rating: 4.8, reviewCount: 24, images: [] },
  { _id: '2', name: 'Presidential Suite', category: 'Presidential', price: 450, capacity: 4, isAvailable: true, rating: 4.9, reviewCount: 12, images: [] },
  { _id: '3', name: 'Standard Twin', category: 'Standard', price: 80, capacity: 2, isAvailable: false, rating: 4.2, reviewCount: 56, images: [] },
  { _id: '4', name: 'Junior Suite', category: 'Suite', price: 220, capacity: 3, isAvailable: true, rating: 4.6, reviewCount: 31, images: [] },
];

const categoryColors = {
  Standard: 'bg-gray-100 text-gray-700',
  Deluxe: 'bg-blue-100 text-blue-700',
  Suite: 'bg-purple-100 text-purple-700',
  Presidential: 'bg-yellow-100 text-yellow-700',
};

const RoomManagement = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const categories = ['All', 'Standard', 'Deluxe', 'Suite', 'Presidential'];
  const filtered = sampleRooms.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || r.category === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm text-gray-600 placeholder-gray-400 outline-none w-full"
          />
        </div>
        <button className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? 'bg-primary-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((room) => (
          <div key={room._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Image placeholder */}
            <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative">
              <BedDouble className="w-10 h-10 text-gray-400" />
              <span className={`absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[room.category]}`}>
                {room.category}
              </span>
              <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${room.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {room.isAvailable ? 'Available' : 'Occupied'}
              </span>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{room.name}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600">{room.rating} ({room.reviewCount} reviews)</span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div>
                  <span className="text-xl font-bold text-gray-800">${room.price}</span>
                  <span className="text-xs text-gray-400">/night</span>
                </div>
                <span className="text-xs text-gray-500">Capacity: {room.capacity}</span>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-primary-300 hover:text-primary-600 text-gray-600 text-sm py-2 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-red-300 hover:text-red-600 text-gray-600 text-sm py-2 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No rooms found</p>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
