import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '../../../api';

/** Create / edit a price unit (POST /price-units, PUT /price-units/:id). */
const PriceUnitDialog = ({ open, onOpenChange, editTarget, onSaved }) => {
  const [unitForm, setUnitForm] = useState({ name: '', label: '' });

  useEffect(() => {
    if (!open) return;
    setUnitForm(editTarget ? { name: editTarget.name, label: editTarget.label } : { name: '', label: '' });
  }, [open, editTarget]);

  const handleSave = async () => {
    if (!unitForm.name.trim() || !unitForm.label.trim()) return;
    try {
      if (editTarget) {
        await api.put(`/price-units/${editTarget._id}`, unitForm);
        toast.success('Price unit updated');
      } else {
        await api.post('/price-units', unitForm);
        toast.success('Price unit added');
      }
      onOpenChange(false);
      onSaved?.(unitForm);
    } catch (err) {
      toast.error('Error saving price unit');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editTarget ? 'Edit Price Unit' : 'New Price Unit'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="unit-label">Display Label</Label>
            <Input
              id="unit-label"
              value={unitForm.label}
              onChange={(e) => setUnitForm((p) => ({
                ...p,
                label: e.target.value,
                name: e.target.value.toLowerCase().replace(/\s+/g, '-'),
              }))}
              placeholder="e.g. Per Stay"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">System Identifier</Label>
            <Input
              id="unit-name"
              value={unitForm.name}
              readOnly
              className="cursor-not-allowed bg-gray-100 text-gray-400"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
            Save Unit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PriceUnitDialog;
