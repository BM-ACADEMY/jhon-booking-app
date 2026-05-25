import express from 'express';
import { 
  getAllBookings, 
  getMyBookings, 
  createBooking, 
  updateBookingStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getDashboardStats
} from '../controllers/booking.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/stats/dashboard', protect, adminOnly, getDashboardStats);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);

// Razorpay Routes
router.post('/razorpay-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyRazorpayPayment);

export default router;
