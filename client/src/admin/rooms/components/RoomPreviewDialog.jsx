import { useMemo } from 'react';
import { Bath, BedDouble, Check, Info, Image as ImageIcon, MapPin, ShowerHead, Sparkles, Star, Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { roomToForm } from '../utils';
import GeneralSection from './sections/GeneralSection';
import GallerySection from './sections/GallerySection';
import FeaturesSection from './sections/FeaturesSection';
import AmenitiesSection from './sections/AmenitiesSection';
import AdvancedSection from './sections/AdvancedSection';

const noop = () => {};

/**
 * Read-only property preview. Reuses the same section components in
 * `readOnly` mode rather than duplicating the old view modal's markup.
 */
const RoomPreviewDialog = ({ room, onOpenChange, onConfigure, categories = [] }) => {
  const form = useMemo(() => (room ? roomToForm(room) : null), [room]);
  if (!room || !form) return null;

  const stats = [
    { icon: Users, value: room.maxOccupancy || room.guests || room.capacity || '–', label: 'Guests' },
    { icon: BedDouble, value: room.allowExtraBed && room.extraBedCount ? `Max ${room.extraBedCount}` : 'No', label: 'Extra Bed' },
    { icon: Bath, value: room.bathrooms ?? '–', label: 'Bathrooms' },
    { icon: ShowerHead, value: room.showers || 0, label: 'Showers' },
    { icon: Star, value: room.rating?.toFixed?.(1) || 'New', label: 'Rating' },
  ];

  return (
    <Dialog open={!!room} onOpenChange={(v) => !v && onOpenChange(null)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{room.name}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="text-[10px]">{room.category}</Badge>
            <Badge variant={room.isAvailable ? 'success' : 'destructive'} className="text-[10px]">
              {room.isAvailable ? 'Instant Booking' : 'Not Available'}
            </Badge>
            {room.status && (
              <Badge variant={room.status === 'published' ? 'default' : 'warning'} className="text-[10px] uppercase">
                {room.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="rounded-2xl border border-gray-100 bg-gray-900 p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Live Pricing</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black">₹{room.price}</span>
            {room.originalPrice ? (
              <span className="text-sm text-gray-500 line-through">₹{room.originalPrice}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            per {room.priceUnit || 'night'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-1 h-4 w-4 text-primary-500" />
              <p className="text-sm font-black text-gray-900">{s.value}</p>
              <p className="text-[9px] font-bold uppercase text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <Accordion type="multiple" defaultValue={['general', 'gallery']}>
          <AccordionItem value="general">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary-500" /> General</span>
            </AccordionTrigger>
            <AccordionContent>
              <GeneralSection form={form} patch={noop} categories={categories} readOnly />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="gallery">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary-500" /> Gallery</span>
            </AccordionTrigger>
            <AccordionContent>
              <GallerySection form={form} patch={noop} readOnly />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="features">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary-500" /> Highlights</span>
            </AccordionTrigger>
            <AccordionContent>
              <FeaturesSection form={form} patch={noop} readOnly />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="amenities">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary-500" /> Amenities</span>
            </AccordionTrigger>
            <AccordionContent>
              <AmenitiesSection form={form} patch={noop} readOnly />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-500" /> Location</span>
            </AccordionTrigger>
            <AccordionContent>
              <AdvancedSection form={form} patch={noop} readOnly onMapLinkChange={noop} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(null)}>Close View</Button>
          <Button onClick={() => onConfigure?.(room)}>Edit Property</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoomPreviewDialog;
