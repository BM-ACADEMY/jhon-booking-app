import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight, BedDouble, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const razorpayPaymentId = searchParams.get('razorpay_payment_id') || searchParams.get('razorpay_payment_link_id');
  const paymentLinkId = searchParams.get('razorpay_payment_link_id');
  const paymentLinkStatus = searchParams.get('razorpay_payment_link_status');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        setLoading(true);
        const res = await api.post('/bookings/confirm-link-payment', {
          razorpay_payment_id: razorpayPaymentId,
          razorpay_payment_link_id: paymentLinkId,
          status: paymentLinkStatus
        });

        if (res.data && res.data.booking) {
          setBooking(res.data.booking);
          if (res.data.token && res.data.user) {
            login(res.data.user, res.data.token);
          }
          toast.success('Payment verified & room booking confirmed!');
        } else {
          setError('Could not verify payment link details.');
        }
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setError(err.response?.data?.message || 'Payment confirmation failed.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [razorpayPaymentId, paymentLinkId, paymentLinkStatus, login]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-20 px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col items-center max-w-md text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
          <h2 className="text-xl font-extrabold text-gray-900">Verifying Your Payment...</h2>
          <p className="text-xs text-gray-500 mt-2">
            Please wait while we confirm your Razorpay payment and generate your villa booking details.
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-20 px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col items-center max-w-md text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4 font-bold text-2xl">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Payment Received!</h2>
          <p className="text-xs text-gray-600 mt-2">
            Your payment was processed successfully. Thank you for choosing The Balified Villa!
          </p>
          <div className="mt-6 flex flex-col gap-3 w-full">
            <Link
              to="/mybookings"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              View My Bookings <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all text-xs text-center"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-32 sm:pt-36 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Payment Successful & Confirmed
          </span>
          <h1 className="text-3xl font-black text-gray-900 mt-3">Room Booking Confirmed!</h1>
          <p className="text-xs text-gray-500 mt-1">
            Booking ID: <span className="font-mono font-bold text-gray-900">#{booking._id.slice(-6).toUpperCase()}</span>
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 text-xs border border-gray-100">
          <div className="flex justify-between border-b border-gray-200/60 pb-2">
            <span className="text-gray-500">Guest Name:</span>
            <span className="font-bold text-gray-900">{booking.guestName || booking.user?.name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200/60 pb-2">
            <span className="text-gray-500">Dates:</span>
            <span className="font-bold text-gray-900">
              {new Date(booking.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(booking.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm">
            <span>Total Paid:</span>
            <span className="text-emerald-600">₹{booking.paidAmount?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/booking-details/${booking._id}`)}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            View Full Booking Voucher <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
