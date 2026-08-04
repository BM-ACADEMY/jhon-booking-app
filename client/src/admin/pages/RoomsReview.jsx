import { useState, useEffect } from 'react';
import { Star, Plus, Trash2, Check, X, Loader2, MessageSquare, Clock, ShieldCheck, Quote, ChevronLeft, ChevronRight, UploadCloud, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

// Shadcn UI Imports
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const SERVER_URL = import.meta.env.VITE_BASE_URL;

const getImageUrl = (img) => {
  const u = img?.url || img;
  if (!u || typeof u !== 'string') return null;
  return u.startsWith('http') ? u : `${SERVER_URL}${u}`;
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
];

const getInitials = (name) =>
  name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const StarRow = ({ rating, interactive = false, onRate }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-3.5 h-3.5 transition-all duration-200 ${
          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-250'
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
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="truncate">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 truncate">
            <MessageSquare className="w-5 h-5 text-primary-600 shrink-0" />
            <span className="truncate">Reviews Management</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Moderate and publish guest feedback seamlessly.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="shadow text-xs flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Custom Review
        </Button>
      </div>

      {/* Filter Tabs - Pill Design */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Reviews', icon: MessageSquare },
          { key: 'pending', label: 'Pending', icon: Clock },
          { key: 'approved', label: 'Approved', icon: ShieldCheck },
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
          <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Fetching reviews...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-20 bg-white border border-gray-200 shadow-sm rounded-2xl">
          <Quote className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-semibold text-gray-700">No reviews found</p>
          <p className="text-xs text-gray-400 mt-1">There are no testimonials or reviews in this category.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="text-xs text-slate-600 font-medium">
            Showing <span className="font-bold text-gray-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-gray-900">{filtered.length}</span> reviews
          </div>

          {/* Grid of Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginated.map((rev, index) => {
              const initials = getInitials(rev.userName);
              const avatarCol = AVATAR_COLORS[index % AVATAR_COLORS.length];

              return (
                <Card key={rev._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 p-5 text-left relative">
                  {/* Header: User & Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full ${avatarCol} border flex items-center justify-center text-xs font-bold shrink-0`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate" title={rev.userName}>{rev.userName}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={rev.verified ? 'success' : 'warning'} className="uppercase text-[9px] font-bold px-2 py-0.5">
                        {rev.verified ? 'Published' : 'Pending'}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 rounded-full">
                            <MoreHorizontal className="h-4 w-4 text-slate-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-slate-200">
                          <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moderation</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleToggleVerify(rev._id, rev.verified)} className="cursor-pointer text-slate-800 focus:bg-slate-100">
                            {rev.verified ? (
                              <>
                                <X className="mr-2 h-4 w-4 text-rose-500" />
                                Unpublish Review
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4 text-emerald-600" />
                                Approve Review
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100" />
                          <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setDeleteTarget(rev)} className="cursor-pointer text-red-655 focus:bg-red-50 focus:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            Delete Review
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Room Category */}
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest truncate">{rev.room?.category || 'Room'}</p>
                    <h4 className="text-sm font-bold text-gray-900 truncate" title={rev.room?.name || 'Deleted Room'}>{rev.room?.name || 'Deleted Room'}</h4>
                  </div>

                  {/* Comment & Overall Rating */}
                  <div className="flex-1 min-h-[60px]">
                    <div className="mb-2"><StarRow rating={rev.rating} /></div>
                    <p className="text-slate-600 text-xs leading-relaxed italic block break-words">"{rev.comment}"</p>
                  </div>

                  {/* Sub-ratings Grid */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Communication</span>
                      <StarRow rating={rev.ratings?.communication || 5} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Cleanliness</span>
                      <StarRow rating={rev.ratings?.cleanliness || 5} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Comfort</span>
                      <StarRow rating={rev.ratings?.comfort || 5} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">Facilities</span>
                      <StarRow rating={rev.ratings?.facilities || 5} />
                    </div>
                  </div>

                  {/* Images */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rev.images.map((imgUrl, imgIdx) => (
                        <div key={imgIdx} className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-85 transition-opacity shrink-0">
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

      {/* Custom Review Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && setShowModal(false)}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Review</DialogTitle>
            <DialogDescription>
              Create a custom client review directly from the administrator console.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOwnReview} className="space-y-4 pt-2 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Room select */}
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-400">Select Room</Label>
                <Select value={form.roomId} onValueChange={(val) => setForm(p => ({ ...p, roomId: val }))}>
                  <SelectTrigger className="h-10 bg-white text-slate-900 border border-gray-200">
                    <SelectValue placeholder="-- Choose --" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room._id} value={room._id}>
                        {room.name} ({room.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reviewer Name */}
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wider text-slate-400">Reviewer Name</Label>
                <Input
                  type="text"
                  required
                  value={form.userName}
                  onChange={(e) => setForm(p => ({ ...p, userName: e.target.value }))}
                  placeholder="John Doe"
                  className="text-slate-900 bg-white border border-gray-200"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-slate-400">Review Comment</Label>
              <Textarea
                required
                value={form.comment}
                onChange={(e) => setForm(p => ({ ...p, comment: e.target.value }))}
                rows={3}
                placeholder="Write the review here..."
                className="text-slate-900 bg-white border border-gray-200 resize-none"
              />
            </div>

            {/* Category Ratings */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category Ratings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                {['communication', 'cleanliness', 'comfort', 'facilities'].map((cat) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 capitalize">{cat}</span>
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
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-slate-400">Upload Photos</Label>
              <div className="border-2 border-dashed border-gray-200 hover:border-primary-500 bg-slate-50/50 rounded-xl p-6 transition-all flex flex-col items-center justify-center cursor-pointer relative group">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-7 h-7 text-gray-400 group-hover:text-primary-500 transition-colors mb-2" />
                <p className="text-xs text-gray-600 font-bold text-center">Click or drag images to upload</p>
                <p className="text-[10px] text-gray-400 mt-0.5 text-center">Supports PNG, JPG, JPEG, WEBP</p>
              </div>

              {previews.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                  {previews.map((src, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm shrink-0">
                      <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
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
                onClick={handleCreateOwnReview}
                disabled={submitting}
                className="h-10 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                {submitting ? 'Creating...' : 'Create Review'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-650">
              <Trash2 className="w-5 h-5" />
              Delete Review?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-sm text-gray-600 text-left">
            <p className="truncate">
              Are you sure you want to delete this review by <span className="font-bold text-gray-800">{deleteTarget?.userName}</span>?
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

export default RoomsReview;
