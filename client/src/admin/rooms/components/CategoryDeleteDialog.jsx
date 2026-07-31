import { toast } from 'react-hot-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '../../../api';

/** Confirm + DELETE /categories/:id */
const CategoryDeleteDialog = ({ target, onOpenChange, onDeleted }) => (
  <AlertDialog open={!!target} onOpenChange={(v) => !v && onOpenChange(null)}>
    <AlertDialogContent className="max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-800">{target?.name}</span>? Rooms using this
          category might need to be updated.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className={cn(buttonVariants({ variant: 'destructive' }))}
          onClick={async () => {
            try {
              await api.delete(`/categories/${target._id}`);
              toast.success('Category deleted');
              onDeleted?.(target);
            } catch (err) {
              toast.error('Failed to delete category');
            }
          }}
        >
          Delete Category
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default CategoryDeleteDialog;
