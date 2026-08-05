import { useState } from 'react';
import { Edit2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import api from '../../../api';

/** Settings tab: price unit CRUD + category CRUD (same endpoints as before). */
const SettingsPanel = ({
  priceUnits = [], categories = [],
  onAddUnit, onEditUnit, onUnitsChanged,
  onAddCategory, onEditCategory, onDeleteCategory,
}) => {
  return (
    <div className="space-y-6">

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
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('h-3 w-3 rounded-full', c.color?.split(' ')[0] || 'bg-gray-400')} />
                  <span className="text-sm font-bold text-foreground">{c.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28">
                    <DropdownMenuItem onClick={() => onEditCategory(c)} className="gap-2">
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteCategory(c)} className="text-rose-600 focus:text-rose-700 gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 col-span-full">
                No categories yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
