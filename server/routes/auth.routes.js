import express from 'express';
import { register, login, getMe, updateProfile, toggleWishlist, getWishlist } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/wishlist/toggle', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

export default router;
