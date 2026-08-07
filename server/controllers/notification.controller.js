import Notification from '../models/Notification.js';
import Room from '../models/Room.js';
import PushSubscription from '../models/PushSubscription.js';
import { sendPushToAdmins } from '../utils/push.js';

// Called from booking.controller.js whenever a new booking is created
export const createBookingNotification = async (booking, room) => {
  try {
    const guestName = booking.guestName || 'Guest';
    const resolvedRoom = room || (booking.room ? await Room.findById(booking.room) : null);
    const roomName = resolvedRoom?.name || 'Villa Room';
    const message = `${guestName} booked ${roomName} for ${new Date(booking.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - ${new Date(booking.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

    await Notification.create({
      type: 'booking',
      title: 'New Booking Received',
      message,
      booking: booking._id,
    });

    sendPushToAdmins({
      title: 'New Booking Received',
      body: message,
      url: '/admin/bookings',
    }).catch((err) => console.error('Failed to send push notification:', err));
  } catch (err) {
    console.error('Failed to create booking notification:', err);
  }
};

export const getVapidPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};

export const subscribePush = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid push subscription' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { user: req.user._id, endpoint, keys },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const unsubscribePush = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) await PushSubscription.deleteOne({ endpoint });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
