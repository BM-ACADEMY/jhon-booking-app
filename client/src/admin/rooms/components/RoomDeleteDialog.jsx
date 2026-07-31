import { toast } from 'react-hot-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '../../../api';

/** Confirm + DELETE /rooms/:id */
const RoomDeleteDialog = ({ target, onOpenChange, onDeleted }) => (
  <AlertDialog open={!!target} onOpenChange={(v) => !v && onOpenChange(null)}>
    <AlertDialogContent className="max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Room?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently remove{' '}
          <span className="font-bold text-gray-800">{target?.name}</span>. This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className={cn(buttonVariants({ variant: 'destructive' }))}
          onClick={async () => {
            try {
              await api.delete(`/rooms/${target._id}`);
              toast.success('Room deleted');
              onDeleted?.(target);
            } catch (err) {
              toast.error('Failed to delete room');
            }
          }}
        >
          Delete Room
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default RoomDeleteDialog;
