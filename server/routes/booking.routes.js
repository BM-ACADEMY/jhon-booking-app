import express from 'express';
import { getAllBookings, getMyBookings, createBooking, updateBookingStatus } from '../controllers/booking.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllBookings);
router.get('/my', protect, getMyBookings);
router.post('/', protect, createBooking);
router.patch('/:id/status', protect, adminOnly, updateBookingStatus);

export default router;
