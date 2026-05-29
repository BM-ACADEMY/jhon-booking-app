import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, Quote, ChevronLeft, ChevronRight, UploadCloud, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const SERVER_URL = import.meta.env.VITE_BASE_URL;

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-rose-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-primary-500',
];

const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const StarRow = ({ rating, interactive = false, onRate }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-4 h-4 transition-colors ${
          s <= rating ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={() => interactive && onRate && onRate(s)}
      />
    ))}
  </div>
);

const PAGE_SIZE = 9;

const EMPTY_FORM = {
  roomId: '',
  userName: '',
  comment: '',
  communication: 5,
  cleanliness: 5,
  comfort: 5,
  facilities: 5
};

const RoomsReview = () => {
  const [reviews, setReviews] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Fetch admin reviews
      const reviewRes = await api.get('/reviews/admin');
      setReviews(reviewRes.data);

      // Fetch rooms for custom review dropdown
      const roomRes = await api.get('/rooms');
      setRooms(roomRes.data);
    } catch (err) {
      toast.error('Failed to load review data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setSelectedFiles([]);
    setPreviews([]);
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const filePreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(filePreviews);
  };

  const handleCreateOwnReview = async (e) => {
    e.preventDefault();
    if (!form.roomId || !form.userName.trim() || !form.comment.trim()) {
      toast.error('Room, name, and comment are required.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('roomId', form.roomId);
      formData.append('userName', form.userName);
      formData.append('comment', form.comment);
      formData.append('communication', form.communication);
      formData.append('cleanliness', form.cleanliness);
      formData.append('comfort', form.comfort);
      formData.append('facilities', form.facilities);

      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await api.post('/reviews/admin/own', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Admin custom review added!');
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVerify = async (reviewId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await api.put(`/reviews/${reviewId}/verify`, { verified: newStatus });
      toast.success(newStatus ? 'Review approved and published!' : 'Review unverified/hidden');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to update verification state');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/reviews/${deleteTarget._id}`);
      toast.success('Review permanently deleted');
      setDeleteTarget(null);
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete review');
      console.error(err);
    }
  };

  // Filter & Pagination Calculations
  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => !r.verified).length,
    approved: reviews.filter(r => r.verified).length,
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.verified;
    if (filter === 'approved') return r.verified;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Rooms Review Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Approve, moderate, and publish guest stay feedback</p>
        </div>
        <button
          onClick={openCreateModal}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> Add Admin Review
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All Reviews', icon: MessageSquare },
          { key: 'pending', label: 'Pending Approval', icon: Clock },
          { key: 'approved', label: 'Approved', icon: ShieldCheck },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              filter === key
                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/20'
                : 'bg-white text-gray-500 border-gray-200 hover:border-primary-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-10">
          <Quote className="w-10 h-10 mx-auto mb-3 text-gray-300 opacity-60" />
          <p className="text-sm text-gray-400 font-bold">No reviews found matching this filter.</p>
        </div>
      ) : (
        <>
          {/* Result Count */}
          <div className="text-xs text-gray-500">
            Showing <span className="font-bold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-gray-700">{filtered.length}</span> reviews
          </div>

          {/* Grid of Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {paginated.map((rev, index) => {
              const initials = getInitials(rev.userName);
              const avatarCol = AVATAR_COLORS[index % AVATAR_COLORS.length];
              return (
                <div key={rev._id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                  {/* Top Badge Info */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      rev.verified 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {rev.verified ? 'Verified & Published' : 'Pending Verification'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {rev.booking ? 'Guest Stay' : 'Admin custom'}
                    </span>
                  </div>

                  {/* Room Category/Name */}
                  <div>
                    <h3 className="text-xs font-black text-primary-600 uppercase tracking-widest">{rev.room?.category || 'Room'}</h3>
                    <h2 className="text-sm font-black text-gray-950 truncate">{rev.room?.name || 'Deleted Room'}</h2>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line line-clamp-3">"{rev.comment}"</p>

                  {/* Individual Scores Display */}
                  <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>COMMUNICATION: {rev.ratings?.communication || 5}</span>
                      <span>CLEANLINESS: {rev.ratings?.cleanliness || 5}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>COMFORT: {rev.ratings?.comfort || 5}</span>
                      <span>FACILITIES: {rev.ratings?.facilities || 5}</span>
                    </div>
                  </div>

                  {/* Overall Rating & Photo Thumbnails */}
                  <div className="flex items-center justify-between">
                    <StarRow rating={rev.rating} />
                    <span className="text-xs text-gray-400 font-bold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Image Thumbnails */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rev.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer shadow-sm hover:scale-105 transition-all">
                          <img
                            src={getImageUrl(imgUrl)}
                            alt="Guest upload"
                            className="w-full h-full object-cover"
                            onClick={() => window.open(getImageUrl(imgUrl), '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User Profile */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    <div className={`w-9 h-9 rounded-full ${avatarCol} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-sm truncate">{rev.userName}</p>
                      {rev.user?.email && <p className="text-gray-400 text-[10px] truncate">{rev.user.email}</p>}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleToggleVerify(rev._id, rev.verified)}
                      className={`cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all border ${
                        rev.verified
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {rev.verified ? (
                        <>
                          <X className="w-3.5 h-3.5" /> Unverify
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(rev)}
                      className="cursor-pointer p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-200 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="cursor-pointer p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-primary-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-sm font-bold">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`cursor-pointer w-9 h-9 rounded-xl text-xs font-black transition-all border ${
                      currentPage === page
                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/25'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-primary-300'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="cursor-pointer p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-primary-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Custom Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg">Add Custom Room Review</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateOwnReview} className="space-y-5">
              {/* Room select */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Select Room *</label>
                <select
                  required
                  value={form.roomId}
                  onChange={(e) => setForm(p => ({ ...p, roomId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map(room => (
                    <option key={room._id} value={room._id}>{room.name} ({room.category})</option>
                  ))}
                </select>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Reviewer Name *</label>
                <input
                  type="text"
                  required
                  value={form.userName}
                  onChange={(e) => setForm(p => ({ ...p, userName: e.target.value }))}
                  placeholder="Anonymous or custom user name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                />
              </div>

              {/* Category Ratings */}
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category Ratings</h3>
                
                {/* Communication */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                  <span className="text-sm font-bold text-gray-700">Communication</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, communication: star }))}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= form.communication ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                  <span className="text-sm font-bold text-gray-700">Cleanliness</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, cleanliness: star }))}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= form.cleanliness ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comfort */}
                <div className="flex items-center justify-between py-2 border-b border-gray-100/50">
                  <span className="text-sm font-bold text-gray-700">Comfort</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, comfort: star }))}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= form.comfort ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facilities */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold text-gray-700">Facilities</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, facilities: star }))}
                        className="p-0.5 hover:scale-110 active:scale-95 transition-all text-[#FCE83A] focus:outline-none cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= form.facilities ? 'fill-[#FCE83A] text-[#FCE83A]' : 'text-gray-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Review Comment *</label>
                <textarea
                  required
                  value={form.comment}
                  onChange={(e) => setForm(p => ({ ...p, comment: e.target.value }))}
                  rows={3}
                  placeholder="Review comments..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Photo Uploads */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upload Room Photos</label>
                <div className="border-2 border-dashed border-gray-200 hover:border-primary-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center bg-gray-50/50 cursor-pointer relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors mb-2" />
                  <p className="text-xs text-gray-500 font-bold text-center">Click or drag images to upload</p>
                  <p className="text-[10px] text-gray-400 font-medium text-center mt-1">Supports PNG, JPG, JPEG, WEBP</p>
                </div>
                
                {previews.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto py-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                        <img src={src} alt="Upload Preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6 text-center space-y-4 relative z-10 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-gray-900 text-lg">Delete Review?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">This will permanently delete the review by <span className="font-bold text-gray-700">{deleteTarget.userName}</span> from this room.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="cursor-pointer flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsReview;
