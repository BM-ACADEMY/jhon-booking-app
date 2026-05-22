import express from 'express';
import {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getCategories);                               // Public: active only
router.get('/all', protect, adminOnly, getAllCategories);     // Admin: all
router.post('/', protect, adminOnly, createCategory);         // Admin: create
router.put('/:id', protect, adminOnly, updateCategory);       // Admin: update
router.delete('/:id', protect, adminOnly, deleteCategory);    // Admin: delete

export default router;
