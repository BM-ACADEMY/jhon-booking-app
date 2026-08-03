import express from 'express';
import { 
  getAllBookings, 
  getMyBookings, 
  createBooking, 
  updateBookingStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  checkGuestAccount,
  getDashboardStats,
  cancelBooking,
  processRefund,
  updatePaymentNotes,
  markPaymentComplete,
  createBalanceRazorpayOrder,
  verifyBalanceRazorpayPayment,
  getBookingByIdPublic,
  getRoomAvailabilityPublic,
  createAdminBooking,
  createPaymentLink,
  razorpayWebhook,
  confirmPaymentLinkBooking,
  getUnnotifiedBookings,
  markBookingAsNotified
} from '../controllers/booking.controller.js';
import { protect, adminOnly, protectOptional } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/unnotified', protect, adminOnly, getUnnotifiedBookings);
router.post('/:id/mark-notified', protect, adminOnly, markBookingAsNotified);
router.post('/razorpay-webhook', razorpayWebhook);
router.post('/confirm-link-payment', protectOptional, confirmPaymentLinkBooking);
router.get('/room-availability/:id', getRoomAvailabilityPublic);
router.get('/public/:id', getBookingByIdPublic);
router.get('/stats/dashboard', protect, adminOnly, getDashboardStats);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.post('/admin-create', protect, adminOnly, createAdminBooking);
router.post('/:id/payment-link', protect, adminOnly, createPaymentLink);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);
router.post('/:id/cancel', protect, cancelBooking);
router.post('/:id/refund', protect, adminOnly, processRefund);
router.patch('/:id/payment-notes', protect, adminOnly, updatePaymentNotes);
router.patch('/:id/payment-complete', protect, adminOnly, markPaymentComplete);

// Razorpay Routes
router.post('/check-guest', protectOptional, checkGuestAccount);
router.post('/razorpay-order', protectOptional, createRazorpayOrder);
router.post('/verify-payment', protectOptional, verifyRazorpayPayment);
router.post('/:id/balance-razorpay-order', protect, createBalanceRazorpayOrder);
router.post('/:id/verify-balance-payment', protect, verifyBalanceRazorpayPayment);

export default router;
