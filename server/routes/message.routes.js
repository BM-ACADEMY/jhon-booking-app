import express from 'express';
import {
  submitMessage,
  getAllMessages,
  markAsRead,
  deleteMessage
} from '../controllers/message.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/submit', submitMessage); // Public: submit message
router.get('/', protect, adminOnly, getAllMessages); // Admin: get all
router.patch('/:id/read', protect, adminOnly, markAsRead); // Admin: mark as read
router.delete('/:id', protect, adminOnly, deleteMessage); // Admin: delete message

export default router;
