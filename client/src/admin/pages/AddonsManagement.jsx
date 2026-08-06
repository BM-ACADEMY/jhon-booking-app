import { useState, useEffect, useRef } from 'react';
import { Layers, Plus, Trash2, Edit2, Loader2, ImagePlus, X, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const baseUrl = import.meta.env.VITE_BASE_URL && import.meta.env.VITE_BASE_URL !== 'undefined' ? import.meta.env.VITE_BASE_URL : '';

const resolveImage = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${baseUrl}${url}`;
};

const AddonsManagement = () => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/addons');
      setAddons(res.data);
    } catch (err) {
      toast.error('Failed to fetch add-on services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const totalPages = Math.ceil(addons.length / itemsPerPage) || 1;
  const paginatedAddons = addons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [addons.length, totalPages, currentPage]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    setEditingAddon(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (addon) => {
    setEditingAddon(addon);
    setName(addon.name);
    setDescription(addon.description || '');
    setPrice(addon.price);
    setImageFile(null);
    setImagePreview(resolveImage(addon.image));
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImagePreview = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (!price || isNaN(price) || Number(price) < 0) return toast.error('Please enter a valid price');

    if (editingAddon) {
      setShowEditConfirm(true);
    } else {
      performSubmit();
    }
  };

  const performSubmit = async () => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', Number(price));
      if (imageFile) formData.append('image', imageFile);

      if (editingAddon) {
        await api.put(`/addons/${editingAddon._id}`, formData);
        toast.success('Add-on service updated!');
      } else {
        await api.post('/addons', formData);
        toast.success('Add-on service created!');
      }
      setShowModal(false);
      setShowEditConfirm(false);
      resetForm();
      fetchAddons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/addons/${deleteTarget._id}`);
      toast.success('Add-on service deleted successfully');
      setDeleteTarget(null);
      fetchAddons();
    } catch (err) {
      toast.error('Failed to delete add-on service');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl p-3 sm:p-6 mx-auto">
      <Card className="border-gray-200/80 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 flex-shrink-0" />
              Add-on Services Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Create and manage premium services available during checkout</p>
          </div>
          <Button onClick={openAddModal} className="w-full sm:w-auto gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200/80 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : addons.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm sm:text-base">No add-on services found.</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Click "Add Service" to create your first add-on.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[500px] w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-20 sm:w-28 md:w-32 py-3 px-3 sm:px-4">Image</TableHead>
                      <TableHead className="py-3 px-3 sm:px-4">Name</TableHead>
                      <TableHead className="py-3 px-3 sm:px-4">Price</TableHead>
                      <TableHead className="text-right w-16 sm:w-24 py-3 px-3 sm:px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAddons.map((addon) => (
                      <TableRow key={addon._id} className="hover:bg-gray-50/60 transition-colors">
                        <TableCell className="py-2.5 sm:py-3.5 px-3 sm:px-4">
                          {addon.image ? (
                            <img
                              src={resolveImage(addon.image)}
                              alt={addon.name}
                              className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl object-cover border border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shadow-sm">
                              <Layers className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-semibold text-gray-800 text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[240px] md:max-w-[320px] whitespace-nowrap" title={addon.name}>
                          {addon.name}
                        </TableCell>
                        <TableCell className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                          ₹{addon.price.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => openEditModal(addon)} className="gap-2 font-medium cursor-pointer">
                                <Edit2 className="w-4 h-4 text-gray-500" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteTarget(addon)}
                                className="gap-2 font-medium text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Shadcn UI Styled Responsive Pagination Footer */}
              {addons.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                  <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
                    Showing <span className="font-semibold text-gray-800">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, addons.length)}</span> of <span className="font-semibold text-gray-800">{addons.length}</span> entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 gap-1 text-xs font-semibold"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1 text-xs font-bold px-2 text-gray-600">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 gap-1 text-xs font-semibold"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddon ? 'Edit Add-on Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Service Image</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImagePreview}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm cursor-pointer border-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-300 cursor-pointer bg-transparent"
                  >
                    <ImagePlus className="w-6 h-6" />
                  </button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Service Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Breakfast Buffet, Airport Transfer"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this add-on includes..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 500"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-1.5">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingAddon ? 'Save Changes' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditConfirm} onOpenChange={setShowEditConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary-600" />
              Confirm Update
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Save changes to{' '}
            <span className="font-semibold text-gray-800">{editingAddon?.name}</span>?
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowEditConfirm(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={performSubmit} disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Add-on Service
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-800">{deleteTarget?.name}</span>? This will
            also remove its image from storage. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddonsManagement;
