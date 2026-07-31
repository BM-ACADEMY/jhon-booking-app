import { useEffect, useState } from 'react';
import { Loader2, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import api from '../../../api';
import { CATEGORY_COLORS, DEFAULT_CAT_FORM } from '../utils';

/** Add / edit a room category (same POST /categories, PUT /categories/:id). */
const CategoryDialog = ({ open, onOpenChange, editTarget, onSaved }) => {
  const [catForm, setCatForm] = useState(DEFAULT_CAT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCatForm(editTarget
      ? {
          name: editTarget.name,
          description: editTarget.description || '',
          color: editTarget.color || 'bg-gray-100 text-gray-700',
          checkInTime: editTarget.checkInTime || '',
          checkOutTime: editTarget.checkOutTime || ''
        }
      : DEFAULT_CAT_FORM);
  }, [open, editTarget]);

  const handleSave = async () => {
    if (!catForm.name.trim()) return toast.error('Category name is required');
    try {
      setSubmitting(true);
      if (editTarget) await api.put(`/categories/${editTarget._id}`, catForm);
      else await api.post('/categories', catForm);
      toast.success('Category saved!');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editTarget ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              value={catForm.name}
              onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Penthouse"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              rows={2}
              value={catForm.description}
              onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
              className="resize-none"
              placeholder="Short description..."
            />
          </div>

          {/* Category Check-in & Check-out Timings */}
          <div className="space-y-2 rounded-xl bg-gray-50 p-3 border border-gray-100">
            <Label className="text-xs font-bold text-gray-800">Category Timings (Check-In & Check-Out)</Label>
            <p className="text-[11px] text-gray-500">
              Optional timing rules for all rooms in this category. Leave empty to use global default settings.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="cat-checkin" className="text-[10px] uppercase font-bold text-gray-500">Check-In</Label>
                <input
                  id="cat-checkin"
                  type="time"
                  value={catForm.checkInTime || ''}
                  onChange={(e) => setCatForm((p) => ({ ...p, checkInTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-primary-500"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-checkout" className="text-[10px] uppercase font-bold text-gray-500">Check-Out</Label>
                <input
                  id="cat-checkout"
                  type="time"
                  value={catForm.checkOutTime || ''}
                  onChange={(e) => setCatForm((p) => ({ ...p, checkOutTime: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Label Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatForm((p) => ({ ...p, color: c }))}
                  className={cn(
                    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 transition-all',
                    c.split(' ')[0], c.split(' ')[1],
                    catForm.color === c ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent'
                  )}
                >
                  <Tag className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryDialog;
