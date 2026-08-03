import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { X, Check, Calendar, Star, Phone, Mail, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import notificationSound from '../../assets/notificaition.mp3';

const AdminLayout = () => {
  const [activeBooking, setActiveBooking] = useState(null);
  const audioIntervalRef = useRef(null);
  const audioRef = useRef(null);

  // Poll for unnotified bookings every 10 seconds
  useEffect(() => {
    const checkUnnotifiedBookings = async () => {
      try {
        const res = await api.get('/bookings/unnotified');
        if (res.data && res.data.length > 0) {
          // If we are not currently displaying a popup, show the first unnotified one
          if (!activeBooking) {
            setActiveBooking(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to check unnotified bookings:', err);
      }
    };

    // Initial check
    checkUnnotifiedBookings();

    const interval = setInterval(checkUnnotifiedBookings, 8000);
    return () => clearInterval(interval);
  }, [activeBooking]);

  // Audio loop handler: plays sound with a 4-second gap when a popup is active
  useEffect(() => {
    if (activeBooking) {
      // Create audio object
      if (!audioRef.current) {
        audioRef.current = new Audio(notificationSound);
      }

      const playSound = () => {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => {
            console.log('Audio autoplay prevented, waiting for user interaction:', e);
          });
        }
      };

      // Play immediately
      playSound();

      // Set up loop with 4 second gap
      audioIntervalRef.current = setInterval(playSound, 4000);
    } else {
      // Clear audio interval
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [activeBooking]);

  const handleDismiss = async () => {
    if (!activeBooking) return;
    try {
      await api.post(`/bookings/${activeBooking._id}/mark-notified`);
      toast.success('Notification dismissed');
      setActiveBooking(null);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      // Fallback: clear from screen
      setActiveBooking(null);
    }
  };

  const handleView = async () => {
    if (!activeBooking) return;
    try {
      await api.post(`/bookings/${activeBooking._id}/mark-notified`);
      setActiveBooking(null);
      // Redirect or load booking details
      window.location.href = `/admin/bookings`;
    } catch (err) {
      console.error('Failed to view booking:', err);
      setActiveBooking(null);
    }
  };

  // Helper date formatter for check-in box
  const getCheckInDay = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).getDate();
  };

  const getCheckInMonthYear = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <>
      {/* Ticket Style Real-time Popup Notification */}
      {activeBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 transition-all">
          <div 
            className="w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col relative transition-all duration-300"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              backgroundImage: 'radial-gradient(circle at left, transparent 15px, white 16px), radial-gradient(circle at right, transparent 15px, white 16px)',
              backgroundPosition: 'left 145px, right 145px',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ticket Body */}
            <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between gap-6">
              {/* Left Side: Detail Section */}
              <div className="flex-1 space-y-3.5">
                <h2 className="text-2xl font-black text-purple-900 tracking-tight leading-tight">
                  Booking Confirmation
                </h2>
                
                <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                  🎉 <span className="font-extrabold text-slate-900">{activeBooking.guestName}</span>, your room booking has been successfully confirmed and paid!
                </p>

                <div className="space-y-2 border-t border-dashed border-slate-200 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Star className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-bold text-slate-900">The Balified Villa</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-medium">
                      {new Date(activeBooking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - {new Date(activeBooking.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {activeBooking.guestPhone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">{activeBooking.guestPhone}</span>
                    </div>
                  )}
                  {activeBooking.guestEmail && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium truncate max-w-[200px]">{activeBooking.guestEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Ticket Date Stubs */}
              <div className="flex flex-col items-center justify-center shrink-0 sm:border-l sm:border-dashed sm:border-slate-200 sm:pl-6 pt-4 sm:pt-0">
                <div className="w-24 bg-purple-50 rounded-2xl p-4 border border-purple-100 flex flex-col items-center relative shadow-sm">
                  <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                  <span className="text-3xl font-black text-purple-950">
                    {getCheckInDay(activeBooking.checkIn)}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 mt-1">
                    {getCheckInMonthYear(activeBooking.checkIn)}
                  </span>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reference No</p>
                  <p className="text-sm font-black text-slate-800 font-mono tracking-wider mt-0.5">
                    #{activeBooking._id.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Separator Line (Dashed cutoff) */}
            <div className="h-px border-b border-dashed border-slate-200 w-full relative">
              <div className="absolute left-0 -top-1.5 w-3 h-3 rounded-full bg-slate-500/20 -ml-1.5"></div>
              <div className="absolute right-0 -top-1.5 w-3 h-3 rounded-full bg-slate-500/20 -mr-1.5"></div>
            </div>

            {/* Ticket Bottom Banner (Green Banner) */}
            <div className="bg-emerald-600 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-700/80 px-2.5 py-0.5 rounded-full">
                  CONGRATULATIONS
                </span>
                <p className="text-xs font-semibold text-emerald-100 mt-1">
                  New confirmed villa booking received!
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleDismiss}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleView}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-white text-emerald-700 hover:bg-slate-50 transition-colors shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> View Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SidebarProvider defaultOpen={true}>
        <Sidebar />
        <SidebarInset className="flex flex-col min-w-0 bg-slate-50">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default AdminLayout;
