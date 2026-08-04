import { useState, useEffect } from 'react';
import { Star, Plus, Edit2, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, Quote, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-rose-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-amber-500', 'bg-cyan-500', 'bg-primary-600',
];

const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const StarRow = ({ rating, interactive = false, onRate }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-3.5 h-3.5 transition-all duration-200 ${
          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-255'
        } ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
        onClick={() => interactive && onRate && onRate(s)}
      />
    ))}
  </div>
);

const statusConfig = {
  approved: { label: 'Approved', variant: 'success' },
  pending:  { label: 'Pending',  variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="truncate">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
            <Quote className="w-5 h-5 text-primary-600 shrink-0" />
            <span className="truncate">Testimonials</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Manage, moderate, and publish guest reviews.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="shadow text-xs flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', icon: MessageSquare },
          { key: 'pending', label: 'Pending', icon: Clock },
          { key: 'approved', label: 'Approved', icon: ShieldCheck },
          { key: 'rejected', label: 'Rejected', icon: X },
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            onClick={() => setFilter(key)}
            className="rounded-full text-xs font-semibold px-4 h-9 flex items-center gap-2 transition-all border border-gray-200"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <Badge
              variant={filter === key ? 'secondary' : 'default'}
              className="ml-0.5 text-[10px] px-1.5 py-0 rounded-full scale-90"
            >
              {counts[key]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary-500" />
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Fetching testimonials...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-20 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <Quote className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-700">No testimonials found</p>
          <p className="text-xs text-gray-400 mt-1">There are no client testimonials in this category.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="text-xs text-slate-600 font-medium">
            Showing <span className="font-bold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-gray-900">{filtered.length}</span> testimonials
          </div>

          {/* Grid of Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginated.map((t) => {
              const cfg = statusConfig[t.isApproved] || statusConfig.pending;
              const initials = getInitials(t.name);               return (
                <Card key={t._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 p-5 text-left relative">
                  {/* Header: Status & Source */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={cfg.variant} className="uppercase text-[9px] font-bold px-2 py-0.5 shrink-0">
                      {cfg.label}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        {t.source === 'user' ? 'User Submit' : 'Admin Created'}
                      </span>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 rounded-full">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-slate-200">
                          <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moderation</DropdownMenuLabel>
                          {t.isApproved !== 'approved' && (
                            <DropdownMenuItem onClick={() => handleApprove(t._id, 'approved')} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                              <Check className="mr-2 h-4 w-4 text-emerald-650" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {t.isApproved !== 'rejected' && (
                            <DropdownMenuItem onClick={() => handleApprove(t._id, 'rejected')} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                              <X className="mr-2 h-4 w-4 text-rose-500" />
                              {t.isApproved === 'approved' ? 'Revoke Approval' : 'Reject'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-slate-100" />
                          <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEdit(t)} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                            <Edit2 className="mr-2 h-4 w-4 text-blue-600" />
                            Edit Testimonial
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            Delete Testimonial
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Message & Rating */}
                  <div className="flex-1 min-h-[60px] space-y-2">
                    <StarRow rating={t.rating} />
                    <p className="text-slate-600 text-xs leading-relaxed italic block break-words">"{t.message}"</p>
                  </div>

                  {/* Author Details */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <div className={`w-8 h-8 rounded-full ${t.color || 'bg-primary-600'} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate" title={t.name}>{t.name}</p>
                      {t.designation && <p className="text-[10px] text-gray-400 font-semibold truncate mt-0.5" title={t.designation}>{t.designation}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 bg-gray-50 p-1 border border-gray-150 rounded-xl w-fit mx-auto">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-xs text-gray-400 font-bold select-none">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => goToPage(page)}
                    className="h-8 w-8 text-xs p-0"
                  >
                    {page}
                  </Button>
                )
              )}

              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showModal} onOpenChange={(open) => !open && setShowModal(false)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
            <DialogDescription>
              Submit custom client details and star metrics.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4 pt-2 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-400">Guest Name *</Label>
                <Input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className="text-slate-900 bg-white border border-gray-200"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-400">Title / Role</Label>
                <Input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm(p => ({ ...p, designation: e.target.value }))}
                  placeholder="e.g. Travel Blogger"
                  className="text-slate-900 bg-white border border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-slate-400">Rating *</Label>
              <div className="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 w-fit">
                <StarRow rating={form.rating} interactive onRate={(s) => setForm(p => ({ ...p, rating: s }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-slate-400">Avatar Color</Label>
              <div className="flex gap-2.5 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full ${c} shadow-sm transition-all duration-200 border-none outline-none ${
                      form.color === c ? 'ring-2 ring-offset-2 ring-primary-600 scale-110' : 'hover:scale-105 cursor-pointer'
                    }`}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs uppercase tracking-wider text-slate-400">Review Message *</Label>
                <span className={`text-[10px] font-bold ${form.message.length > 190 ? 'text-red-500' : 'text-gray-400'}`}>
                  {form.message.length} / 200
                </span>
              </div>
              <Textarea
                required
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
                rows={4}
                maxLength={200}
                placeholder="Guest review text (max 200 characters)..."
                className="text-slate-900 bg-white border border-gray-200 resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                variant="outline"
                className="h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-10 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                {editTarget ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-655">
              <Trash2 className="w-5 h-5" />
              Delete Testimonial?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm text-gray-655 text-left">
            <p className="truncate">
              Are you sure you want to delete <span className="font-bold text-gray-800">{deleteTarget?.name}</span>'s testimonial?
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              onClick={() => setDeleteTarget(null)}
              variant="outline"
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="h-9"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestimonialsManagement;
