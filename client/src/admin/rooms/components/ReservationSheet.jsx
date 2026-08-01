import { useNavigate } from 'react-router-dom';
import { CalendarDays, ExternalLink, IndianRupee, Mail, Phone, Users } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const statusVariant = { confirmed: 'success', pending: 'warning', completed: 'secondary', cancelled: 'destructive' };
const paymentVariant = { paid: 'success', unpaid: 'warning', refunded: 'secondary', partially_paid: 'warning' };

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const getEffectiveStatus = (booking) => {
  if (!booking) return 'pending';
  if (booking.status === 'confirmed' && booking.checkOut) {
    const checkOut = new Date(booking.checkOut);
    checkOut.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkOut < today) return 'completed';
  }
  return booking.status;
};

/** Read-only reservation summary opened from a booking bar on the availability grid. */
const ReservationSheet = ({ booking, onOpenChange }) => {
  const navigate = useNavigate();
  if (!booking) return null;

  const nights = booking.checkIn && booking.checkOut
    ? Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000))
    : null;
  const status = getEffectiveStatus(booking);
  const roomName = booking.room?.name || 'Room';
  const guestName = booking.user?.name || 'Guest';

  const viewInBookings = () => {
    const q = booking._id || guestName;
    navigate(`/admin/bookings?search=${encodeURIComponent(q)}`);
  };

  return (
    <Sheet open={!!booking} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{guestName}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant[status] || 'secondary'} className="capitalize">{status}</Badge>
            {booking.paymentStatus && (
              <Badge variant={paymentVariant[booking.paymentStatus] || 'secondary'} className="capitalize">
                {booking.paymentStatus.replace('_', ' ')}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-2 flex-1 space-y-6 overflow-y-auto">
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" /> Stay
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Check-in</p>
                <p className="font-medium text-gray-900">{fmtDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Check-out</p>
                <p className="font-medium text-gray-900">{fmtDate(booking.checkOut)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Nights</p>
                <p className="font-medium text-gray-900">{nights ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Room</p>
                <p className="truncate font-medium text-gray-900">{roomName}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <Users className="h-3.5 w-3.5" /> Guest
            </p>
            <p className="text-sm font-medium text-gray-900">{guestName} · {booking.guests || 1} guest{(booking.guests || 1) > 1 ? 's' : ''}</p>
            {booking.user?.email && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500"><Mail className="h-3.5 w-3.5" /> {booking.user.email}</p>
            )}
            {booking.user?.phone && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500"><Phone className="h-3.5 w-3.5" /> {booking.user.phone}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
              <IndianRupee className="h-3.5 w-3.5" /> Payment
            </p>
            <p className="text-2xl font-semibold text-gray-900">₹{booking.totalAmount}</p>
            {!!booking.dueAmount && (
              <p className="text-sm text-amber-600">₹{booking.dueAmount} due</p>
            )}
          </div>

          <Separator />
          <p className="text-center text-xs text-gray-400">
            Booking ID: {booking._id}
          </p>
        </div>

        <Button className="w-full" onClick={viewInBookings}>
          <ExternalLink className="mr-1.5 h-4 w-4" /> View in Bookings
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default ReservationSheet;
