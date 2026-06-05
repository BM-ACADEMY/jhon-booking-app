import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, BedDouble, Star, Heart, Users, Bath, Maximize } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { getRoomSlug } from '../api';
import RoomCardSkeleton from '../components/RoomCardSkeleton';
const RoomsSection = () => {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, toggleUserWishlist } = useAuth();
  const wishlist = user?.wishlist || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsRes, catsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/categories')
        ]);
        setRooms(roomsRes.data);
        setCategories(catsRes.data.map(c => c.name));
      } catch (err) {
        console.error('Error fetching room data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const SERVER_URL = import.meta.env.VITE_BASE_URL;

  const getTodayPrice = (roomObj) => {
    if (!roomObj) return 0;
    
    const matchDate = (dbDate, targetDateStr) => {
      if (!dbDate) return false;
      let dbDateStr = '';
      if (typeof dbDate === 'string') {
        if (dbDate.includes('T')) {
          const d = new Date(dbDate);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          dbDateStr = `${yyyy}-${mm}-${dd}`;
        } else {
          dbDateStr = dbDate.substring(0, 10);
        }
      } else if (dbDate instanceof Date) {
        const yyyy = dbDate.getFullYear();
        const mm = String(dbDate.getMonth() + 1).padStart(2, '0');
        const dd = String(dbDate.getDate()).padStart(2, '0');
        dbDateStr = `${yyyy}-${mm}-${dd}`;
      } else {
        const d = new Date(dbDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dbDateStr = `${yyyy}-${mm}-${dd}`;
      }
      return dbDateStr === targetDateStr;
    };

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    let todayPrice = roomObj.price || 0;
    if (roomObj.datePrices && Array.isArray(roomObj.datePrices)) {
      const found = roomObj.datePrices.find(dp => matchDate(dp.date, todayStr));
      if (found) todayPrice = found.price;
    }
    return todayPrice;
  };

  // Group rooms by category; also collect rooms with no matching category under their own label
  const grouped = categories.reduce((acc, cat) => {
    const catRooms = rooms.filter(r => r.category === cat);
    if (catRooms.length > 0) acc.push({ name: cat, rooms: catRooms });
    return acc;
  }, []);

  // Rooms whose category doesn't match any known category
  const knownCats = new Set(categories);
  const uncategorised = rooms.filter(r => !knownCats.has(r.category));
  if (uncategorised.length > 0) grouped.push({ name: 'Other', rooms: uncategorised });

  const RoomCard = ({ room }) => {
    const isWishlisted = wishlist.includes(room._id);
    return (
      <Link
        to={`/rooms/${getRoomSlug(room.name)}`}
        className="group bg-white rounded-[32px] border border-gray-100 p-3 flex flex-col shadow-xl hover:border-gray-200/80 transition-all duration-350"
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-150 shadow-sm">
          {room.images && room.images.length > 0 ? (
            <img
              src={(() => { const u = room.images[0]?.url || room.images[0]; return typeof u === 'string' && u.startsWith('http') ? u : `${SERVER_URL}${u}`; })()}
              alt={room.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <BedDouble className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Floating Heart Button on Top-Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!user) { navigate('/login'); return; }
              toggleUserWishlist(room._id);
            }}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white hover:scale-105 shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer border-none outline-none"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-800'}`} />
          </button>

          {/* Premium Price Tag Badge on Bottom-Right */}
          <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full tracking-wide flex items-center gap-1.5 shadow-sm">
            <span className="font-bold mr-1">₹{getTodayPrice(room).toLocaleString('en-IN')}</span>
            <span className="text-[9px] font-medium text-white/80">/ {room.priceUnit || 'night'}</span>
          </div>
        </div>

        {/* Content Panel */}
        <div className="pt-4 pb-2 px-2 flex-1 flex flex-col text-left">
          <div className="mb-2">
            <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full">
              {room.category}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
            {room.name}
          </h3>
          <p className="text-sm text-gray-400 font-medium mt-0.5 mb-2">
            {room.address || `${room.city || 'Serenity Beach'}, India`}
          </p>

          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(room.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-bold">
              ({room.visitorsCount || 0} Visitors)
            </span>
          </div>

          {/* Specs Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 border-t border-gray-100 pt-3.5 mt-auto text-xs text-gray-500 font-bold">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>{room.guests || 2} Guests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-3.5 h-3.5 text-gray-400" />
              <span>{room.bedrooms || 1} Bed{room.bedrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-3.5 h-3.5 text-gray-400" />
              <span>{room.bathrooms || 1} Bath{room.bathrooms > 1 ? 's' : ''}</span>
            </div>
            {room.size && (
              <div className="flex items-center gap-1.5">
                <Maximize className="w-3.5 h-3.5 text-gray-400" />
                <span>{room.size}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Header */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight">
            Our Hotel Rooms
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <BedDouble className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No rooms available.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            {grouped.map(({ name, rooms: catRooms }) => (
              <div key={name}>
                {/* Category heading */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 capitalize">{name}</h3>
                  <Link
                    to={`/rooms?category=${encodeURIComponent(name)}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    See all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Room cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {catRooms.slice(0, 3).map(room => (
                    <RoomCard key={room._id} room={room} />
                  ))}
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
