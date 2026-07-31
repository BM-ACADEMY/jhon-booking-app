import { useState, useEffect, useRef } from 'react';
import { Layers, Plus, Trash2, Edit2, Utensils, Bell, Car, Sparkles, Heart, Loader2, ImagePlus, X } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const categoryIcons = {
  'food': Utensils,
  'room services': Bell,
  'transport': Car,
  'Special Arrangements': Sparkles,
  'Guest Services': Heart,
};

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

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [iconType, setIconType] = useState('food');
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

  const resetForm = () => {
    setName('');
    setPrice('');
    setIconType('food');
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
    setPrice(addon.price);
    setIconType(addon.iconType);
    setImageFile(null);
    setImagePreview(resolveImage(addon.image));
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      formData.append('price', Number(price));
      formData.append('iconType', iconType);
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
    <div className="space-y-6 max-w-6xl p-4 sm:p-6">
      <Card>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary-500" />
              Add-on Services Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage premium services available during checkout</p>
          </div>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : addons.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No add-on services found.</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add Service" to create your first add-on.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addons.map((addon) => {
                  const IconComponent = categoryIcons[addon.iconType] || Layers;
                  return (
                    <TableRow key={addon._id}>
                      <TableCell>
                        {addon.image ? (
                          <img
                            src={resolveImage(addon.image)}
                            alt={addon.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                            <IconComponent className="w-5 h-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-800">{addon.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <IconComponent className="w-3.5 h-3.5" />
                          {addon.iconType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-gray-900">
                        ₹{addon.price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditModal(addon)} title="Edit Service">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setDeleteTarget(addon)}
                            title="Delete Service"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category & Icon</Label>
              <Select value={iconType} onValueChange={setIconType}>
                <SelectTrigger className="focus:ring-0 focus:ring-offset-0 focus:border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food & Dining (Utensils)</SelectItem>
                  <SelectItem value="room services">Room Service (Bell)</SelectItem>
                  <SelectItem value="transport">Transport / Travel (Car)</SelectItem>
                  <SelectItem value="Special Arrangements">Special Arrangements (Sparkles)</SelectItem>
                  <SelectItem value="Guest Services">Guest Services (Heart)</SelectItem>
                </SelectContent>
              </Select>
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
