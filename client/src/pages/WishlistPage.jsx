import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, BedDouble, ArrowRight, Star, MapPin, Users, Bath, Maximize, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
    const updatedRooms = wishlistRooms.filter((room) => room._id !== roomId);
    setWishlistRooms(updatedRooms);
    
    const success = await toggleUserWishlist(roomId);
    if (!success) {
      // Roll back to the original list on failure
      setWishlistRooms(originalWishlistRooms);
    } else {
      // Adjust current page if necessary
      const newTotalPages = Math.ceil(updatedRooms.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRooms = wishlistRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(wishlistRooms.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
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
          <>
            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentRooms.map((room) => {
                const detailLink = `/rooms/${getRoomSlug(room.name)}`;

                return (
                  <Link
                    key={room._id}
                    to={detailLink}
                    className="group bg-white rounded-[32px] border border-gray-100 p-3 flex flex-col shadow-xl hover:border-gray-200/80 transition-all duration-350 text-left"
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
                      <div className="absolute bottom-4 right-4 z-10 bg-black/70 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full tracking-wide flex items-center gap-1.5 shadow-sm">
                        <span className="font-bold mr-1">₹{room.price?.toLocaleString('en-IN')}</span>
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
                        {room.address || `${[room.city, room.country].filter(Boolean).join(', ') || 'Serenity Beach, India'}`}
                      </p>
                      <div className="flex items-center gap-1.5 mb-3">
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
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-100 px-6 py-4 rounded-3xl shadow-sm gap-4">
                <div className="flex flex-1 justify-between w-full sm:hidden">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between w-full">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-900">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-bold text-gray-900">
                        {Math.min(indexOfLastItem, wishlistRooms.length)}
                      </span>{' '}
                      of <span className="font-bold text-gray-900">{wishlistRooms.length}</span> stays
                    </p>
                  </div>
                  <div>
                    <nav className="flex items-center gap-2" aria-label="Pagination">
                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:scale-100 shadow-sm transition-all"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-black transition-all active:scale-95 ${
                            currentPage === pageNum
                              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700'
                              : 'text-gray-700 border border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200 shadow-sm'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-200 active:scale-95 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-100 disabled:scale-100 shadow-sm transition-all"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
