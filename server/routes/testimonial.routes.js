import express from 'express';
import {
  getActiveTestimonials,
  getAllTestimonials,
  submitTestimonial,
  createTestimonial,
  updateTestimonial,
  approveTestimonial,
  deleteTestimonial,
} from '../controllers/testimonial.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getActiveTestimonials);                              // Public: approved only
router.post('/submit', submitTestimonial);                           // Public: user submission
router.get('/all', protect, adminOnly, getAllTestimonials);           // Admin: all
router.post('/', protect, adminOnly, createTestimonial);             // Admin: create
router.put('/:id', protect, adminOnly, updateTestimonial);           // Admin: edit
router.patch('/:id/approve', protect, adminOnly, approveTestimonial); // Admin: approve/reject
router.delete('/:id', protect, adminOnly, deleteTestimonial);        // Admin: delete

export default router;
