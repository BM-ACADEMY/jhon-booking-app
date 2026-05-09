import express from 'express';
import { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } from '../controllers/room.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getRooms);
router.get('/:id', getRoomById);
router.post('/', protect, adminOnly, createRoom);
router.put('/:id', protect, adminOnly, updateRoom);
router.delete('/:id', protect, adminOnly, deleteRoom);

export default router;
