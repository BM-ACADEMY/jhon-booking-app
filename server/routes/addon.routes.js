import express from 'express';
import {
  getAddons,
  createAddon,
  updateAddon,
  deleteAddon,
} from '../controllers/addon.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getAddons);                                       // Public/User: view all
router.post('/', protect, adminOnly, createAddon);                 // Admin: create
router.put('/:id', protect, adminOnly, updateAddon);               // Admin: update
router.delete('/:id', protect, adminOnly, deleteAddon);            // Admin: delete

export default router;
