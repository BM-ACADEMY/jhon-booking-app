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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '../../../api';
import { buildFormData, roomToForm } from '../utils';
import useRoomForm from '../hooks/useRoomForm';
import GeneralSection from './sections/GeneralSection';
import PricingSection from './sections/PricingSection';
import AvailabilitySection from './sections/AvailabilitySection';
import GallerySection from './sections/GallerySection';
import AdvancedSection from './sections/AdvancedSection';
import WhatThisPlaceOffers from './sections/WhatThisPlaceOffers';
import { CapacityFields } from './steps/CapacityStep';

/**
 * Sliding room configuration panel. Click the Save button at the bottom to persist changes.
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

  const [isSaving, setIsSaving] = useState(false);
  const [openSection, setOpenSection] = useState(undefined);

  useEffect(() => {
    if (!open || !room) return;
    resetForm(roomToForm(room));
    setOpenSection(undefined); // Ensure all sections start closed when opening or changing rooms
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room?._id]);

  const persist = useCallback(async () => {
    if (!room?._id) return;
    setIsSaving(true);
    try {
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
      toast.success('Room configurations saved successfully');
      onOpenChange?.(false); // Close the sheet after saving
    } catch (err) {
      toast.error('Failed to save configurations');
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?._id, room?.status, onSaved, onOpenChange]);

  /** Every field edit updates local state only (no autosave). */
  const patch = useCallback((partial) => {
    rawPatch(partial);
  }, [rawPatch]);

  const onMapLinkChange = useCallback(async (val) => {
    await handleMapLinkChange(val);
  }, [handleMapLinkChange]);

  const handleSetCustomPrice = (dateStr, value) => {
    if (setCustomPrice(dateStr, value)) {
      toast.success(`Price set to ₹${Number(value)} for ${dateStr}`);
    }
  };

  const handleResetCustomPrice = (dateStr) => {
    if (resetCustomPrice(dateStr)) {
      toast.success(`Reset to base price for ${dateStr}`);
    }
  };

  const handleAddBlock = (start, end, reason) => {
    const ok = addBlockRange(start, end, reason);
    if (ok) {
      toast.success('Date block added');
    }
    return ok;
  };

  const handleRemoveBlock = (idx) => {
    removeBlockRange(idx);
    toast.success('Date block removed');
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
      id: 'availability', label: 'Room Blocking Feature', icon: Shield,
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
      id: 'policies', label: 'Policies & Capacity', icon: Users,
      content: <CapacityFields form={roomForm} patch={patch} readOnly={readOnly} />,
    },
    {
      id: 'gallery', label: 'Gallery', icon: ImageIcon,
      content: (
        <GallerySection
          form={roomForm} patch={patch} imageApi={formApi}
          readOnly={readOnly} onDirty={() => {}}
        />
      ),
    },
    {
      id: 'amenities', label: 'What this place offers', icon: Sparkles,
      content: <WhatThisPlaceOffers form={roomForm} patch={patch} readOnly={readOnly} />,
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
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur shrink-0">
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
              {readOnly && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Read only</span>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 pb-10 overflow-y-auto pt-4">
          {!room ? (
            <div className="py-20 text-center text-sm font-bold text-gray-400">
              Select a room to configure.
            </div>
          ) : (
            <Accordion type="single" collapsible value={openSection} onValueChange={setOpenSection}>
              {sections.map((s) => (
                <AccordionItem key={s.id} value={s.id} className="border-zinc-200">
                  <AccordionTrigger className="hover:no-underline py-4 text-sm font-semibold text-zinc-900">
                    <span className="flex items-center gap-2">
                      <s.icon className={cn('h-4 w-4 text-zinc-500')} />
                      {s.label}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pt-1">{s.content}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {room && (
          <div className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white px-6 py-4 flex justify-end gap-3 shrink-0 shadow-lg">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange?.(false)}
              className="border-zinc-200 hover:bg-zinc-50 text-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving || readOnly}
              className="bg-zinc-900 hover:bg-zinc-800 text-white min-w-[100px] font-medium"
              onClick={persist}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : 'Save'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default RoomConfigSheet;
