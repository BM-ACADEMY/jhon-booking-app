import express from 'express';
import { getHero, updateHero, deleteHeroVideo } from '../controllers/hero.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Public route
router.get('/', getHero);

// Admin routes
router.post('/', protect, adminOnly, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), updateHero);
router.delete('/video', protect, adminOnly, deleteHeroVideo);

export default router;
