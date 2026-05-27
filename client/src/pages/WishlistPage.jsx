import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, BedDouble, ArrowRight, Star, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { getRoomSlug } from '../api';

const SERVER_URL = import.meta.env.VITE_BASE_URL ;

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
    
    // Save original state for rollback
    const originalWishlistRooms = [...wishlistRooms];
    
    // Optimistically remove the room from the screen immediately
    setWishlistRooms((prev) => prev.filter((room) => room._id !== roomId));
    
    const success = await toggleUserWishlist(roomId);
    if (!success) {
      // Roll back to the original list on failure
      setWishlistRooms(originalWishlistRooms);
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
              const detailLink = `/rooms/${getRoomSlug(room.name)}`;

              return (
                <Link
                  key={room._id}
                  to={detailLink}
                  className="group bg-transparent rounded-none border-none outline-none flex flex-col hover:-translate-y-1 transition-all duration-300 text-left"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-150 shadow-sm">
                    {room.images && room.images.length > 0 ? (
                      <img 
                        src={getImageUrl(room.images[0])} 
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <BedDouble className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Wishlist Heart Icon Floating Top-Right */}
                    <button 
                      onClick={(e) => handleRemoveWishlist(e, room._id)}
                      className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white hover:scale-105 shadow-md active:scale-95 transition-all flex items-center justify-center cursor-pointer border-none outline-none"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500 transition-colors" />
                    </button>

                    {/* Premium Price Tag Badge Floating Bottom-Right */}
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
                      {[room.city, room.country].filter(Boolean).join(', ') || 'Serenity Beach, India'}
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
    </div>
  );
};

export default WishlistPage;
