import express from 'express';
import { 
  getAllBookings, 
  getMyBookings, 
  createBooking, 
  updateBookingStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getDashboardStats,
  cancelBooking,
  processRefund,
  updatePaymentNotes,
  markPaymentComplete,
  createBalanceRazorpayOrder,
  verifyBalanceRazorpayPayment
} from '../controllers/booking.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/stats/dashboard', protect, adminOnly, getDashboardStats);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);
router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/refund', protect, adminOnly, processRefund);
router.patch('/:id/payment-notes', protect, adminOnly, updatePaymentNotes);
router.patch('/:id/payment-complete', protect, adminOnly, markPaymentComplete);

// Razorpay Routes
router.post('/razorpay-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);
router.post('/:id/balance-razorpay-order', protect, createBalanceRazorpayOrder);
router.post('/:id/verify-balance-payment', protect, verifyBalanceRazorpayPayment);

export default router;
