import { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

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
          s <= rating ? 'fill-primary-400 text-primary-400' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-primary-300' : ''}`}
        onClick={() => interactive && onRate && onRate(s)}
      />
    ))}
  </div>
);

const statusConfig = {
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:  { label: 'Pending',  cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  rejected: { label: 'Rejected', cls: 'bg-red-50    text-red-700    border-red-200'    },
};

const EMPTY_FORM = { name: '', designation: '', message: '', rating: 5, color: AVATAR_COLORS[0] };
const PAGE_SIZE = 9;

const TestimonialsManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get('/testimonials/all');
      setTestimonials(res.data);
    } catch (err) {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Reset to page 1 when filter changes
  useEffect(() => { setCurrentPage(1); }, [filter]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (t) => {
    setEditTarget(t);
    setForm({ name: t.name, designation: t.designation , message: t.message, rating: t.rating, color: t.color || AVATAR_COLORS[0] });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Name and message are required.');
      return;
    }
    try {
      setSubmitting(true);
      if (editTarget) {
        await api.put(`/testimonials/${editTarget._id}`, form);
        toast.success('Testimonial updated!');
      } else {
        await api.post('/testimonials', form);
        toast.success('Testimonial created!');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.patch(`/testimonials/${id}/approve`, { status });
      toast.success(status === 'approved' ? 'Testimonial approved!' : 'Testimonial rejected.');
      fetchAll();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/testimonials/${deleteTarget._id}`);
      toast.success('Testimonial deleted');
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      toast.error('Failed to delete testimonial');
    }
  };

  const counts = {
    all: testimonials.length,
    pending: testimonials.filter(t => t.isApproved === 'pending').length,
    approved: testimonials.filter(t => t.isApproved === 'approved').length,
    rejected: testimonials.filter(t => t.isApproved === 'rejected').length,
  };

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.isApproved === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Generate page numbers with ellipsis
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
          <h1 className="text-xl font-black text-gray-900">Testimonials</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and approve guest reviews</p>
        </div>
        <button
          onClick={openCreate}
          className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All', icon: MessageSquare },
          { key: 'pending', label: 'Pending', icon: Clock },
          { key: 'approved', label: 'Approved', icon: ShieldCheck },
          { key: 'rejected', label: 'Rejected', icon: X },
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
        <div className="text-center py-20 text-gray-400">
          <Quote className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No testimonials found for this filter.</p>
        </div>
      ) : (
        <>
          {/* Result count */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing <span className="font-bold text-gray-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-gray-700">{filtered.length}</span> testimonials
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((t) => {
              const cfg = statusConfig[t.isApproved] || statusConfig.pending;
              const initials = getInitials(t.name);
              return (
                <div key={t._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                  {/* Status badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${cfg.cls}`}>{cfg.label}</span>
                    <span className="text-[10px] text-gray-400">{t.source === 'user' ? 'User Submission' : 'Admin Created'}</span>
                  </div>

                  {/* Message */}
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">"{t.message}"</p>
                  <StarRow rating={t.rating} />

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                    <div className={`w-9 h-9 rounded-full ${t.color || 'bg-primary-500'} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold text-sm truncate">{t.name}</p>
                      {t.designation && <p className="text-gray-400 text-[10px] uppercase tracking-wide">{t.designation}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {t.isApproved === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(t._id, 'approved')}
                          className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all border border-emerald-200"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleApprove(t._id, 'rejected')}
                          className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all border border-red-200"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {t.isApproved === 'rejected' && (
                      <button
                        onClick={() => handleApprove(t._id, 'approved')}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all border border-emerald-200"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}
                    {t.isApproved === 'approved' && (
                      <button
                        onClick={() => handleApprove(t._id, 'rejected')}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-all border border-red-200"
                      >
                        <X className="w-3.5 h-3.5" /> Revoke
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(t)}
                      className="cursor-pointer p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-gray-900 text-lg">{editTarget ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Guest name"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title / Role</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))}
                  placeholder="e.g. Travel Blogger"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Rating *</label>
              <StarRow rating={form.rating} interactive onRate={(s) => setForm(p => ({ ...p, rating: s }))} />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`cursor-pointer w-7 h-7 rounded-full ${c} transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Review *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                rows={4}
                placeholder="Guest review text..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="cursor-pointer flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editTarget ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-gray-900">Delete Testimonial?</h3>
            <p className="text-sm text-gray-500">This will permanently remove <span className="font-bold text-gray-700">{deleteTarget.name}</span>'s review.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="cursor-pointer flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all"
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

export default TestimonialsManagement;
