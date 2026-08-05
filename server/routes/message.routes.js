import express from 'express';
import {
  submitMessage,
  getAllMessages,
  markAsRead,
  markAllMessagesAsRead,
  deleteMessage,
  replyMessage
} from '../controllers/message.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/submit', submitMessage); // Public: submit message
router.get('/', protect, adminOnly, getAllMessages); // Admin: get all
router.patch('/mark-all-read', protect, adminOnly, markAllMessagesAsRead); // Admin: mark all as read
router.patch('/:id/read', protect, adminOnly, markAsRead); // Admin: mark as read
router.post('/:id/reply', protect, adminOnly, replyMessage); // Admin: reply via email
router.delete('/:id', protect, adminOnly, deleteMessage); // Admin: delete message

export default router;
