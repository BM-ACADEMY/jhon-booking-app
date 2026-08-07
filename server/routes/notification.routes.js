import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush
} from '../controllers/notification.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, getNotifications);
router.get('/unread-count', protect, adminOnly, getUnreadCount);
router.patch('/mark-all-read', protect, adminOnly, markAllNotificationsAsRead);
router.patch('/:id/read', protect, adminOnly, markNotificationAsRead);

router.get('/vapid-public-key', protect, adminOnly, getVapidPublicKey);
router.post('/subscribe', protect, adminOnly, subscribePush);
router.post('/unsubscribe', protect, adminOnly, unsubscribePush);

export default router;
