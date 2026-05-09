import express from 'express';
import { getActiveHero, createHero, updateHero } from '../controllers/hero.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getActiveHero);
router.post('/', protect, adminOnly, createHero);
router.put('/:id', protect, adminOnly, updateHero);

export default router;
