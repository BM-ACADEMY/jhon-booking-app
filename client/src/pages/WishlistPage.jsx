import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, BedDouble, ArrowRight, Star, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SERVER_URL = 'http://localhost:5000';

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const WishlistPage = () => {
  const { user, toggleUserWishlist } = useAuth();
  const [wishlistRooms, setWishlistRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/wishlist');
      setWishlistRooms(res.data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user]);

  const handleRemoveWishlist = async (e, roomId) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await toggleUserWishlist(roomId);
    if (success) {
      // Animate/remove item locally from screen
      setWishlistRooms((prev) => prev.filter((room) => room._id !== roomId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-left">
          <h1 className="text-3xl font-black text-gray-900 leading-tight">My Wishlist</h1>
          <p className="text-gray-500 mt-2 font-medium">Your curated collection of dream stays and suites</p>
        </div>

        {wishlistRooms.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-150 shadow-sm max-w-xl mx-auto">
            <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
              <Heart className="w-10 h-10 text-rose-500 fill-rose-100" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Explore our luxury suites and tap the heart icon on any stay to save it here for later.
            </p>
            <Link 
              to="/rooms" 
              className="inline-flex items-center gap-2 bg-violet-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-violet-500/25 hover:bg-violet-700 transition-all hover:scale-105 active:scale-95"
            >
              Find Stays
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistRooms.map((room) => {
              const detailLink = `/rooms/${room._id}`;

              return (
                <div 
                  key={room._id}
                  className="group bg-white rounded-3xl border border-gray-150/70 overflow-hidden shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:border-gray-200 transition-all duration-300 flex flex-col relative"
                >
                  {/* Image Panel */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900">
                    {room.images?.[0] ? (
                      <img 
                        src={getImageUrl(room.images[0])} 
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <BedDouble className="w-12 h-12 text-gray-300" />
                      </div>
                    )}

                    {/* Star Rating Badge */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm shadow px-2.5 py-1 rounded-full border border-gray-100/50">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-gray-800">{room.rating ? room.rating.toFixed(1) : 'New'}</span>
                    </div>

                    {/* Wishlist Heart Icon (to remove) */}
                    <button 
                      onClick={(e) => handleRemoveWishlist(e, room._id)}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white hover:scale-105 shadow-md active:scale-95 transition-all cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500 transition-colors" />
                    </button>
                  </div>

                  {/* Description Panel */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-1 text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1.5">
                      <span>{room.category?.name || room.category || 'Suite'}</span>
                      <span>•</span>
                      <span className="truncate">{room.propertyType || 'Hotel'}</span>
                    </div>

                    <Link 
                      to={detailLink} 
                      className="font-black text-gray-900 text-lg group-hover:text-violet-600 line-clamp-1 transition-colors leading-snug mb-1"
                    >
                      {room.name}
                    </Link>

                    <div className="flex items-center gap-1 text-xs text-gray-450 font-semibold mb-4">
                      <MapPin className="w-3.5 h-3.5 text-gray-300" />
                      <span className="truncate">{[room.city, room.country].filter(Boolean).join(', ')}</span>
                    </div>

                    {/* Pricing & Reservation CTA */}
                    <div className="mt-auto border-t border-gray-50 pt-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-gray-900">${room.price}</span>
                          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">/ night</span>
                        </div>
                      </div>

                      <Link 
                        to={detailLink}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-violet-500/20 active:scale-98 transition-all flex items-center gap-1"
                      >
                        <span>View Stay</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
