import { useCallback, useEffect, useState } from 'react';
import {
  Check, CloudOff, Image as ImageIcon, Info, Loader2, MapPin, Shield,
  Sparkles, Tag, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '../../../api';
import { buildFormData, roomToForm } from '../utils';
import useRoomForm from '../hooks/useRoomForm';
import useDebouncedSave from '../hooks/useDebouncedSave';
import GeneralSection from './sections/GeneralSection';
import PricingSection from './sections/PricingSection';
import AvailabilitySection from './sections/AvailabilitySection';
import FeaturesSection from './sections/FeaturesSection';
import AmenitiesSection from './sections/AmenitiesSection';
import GallerySection from './sections/GallerySection';
import AdvancedSection from './sections/AdvancedSection';
import { CapacityFields } from './steps/CapacityStep';

const SaveIndicator = ({ status }) => {
  if (status === 'saving' || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500">
        <CloudOff className="h-3 w-3" /> Not saved
      </span>
    );
  }
  return null;
};

/**
 * Sliding room configuration panel. Every edit schedules a debounced
 * `PUT /rooms/:id` (same FormData shape as the old handleSaveRoom), so there
 * is no explicit Save button.
 */
const RoomConfigSheet = ({
  open, onOpenChange, room, categories = [], priceUnits = [],
  selectedDates = null, defaultSection = 'general', readOnly = false,
  onSaved, onManageUnits,
}) => {
  const formApi = useRoomForm();
  const {
    roomForm, patch: rawPatch, setRoomForm, resetForm, setRoomImages,
    formRef, imagesRef, handleMapLinkChange,
    setCustomPrice, resetCustomPrice, addBlockRange, removeBlockRange,
  } = formApi;

  const { status, schedule, cancel } = useDebouncedSave(800);
  const [openSections, setOpenSections] = useState([defaultSection]);

  useEffect(() => {
    if (!open || !room) return;
    cancel();
    resetForm(roomToForm(room));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room?._id]);

  useEffect(() => {
    if (!open) return;
    setOpenSections((prev) => (prev.includes(defaultSection) ? prev : [...prev, defaultSection]));
  }, [open, defaultSection]);

  const persist = useCallback(async () => {
    if (!room?._id) return;
    const payload = buildFormData(formRef.current, imagesRef.current, room.status || 'published');
    const res = await api.put(`/rooms/${room._id}`, payload);
    // Newly uploaded files are now persisted — adopt the server's image list.
    setRoomImages([]);
    imagesRef.current = [];
    if (res.data?.images) {
      setRoomForm((p) => ({ ...p, images: res.data.images }));
      formRef.current = { ...formRef.current, images: res.data.images };
    }
    onSaved?.(res.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?._id, room?.status, onSaved]);

  const queueSave = useCallback(() => {
    if (readOnly || !room?._id) return;
    schedule(persist);
  }, [readOnly, room?._id, schedule, persist]);

  /** Every field edit goes through here: update local state, then autosave. */
  const patch = useCallback((partial) => {
    rawPatch(partial);
    queueSave();
  }, [rawPatch, queueSave]);

  const onMapLinkChange = useCallback(async (val) => {
    await handleMapLinkChange(val);
    queueSave();
  }, [handleMapLinkChange, queueSave]);

  const handleSetCustomPrice = (dateStr, value) => {
    if (setCustomPrice(dateStr, value)) {
      toast.success(`Price set to ₹${Number(value)} for ${dateStr}`);
      queueSave();
    }
  };

  const handleResetCustomPrice = (dateStr) => {
    if (resetCustomPrice(dateStr)) {
      toast.success(`Reset to base price for ${dateStr}`);
      queueSave();
    }
  };

  const handleAddBlock = (start, end, reason) => {
    const ok = addBlockRange(start, end, reason);
    if (ok) {
      toast.success('Date block added');
      queueSave();
    }
    return ok;
  };

  const handleRemoveBlock = (idx) => {
    removeBlockRange(idx);
    toast.success('Date block removed');
    queueSave();
  };

  const sections = [
    {
      id: 'general', label: 'General', icon: Info,
      content: (
        <GeneralSection
          form={roomForm} patch={patch} categories={categories} readOnly={readOnly}
        />
      ),
    },
    {
      id: 'pricing', label: 'Pricing', icon: Tag,
      content: (
        <PricingSection
          form={roomForm} patch={patch} priceUnits={priceUnits} readOnly={readOnly}
          onManageUnits={onManageUnits}
          selectedDate={selectedDates?.from || null}
          onSetCustomPrice={handleSetCustomPrice}
          onResetCustomPrice={handleResetCustomPrice}
        />
      ),
    },
    {
      id: 'availability', label: 'Availability', icon: Shield,
      content: (
        <AvailabilitySection
          form={roomForm} patch={patch} readOnly={readOnly}
          selectedRange={selectedDates}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleRemoveBlock}
        />
      ),
    },
    {
      id: 'features', label: 'Features', icon: Sparkles,
      content: <FeaturesSection form={roomForm} patch={patch} readOnly={readOnly} />,
    },
    {
      id: 'policies', label: 'Policies & Capacity', icon: Users,
      content: <CapacityFields form={roomForm} patch={patch} readOnly={readOnly} />,
    },
    {
      id: 'gallery', label: 'Gallery', icon: ImageIcon,
      content: (
        <GallerySection
          form={roomForm} patch={patch} imageApi={formApi}
          readOnly={readOnly} onDirty={queueSave}
        />
      ),
    },
    {
      id: 'amenities', label: 'Amenities', icon: Check,
      content: <AmenitiesSection form={roomForm} patch={patch} readOnly={readOnly} />,
    },
    {
      id: 'advanced', label: 'Advanced Settings', icon: MapPin,
      content: (
        <AdvancedSection
          form={roomForm} patch={patch} readOnly={readOnly}
          onMapLinkChange={onMapLinkChange}
        />
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <SheetTitle className="truncate">{room?.name || 'Room configuration'}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 pt-1">
                <Badge variant="secondary" className="text-[10px]">{room?.category || '—'}</Badge>
                {room?.status && (
                  <Badge
                    variant={room.status === 'published' ? 'success' : 'warning'}
                    className="text-[10px] uppercase"
                  >
                    {room.status}
                  </Badge>
                )}
              </SheetDescription>
            </div>
            <div className="shrink-0 pt-1">
              {readOnly
                ? <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Read only</span>
                : <SaveIndicator status={status} />}
            </div>
          </div>
          {!readOnly && (
            <p className="pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Changes save automatically
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 px-6 pb-10">
          {!room ? (
            <div className="py-20 text-center text-sm font-bold text-gray-400">
              Select a room to configure.
            </div>
          ) : (
            <Accordion type="multiple" value={openSections} onValueChange={setOpenSections}>
              {sections.map((s) => (
                <AccordionItem key={s.id} value={s.id}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <s.icon className={cn('h-4 w-4 text-primary-500')} />
                      {s.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>{s.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RoomConfigSheet;
