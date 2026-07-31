import { useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Image as ImageIcon, Info, Loader2, MapPin, Sparkles, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api from '../../../api';
import { DEFAULT_ROOM_FORM } from '../utils';
import useRoomForm from '../hooks/useRoomForm';
import Stepper from './Stepper';
import GeneralStep from './steps/GeneralStep';
import CapacityStep from './steps/CapacityStep';
import FeaturesStep from './steps/FeaturesStep';
import LocationStep from './steps/LocationStep';
import PhotosStep from './steps/PhotosStep';

const STEPS = [
  { id: 'general', label: 'General', icon: Info },
  { id: 'capacity', label: 'Capacity', icon: Users },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
];

/**
 * 5-step "Add Room" flow. Draft save/resume is available on every step and
 * uses the same POST/PUT `/rooms` calls with `status=draft` as before.
 */
const AddRoomWizard = ({
  open, onOpenChange, categories = [], priceUnits = [],
  initialForm = null, initialDraftId = null,
  onSaved, onManageUnits,
}) => {
  const [step, setStep] = useState(0);
  const [draftId, setDraftId] = useState(initialDraftId);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const roomFormApi = useRoomForm(DEFAULT_ROOM_FORM);
  const { roomForm, patch, resetForm, build, validatePublish, handleMapLinkChange } = roomFormApi;

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setDraftId(initialDraftId);
    resetForm(initialForm || { ...DEFAULT_ROOM_FORM, category: categories[0]?.name || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stepProps = {
    form: roomForm,
    patch,
    categories,
    priceUnits,
    onManageUnits,
    onMapLinkChange: handleMapLinkChange,
    imageApi: roomFormApi,
  };

  const canLeaveStep = (index) => {
    if (index !== 0) return true;
    if (!String(roomForm.name || '').trim()) {
      toast.error('Property name is required');
      return false;
    }
    if (!roomForm.category) {
      toast.error('Please choose a category');
      return false;
    }
    if (!roomForm.price) {
      toast.error('Base price is required');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!canLeaveStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      const formData = build('draft');
      let res;
      if (draftId) {
        res = await api.put(`/rooms/${draftId}`, formData);
      } else {
        // Need at least a name to create a draft
        if (!String(roomForm.name || '').trim()) {
          toast.error('Add a property name to save draft');
          return;
        }
        // Provide required field defaults for draft
        if (!roomForm.category) formData.set('category', categories[0]?.name || 'Uncategorised');
        if (!roomForm.price) formData.set('price', '0');
        if (!roomForm.description) formData.set('description', 'Draft');
        res = await api.post('/rooms', formData);
        setDraftId(res.data._id);
      }
      toast.success('Draft saved ✓');
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!validatePublish()) return;
    try {
      setSubmitting(true);
      const formData = build('published');
      if (draftId) await api.put(`/rooms/${draftId}`, formData);
      else await api.post('/rooms', formData);
      setDraftId(null);
      toast.success('Property published!');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving room');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'general': return <GeneralStep {...stepProps} />;
      case 'capacity': return <CapacityStep {...stepProps} />;
      case 'features': return <FeaturesStep {...stepProps} />;
      case 'location': return <LocationStep {...stepProps} />;
      case 'photos': return <PhotosStep {...stepProps} />;
      default: return null;
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>Property details &amp; booking configuration</DialogDescription>
        </DialogHeader>

        <div className="border-y border-gray-100 py-4">
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        </div>

        <div className="min-h-[360px] py-2">{renderStep()}</div>

        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              disabled={savingDraft || submitting}
              onClick={handleSaveDraft}
            >
              {savingDraft && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {draftId ? 'Update Draft' : 'Save Draft'}
            </Button>

            {isLast ? (
              <Button disabled={submitting || savingDraft} onClick={handlePublish}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Property
              </Button>
            ) : (
              <Button onClick={goNext}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRoomWizard;
