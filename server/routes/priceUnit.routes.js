import express from 'express';
import { getPriceUnits, createPriceUnit, updatePriceUnit, deletePriceUnit } from '../controllers/priceUnit.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getPriceUnits);
router.post('/', protect, adminOnly, createPriceUnit);
router.put('/:id', protect, adminOnly, updatePriceUnit);
router.delete('/:id', protect, adminOnly, deletePriceUnit);

export default router;
