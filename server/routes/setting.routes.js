import express from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, adminOnly, updateSettings);

export default router;
