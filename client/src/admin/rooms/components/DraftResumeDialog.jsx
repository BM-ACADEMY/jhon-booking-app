import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

/**
 * Shown when `GET /rooms/admin/draft` returns an in-progress draft as the
 * Add Room wizard opens.
 */
const DraftResumeDialog = ({ draft, onOpenChange, onResume, onDiscard }) => (
  <AlertDialog open={!!draft} onOpenChange={(v) => !v && onOpenChange(null)}>
    <AlertDialogContent className="max-w-sm">
      <AlertDialogHeader>
        <AlertDialogTitle>Resume Draft?</AlertDialogTitle>
        <AlertDialogDescription>
          You have an unsaved draft:{' '}
          <span className="font-bold text-gray-800">&quot;{draft?.name || 'Untitled'}&quot;</span>.
          Would you like to continue where you left off?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onDiscard}>Start Fresh</AlertDialogCancel>
        <AlertDialogAction
          className="bg-amber-500 hover:bg-amber-600"
          onClick={() => onResume(draft)}
        >
          Resume Draft
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DraftResumeDialog;
