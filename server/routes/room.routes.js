import express from 'express';
import {
  getRooms,
  getAllRoomsAdmin,
  getRoomById,
  getLatestDraft,
  createRoom,
  updateRoom,
  deleteRoom,
  recordVisit,
  getAdminVisitorsStats,
  getAdminRoomVisits
} from '../controllers/room.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// ── Admin-specific (must come BEFORE /:id wildcard) ─────────────────────────
router.get('/admin/all', protect, adminOnly, getAllRoomsAdmin);
router.get('/admin/draft', protect, adminOnly, getLatestDraft);
router.get('/admin/visitors-stats', protect, adminOnly, getAdminVisitorsStats);
router.get('/admin/visits/:id', protect, adminOnly, getAdminRoomVisits);

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/:id/visit', recordVisit);

// ── Mutations (admin) ────────────────────────────────────────────────────────
router.post('/', protect, adminOnly, upload.array('images', 10), createRoom);
router.put('/:id', protect, adminOnly, upload.array('images', 10), updateRoom);
router.delete('/:id', protect, adminOnly, deleteRoom);

export default router;
