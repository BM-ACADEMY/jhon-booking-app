import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasConfirmedRef = useRef(false);

  const razorpayPaymentId = searchParams.get('razorpay_payment_id') || searchParams.get('razorpay_payment_link_id');
  const paymentLinkId = searchParams.get('razorpay_payment_link_id');
  const paymentLinkStatus = searchParams.get('razorpay_payment_link_status');

  useEffect(() => {
    if (hasConfirmedRef.current) return;
    hasConfirmedRef.current = true;

    const confirmPayment = async () => {
      try {
        setLoading(true);
        const res = await api.post('/bookings/confirm-link-payment', {
          razorpay_payment_id: razorpayPaymentId,
          razorpay_payment_link_id: paymentLinkId,
          status: paymentLinkStatus
        });

        if (res.data && res.data.booking) {
          if (res.data.token && res.data.user) {
            login(res.data.user, res.data.token);
          }
          toast.success('Payment verified & room booking confirmed!');
          navigate('/mybookings', { replace: true });
          return;
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
  }, [razorpayPaymentId, paymentLinkId, paymentLinkStatus, login, navigate]);

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

  // Reached only when confirmation failed (success case navigates away above)
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center py-20 px-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 flex flex-col items-center max-w-md text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-4 font-bold text-2xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Payment Received!</h2>
        <p className="text-xs text-gray-600 mt-2">
          {error || 'Your payment was processed successfully. Thank you for choosing The Balified Villa!'}
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
};

export default PaymentSuccessPage;
