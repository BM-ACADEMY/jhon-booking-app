import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, BedDouble, Star, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { getRoomSlug } from '../api';

const RoomsSection = () => {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [active, setActive] = useState('All');
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

  const SERVER_URL = import.meta.env.VITE_BASE_URL;

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 tracking-tight flex flex-wrap items-center gap-2">
              Our <span className="">Hotel Rooms</span>
            </h2>
          </div>
          <Link
            to="/rooms"
            className="cursor-pointer flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-sm transition-colors self-start sm:self-auto"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.slice(0, 6).map((room) => {
              const isWishlisted = wishlist.includes(room._id);
              return (
                <Link
                  key={room._id}
                  to={`/rooms/${getRoomSlug(room.name)}`}
                  className="group bg-transparent rounded-none border-none outline-none flex flex-col hover:-translate-y-1 transition-all duration-300"
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
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        toggleUserWishlist(room._id);
                      }}
                      className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white hover:scale-105 shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer border-none outline-none"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-800'}`} />
                    </button>

                    {/* Premium Price Tag Badge on Bottom-Right */}
                    <div className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full tracking-wide">
                      ₹{room.price} <span className="text-[9px] font-medium text-white/80">/ {room.priceUnit || 'night'}</span>
                    </div>
                  </div>

                  {/* Content Panel */}
                  <div className="pt-4 flex-1 flex flex-col text-left">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mt-0.5 mb-1.5">
                      {room.address || `${room.city || 'Serenity Beach'}, India`}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${
                              star <= Math.round(room.rating || 5) 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-gray-200'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-bold">
                        ({room.reviewCount > 0 ? room.reviewCount * 12 + 5 : 429} Visitors)
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RoomsSection;
