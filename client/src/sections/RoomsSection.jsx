import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, BedDouble, Star, Wifi, Car, Utensils, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import api from '../api';

const amenityIcons = { Wifi: Icons.Wifi, Parking: Icons.Car, Breakfast: Icons.Utensils };

const getIcon = (name) => {
  const IconComp = Icons[name] || Icons.Check;
  return IconComp;
};

const RoomsSection = () => {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [active, setActive] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsRes, catsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/categories')
        ]);
        
        setRooms(roomsRes.data);
        const catNames = catsRes.data.map(c => c.name);
        setCategories(['All', ...catNames]);
      } catch (err) {
        console.error('Error fetching room data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = active === 'All' ? rooms : rooms.filter((r) => r.category === active);

  // Helper for random-ish but consistent gradients based on category
  const getGradient = (category) => {
    const map = {
      'Deluxe': 'from-blue-900 to-slate-800',
      'Presidential': 'from-amber-900 to-stone-800',
      'Suite': 'from-emerald-900 to-teal-800',
      'Standard': 'from-violet-900 to-purple-800',
    };
    return map[category] || 'from-gray-800 to-slate-900';
  };

  const SERVER_URL = 'http://localhost:5000';

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-primary-500 text-sm font-semibold uppercase tracking-widest mb-3">Our Rooms</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Find Your Perfect Stay</h2>
            <div className="w-16 h-1 bg-primary-500 rounded-full mt-4" />
          </div>
          <Link
            to="/rooms"
            className="cursor-pointer flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors self-start sm:self-auto"
          >
            View All Rooms <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {loading ? (
             <div className="h-10 w-full animate-pulse bg-gray-200 rounded-full" />
          ) : (
            categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`cursor-pointer px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  active === cat
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {cat}
              </button>
            ))
          )}
        </div>

        {/* Room cards */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
             <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
             <p className="text-gray-500 font-medium">No rooms found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((room) => (
              <div
                key={room._id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
              >
                {/* Image placeholder with gradient */}
                <div className={`relative h-52 bg-gradient-to-br ${getGradient(room.category)} overflow-hidden`}>
                  {room.images && room.images.length > 0 ? (
                    <img 
                      src={(() => { const u = room.images[0]?.url || room.images[0]; return typeof u === 'string' && u.startsWith('http') ? u : `${SERVER_URL}${u}`; })()} 
                      alt={room.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BedDouble className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-white/15 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/20">
                      {room.category}
                    </span>
                    {room.isFeatured && (
                      <span className="bg-primary-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {room.rating ? room.rating.toFixed(1) : 'New'} {room.reviewCount > 0 && `(${room.reviewCount})`}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                  </div>
                  
                  {/* Property Type & Location */}
                  <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    {room.propertyType || 'Entire Villa'} • {room.city || 'Serenity Beach'}
                  </p>

                  {/* Specs (Airbnb Style) */}
                  <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 mb-4 pb-4 border-b border-gray-50">
                    <span>{room.guests} guests</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{room.bedrooms} bedrooms</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{room.beds} beds</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{room.bathrooms} baths</span>
                  </div>

                  {/* Amenity icons */}
                  <div className="flex items-center gap-2 mb-5">
                    {room.amenities && room.amenities.slice(0, 5).map((a, i) => {
                      const Icon = getIcon(a.icon || 'Check');
                      return (
                        <span key={i} className="w-7 h-7 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-default" title={a.name}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                      );
                    })}
                    {room.amenities && room.amenities.length > 5 && (
                      <span className="text-[10px] text-gray-400 font-bold">+{room.amenities.length - 5}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900">${room.price}</span>
                        {room.originalPrice && (
                          <span className="text-gray-400 text-sm line-through decoration-red-400/50 decoration-2">${room.originalPrice}</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest"> / {room.priceUnit || 'night'}</span>
                    </div>
                    <Link
                      to={`/rooms/${room._id}`}
                      className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-md shadow-primary-500/20 active:scale-95"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RoomsSection;
