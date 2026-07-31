import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import api from '../../../api';

/** Settings tab: price unit CRUD + category CRUD (same endpoints as before). */
const SettingsPanel = ({
  priceUnits = [], categories = [],
  onAddUnit, onEditUnit, onUnitsChanged,
  onAddCategory, onEditCategory, onDeleteCategory,
}) => {
  const [deleteUnitTarget, setDeleteUnitTarget] = useState(null);

  const handleDeleteUnit = async () => {
    try {
      await api.delete(`/price-units/${deleteUnitTarget._id}`);
      toast.success('Deleted');
      setDeleteUnitTarget(null);
      onUnitsChanged?.();
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Price Units</CardTitle>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Manage billing cycles (nightly, hourly, etc.)
            </p>
          </div>
          <Button size="icon" variant="outline" onClick={onAddUnit} title="Add price unit">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {priceUnits.map((u) => (
              <div
                key={u._id}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div>
                  <span className="text-sm font-bold text-gray-700">{u.label}</span>
                  <p className="text-[9px] font-bold uppercase italic text-gray-400">{u.name}</p>
                </div>
                <div className="flex gap-2 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEditUnit(u)}
                    className="cursor-pointer rounded-lg bg-white p-1.5 text-blue-500 shadow-sm hover:text-blue-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteUnitTarget(u)}
                    className="cursor-pointer rounded-lg bg-white p-1.5 text-red-500 shadow-sm hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {priceUnits.length === 0 && (
              <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                No price units configured.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Room Categories</CardTitle>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Manage major groupings and display colors
            </p>
          </div>
          <Button size="icon" variant="outline" onClick={onAddCategory} title="Add category">
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <div
                key={c._id}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('h-3 w-3 rounded-full', c.color?.split(' ')[0] || 'bg-gray-400')} />
                  <span className="text-sm font-bold text-gray-700">{c.name}</span>
                </div>
                <div className="flex gap-2 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEditCategory(c)}
                    className="cursor-pointer rounded-lg bg-white p-1.5 text-blue-500 shadow-sm hover:text-blue-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCategory(c)}
                    className="cursor-pointer rounded-lg bg-white p-1.5 text-red-500 shadow-sm hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                No categories yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteUnitTarget} onOpenChange={(v) => !v && setDeleteUnitTarget(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this price unit?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-bold text-gray-800">{deleteUnitTarget?.label}</span> will be
              removed. Rooms already using it keep their stored value.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: 'destructive' }))}
              onClick={handleDeleteUnit}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPanel;
