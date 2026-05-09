import express from 'express';
import { getAllUsers, updateUserRole, updateUserStatus } from '../controllers/user.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getAllUsers);
router.patch('/:id/role', protect, adminOnly, updateUserRole);
router.patch('/:id/status', protect, adminOnly, updateUserStatus);

export default router;
