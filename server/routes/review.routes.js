import express from 'express';
import {
  getReviewsByRoom,
  createReview,
  getAdminReviews,
  verifyReview,
  createOwnReviewAdmin,
  deleteReview
} from '../controllers/review.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// ── Public Routes ───────────────────────────────────────────────────────────
router.get('/room/:roomId', getReviewsByRoom);

// ── Authenticated User Routes ────────────────────────────────────────────────
router.post('/', protect, upload.array('images', 5), createReview);

// ── Admin Routes ────────────────────────────────────────────────────────────
router.get('/admin', protect, adminOnly, getAdminReviews);
router.put('/:reviewId/verify', protect, adminOnly, verifyReview);
router.post('/admin/own', protect, adminOnly, upload.array('images', 5), createOwnReviewAdmin);
router.delete('/:reviewId', protect, deleteReview);

export default router;
