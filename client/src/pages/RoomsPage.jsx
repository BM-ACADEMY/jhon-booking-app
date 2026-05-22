import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal, BedDouble, Star, Users, Bath, ArrowRight, Loader2 } from 'lucide-react';
import api from '../api';

const SERVER_URL = 'http://localhost:5000';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const RoomsPage = () => {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [active, setActive] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [roomsRes, catsRes] = await Promise.all([api.get('/rooms'), api.get('/categories')]);
        setRooms(roomsRes.data);
        setCategories(['All', ...catsRes.data.map(c => c.name)]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = rooms.filter(r => {
    const matchCat = active === 'All' || r.category === active;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.city || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 pt-28 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #d4891f 0%, transparent 50%), radial-gradient(circle at 70% 50%, #d4891f 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-primary-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Curated Properties</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
            Find Your Perfect<br /><span className="text-primary-400">Stay</span>
          </h1>
          {/* Search bar */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3.5 max-w-lg mx-auto">
            <Search className="w-5 h-5 text-white/50 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or city..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none font-medium"
            />
            <SlidersHorizontal className="w-4 h-4 text-white/40" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`cursor-pointer px-5 py-2 rounded-full text-sm font-bold transition-all ${
                active === cat
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 font-medium">
            <span className="font-black text-gray-900 text-lg">{filtered.length}</span> properties found
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <BedDouble className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 font-bold">No properties match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7">
            {filtered.map(room => (
              <Link
                key={room._id}
                to={`/rooms/${room._id}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-400 border border-gray-100 flex flex-col"
              >
                {/* Image */}
                <div className="relative h-56 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                  {room.images?.[0] ? (
                    <img src={getImageUrl(room.images[0])} alt={room.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BedDouble className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                      {room.category}
                    </span>
                    {room.isFeatured && (
                      <span className="bg-primary-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {room.rating ? room.rating.toFixed(1) : 'New'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">
                    {room.propertyType} • {room.city || 'Serenity'}
                  </p>
                  <h2 className="font-black text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1 mb-2">
                    {room.name}
                  </h2>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
                    {room.description ? room.description.replace(/<[^>]*>/g, '') : ''}
                  </p>

                  {/* Specs */}
                  <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 mb-5 pb-5 border-b border-gray-50">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {room.guests}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {room.bedrooms} bed</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {room.bathrooms} bath</span>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-gray-900">${room.price}</span>
                        {room.originalPrice && (
                          <span className="text-gray-400 text-sm line-through">${room.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">/ {room.priceUnit || 'night'}</span>
                    </div>
                    <span className="flex items-center gap-1.5 bg-primary-600 group-hover:bg-primary-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-primary-500/25 transition-all">
                      View <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomsPage;
