import { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-rose-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-[#4F46E5]',
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

const statusConfig = {
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  pending:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
};

const EMPTY_FORM = { name: '', designation: '', message: '', rating: 5, color: AVATAR_COLORS[0] };
const PAGE_SIZE = 10;

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
  useEffect(() => { setCurrentPage(1); }, [filter]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setShowModal(true); };

  const openEdit = (t) => {
    setEditTarget(t);
    setForm({
      name: t.name,
      designation: t.designation || '',
      message: t.message,
      rating: t.rating,
      color: t.color || AVATAR_COLORS[0]
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast.error('Name and message are required.');
      return;
    }
    if (form.message.length > 200) {
      toast.error('Message must be 200 characters or less.');
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
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Testimonials</h1>
            <p className="text-sm text-gray-500 mt-1">Manage, moderate, and publish guest reviews.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 flex-wrap border-b border-gray-200 pb-4">
          {[
            { key: 'all', label: 'All', icon: MessageSquare },
            { key: 'pending', label: 'Pending', icon: Clock },
            { key: 'approved', label: 'Approved', icon: ShieldCheck },
            { key: 'rejected', label: 'Rejected', icon: X },
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
            <p className="text-gray-500 font-medium">No testimonials found in this category.</p>
          </div>
        ) : (
          <>
            {/* Result count */}
            <div className="text-sm text-gray-500 font-medium">
              Showing <span className="text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="text-gray-900">{filtered.length}</span> testimonials
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.map((t) => {
                const cfg = statusConfig[t.isApproved] || statusConfig.pending;
                const initials = getInitials(t.name);

                return (
                  <div key={t._id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-5">

                    {/* Header: Status & Source */}
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">
                        {t.source === 'user' ? 'User Submission' : 'Admin Created'}
                      </span>
                    </div>

                    {/* Message & Rating */}
                    <div className="flex-1 space-y-3">
                      <StarRow rating={t.rating} />
                      <p className="text-gray-600 text-sm leading-relaxed italic line-clamp-3">"{t.message}"</p>
                    </div>

                    {/* Author Details */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className={`w-10 h-10 rounded-full ${t.color || 'bg-[#4F46E5]'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-inner`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-semibold text-sm truncate">{t.name}</p>
                        {t.designation && <p className="text-gray-500 text-xs truncate mt-0.5">{t.designation}</p>}
                      </div>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1 mt-auto">
                      {t.isApproved === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(t._id, 'approved')}
                            className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-medium rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleApprove(t._id, 'rejected')}
                            className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}

                      {t.isApproved === 'rejected' && (
                        <button
                          onClick={() => handleApprove(t._id, 'approved')}
                          className="col-span-4 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-sm font-medium rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                      )}

                      {t.isApproved === 'approved' && (
                        <button
                          onClick={() => handleApprove(t._id, 'rejected')}
                          className="col-span-4 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" /> Revoke Approval
                        </button>
                      )}

                      {/* Edit & Delete (Shared across all states, pushed to a new row if buttons above exist) */}
                      <div className="col-span-4 flex gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="flex-1 flex justify-center items-center py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="flex-1 flex justify-center items-center py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

        {/* Create/Edit Modal - Glassmorphism Style */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-lg">{editTarget ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Guest Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Title / Role</label>
                    <input
                      type="text"
                      value={form.designation}
                      onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))}
                      placeholder="e.g. Travel Blogger"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Rating *</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-fit">
                    <StarRow rating={form.rating} interactive onRate={(s) => setForm(p => ({ ...p, rating: s }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-3">Avatar Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm(p => ({ ...p, color: c }))}
                        className={`w-8 h-8 rounded-full ${c} shadow-sm transition-all duration-200 ${
                          form.color === c ? 'ring-2 ring-offset-2 ring-[#4F46E5] scale-110' : 'hover:scale-105'
                        }`}
                        type="button"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-gray-600">Review Message *</label>
                    <span className={`text-xs font-medium ${form.message.length > 190 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {form.message.length} / 200
                    </span>
                  </div>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={4}
                    maxLength={200}
                    placeholder="Guest review text (max 200 characters)..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all resize-none"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editTarget ? 'Save Changes' : 'Create'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xl">Delete Testimonial?</h3>
                <p className="text-sm text-gray-500 mt-2">This will permanently remove <span className="font-medium text-gray-800">{deleteTarget.name}</span>'s review. This action cannot be undone.</p>
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
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-rose-500/20"
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

export default TestimonialsManagement;
