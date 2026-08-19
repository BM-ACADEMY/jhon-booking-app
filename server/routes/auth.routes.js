import express from 'express';
import { requestAuthOtp, verifyAuthOtp, login, getMe, updateProfile, toggleWishlist, getWishlist } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/request-otp', requestAuthOtp);
router.post('/verify-otp', verifyAuthOtp);
router.post('/login', login); // For admin login
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/wishlist/toggle', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

export default router;
