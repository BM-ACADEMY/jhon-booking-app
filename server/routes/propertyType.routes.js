import express from 'express';
import { getPropertyTypes, createPropertyType, updatePropertyType, deletePropertyType } from '../controllers/propertyType.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getPropertyTypes);
router.post('/', protect, adminOnly, createPropertyType);
router.put('/:id', protect, adminOnly, updatePropertyType);
router.delete('/:id', protect, adminOnly, deletePropertyType);

export default router;
