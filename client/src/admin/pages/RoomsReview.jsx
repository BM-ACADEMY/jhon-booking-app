import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, Quote, ChevronLeft, ChevronRight, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const SERVER_URL = import.meta.env.VITE_BASE_URL;

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-cyan-100 text-cyan-700',
];

const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const StarRow = ({ rating, interactive = false, onRate }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-4 h-4 transition-all duration-300 ${
          s <= rating ? 'fill-[#FBBF24] text-[#FBBF24]' : 'text-gray-200'
        } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
        onClick={() => interactive && onRate && onRate(s)}
      />
    ))}
  </div>
);

const PAGE_SIZE = 10;

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
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const reviewRes = await api.get('/reviews/admin');
      setReviews(reviewRes.data);

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
        headers: { 'Content-Type': 'multipart/form-data' }
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
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 font-sans">
      <div className="max-w-8xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Reviews Management</h1>
            <p className="text-sm text-gray-500 mt-1">Moderate and publish guest feedback seamlessly.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Custom Review
          </button>
        </div>

        {/* Filter Tabs - Pill Design */}
        <div className="flex gap-3 flex-wrap border-b border-gray-200 pb-4">
          {[
            { key: 'all', label: 'All Reviews', icon: MessageSquare },
            { key: 'pending', label: 'Pending', icon: Clock },
            { key: 'approved', label: 'Approved', icon: ShieldCheck },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-white border border-gray-100 rounded-3xl shadow-sm">
            <Quote className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">No reviews found in this category.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="text-gray-900">{filtered.length}</span> reviews
            </div>

            {/* Grid of Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.map((rev, index) => {
                const initials = getInitials(rev.userName);
                const avatarCol = AVATAR_COLORS[index % AVATAR_COLORS.length];

                return (
                  <div key={rev._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5 group">

                    {/* Header: User & Status */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarCol} flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{rev.userName}</h3>
                          <p className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        rev.verified
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {rev.verified ? 'Published' : 'Pending'}
                      </span>
                    </div>

                    {/* Room Category */}
                    <div>
                      <p className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider mb-1">{rev.room?.category || 'Room'}</p>
                      <h4 className="text-md font-medium text-gray-900 truncate">{rev.room?.name || 'Deleted Room'}</h4>
                    </div>

                    {/* Comment & Overall Rating */}
                    <div className="flex-1">
                      <div className="mb-3"><StarRow rating={rev.rating} /></div>
                      <p className="text-gray-600 text-sm leading-relaxed italic line-clamp-3">"{rev.comment}"</p>
                    </div>

                    {/* Sub-ratings Grid */}
                    <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Communication</span>
                        <StarRow rating={rev.ratings?.communication || 5} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Cleanliness</span>
                        <StarRow rating={rev.ratings?.cleanliness || 5} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Comfort</span>
                        <StarRow rating={rev.ratings?.comfort || 5} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Facilities</span>
                        <StarRow rating={rev.ratings?.facilities || 5} />
                      </div>
                    </div>

                    {/* Images */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {rev.images.map((imgUrl, imgIdx) => (
                          <div key={imgIdx} className="w-12 h-12 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
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

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                      <button
                        onClick={() => handleToggleVerify(rev._id, rev.verified)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          rev.verified
                            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {rev.verified ? <><X className="w-4 h-4" /> Unpublish</> : <><Check className="w-4 h-4" /> Approve</>}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(rev)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-3 text-gray-400">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Custom Review Modal - Glassmorphism Style */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-lg">Create Custom Review</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleCreateOwnReview} className="space-y-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Room select */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Select Room</label>
                      <select
                        required
                        value={form.roomId}
                        onChange={(e) => setForm(p => ({ ...p, roomId: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                      >
                        <option value="">-- Choose --</option>
                        {rooms.map(room => (
                          <option key={room._id} value={room._id}>{room.name} ({room.category})</option>
                        ))}
                      </select>
                    </div>

                    {/* Reviewer Name */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2">Reviewer Name</label>
                      <input
                        type="text"
                        required
                        value={form.userName}
                        onChange={(e) => setForm(p => ({ ...p, userName: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Review Comment</label>
                    <textarea
                      required
                      value={form.comment}
                      onChange={(e) => setForm(p => ({ ...p, comment: e.target.value }))}
                      rows={3}
                      placeholder="Write the review here..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Category Ratings */}
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Category Ratings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                      {['communication', 'cleanliness', 'comfort', 'facilities'].map((cat) => (
                        <div key={cat} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">{cat}</span>
                          <StarRow
                            rating={form[cat]}
                            interactive={true}
                            onRate={(val) => setForm(p => ({ ...p, [cat]: val }))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photo Uploads */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Upload Photos</label>
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#4F46E5] bg-gray-50 rounded-xl p-8 transition-all flex flex-col items-center justify-center cursor-pointer relative group">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[#4F46E5] transition-colors mb-3" />
                      <p className="text-sm text-gray-600 font-medium text-center">Click or drag images to upload</p>
                      <p className="text-xs text-gray-400 mt-1 text-center">Supports PNG, JPG, JPEG, WEBP</p>
                    </div>

                    {previews.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto mt-4 pb-2">
                        {previews.map((src, i) => (
                          <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </form>
              </div>

              {/* Submit Buttons */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOwnReview}
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? 'Creating...' : 'Create Review'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xl">Delete Review?</h3>
                <p className="text-sm text-gray-500 mt-2">This action cannot be undone. Are you sure you want to delete this review by <span className="font-medium text-gray-800">{deleteTarget.userName}</span>?</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoomsReview;
