import { useMemo } from 'react';
import { Bath, BedDouble, Check, Clock, Info, MapPin, ShowerHead, Sparkles, Star, Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { roomToForm, parseGoogleMapLink, getIconComp } from '../utils';
import GeneralSection from './sections/GeneralSection';

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

        <div className="rounded-2xl border border-border bg-muted/40 p-5 text-card-foreground">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Pricing</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">₹{room.price}</span>
            {room.originalPrice ? (
              <span className="text-sm text-muted-foreground line-through">₹{room.originalPrice}</span>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            per {room.priceUnit || 'night'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] font-bold uppercase text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Accordion type="multiple" defaultValue={['general', 'offers']}>
          <AccordionItem value="general">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> General Information</span>
            </AccordionTrigger>
            <AccordionContent>
              <GeneralSection form={form} patch={() => {}} categories={categories} readOnly />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="offers">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> What this place offers</span>
            </AccordionTrigger>
            <AccordionContent>
              {room.amenities && room.amenities.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {room.amenities.map((a, idx) => {
                    const IconComponent = getIconComp(a.icon);
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 bg-muted/5">
                        <IconComponent className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs font-medium text-foreground">{a.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">No amenities specified.</div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="location">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Location</span>
            </AccordionTrigger>
            <AccordionContent>
              {room.mapLink ? (
                <div className="h-48 w-full overflow-hidden rounded-xl border border-border shadow-inner mt-1">
                  <iframe
                    title="Map preview"
                    src={parseGoogleMapLink(room.mapLink)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">No Google Map link specified.</div>
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="timings">
            <AccordionTrigger>
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Check-In &amp; Check-Out Timings</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/10 p-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Check-In Time</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {room.checkInTime || '14:00 (Standard)'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Check-Out Time</p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {room.checkOutTime || '11:00 (Standard)'}
                  </p>
                </div>
              </div>
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
