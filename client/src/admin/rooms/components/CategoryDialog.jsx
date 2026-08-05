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
