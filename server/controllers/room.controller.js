import mongoose from 'mongoose';
import Room from '../models/Room.js';

// Public: only return published rooms
export const getRooms = async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (available) filter.isAvailable = available === 'true';
    const rooms = await Room.find(filter).populate('addons').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: return ALL rooms including drafts
export const getAllRoomsAdmin = async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available) filter.isAvailable = available === 'true';
    const rooms = await Room.find(filter).populate('addons').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    let room;
    // Check if the id is a valid Mongo ObjectId
    if (mongoose.isValidObjectId(req.params.id)) {
      room = await Room.findById(req.params.id).populate('addons');
    }
    
    // If not found by ID, query by name-slug
    if (!room) {
      const words = req.params.id.split('-');
      const slugRegex = new RegExp(
        '^\\W*' + 
        words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('\\W+') + 
        '\\W*$', 
        'i'
      );
      room = await Room.findOne({ name: { $regex: slugRegex } }).populate('addons');
    }
    
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get the most recent draft (for resuming)
export const getLatestDraft = async (req, res) => {
  try {
    const draft = await Room.findOne({ status: 'draft' }).populate('addons').sort({ updatedAt: -1 });
    if (!draft) return res.status(404).json({ message: 'No draft found' });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const parseRoomData = (roomData, req) => {
  // Parse numeric fields
  ['price', 'originalPrice', 'guests', 'bedrooms', 'beds', 'bathrooms'].forEach(field => {
    if (roomData[field] !== undefined && roomData[field] !== '') {
      roomData[field] = Number(roomData[field]);
    }
  });

  // Parse JSON fields
  ['amenities', 'highlights', 'datePrices', 'addons'].forEach(field => {
    if (typeof roomData[field] === 'string') {
      try { roomData[field] = JSON.parse(roomData[field]); }
      catch (e) { console.error(`Error parsing ${field}`, e); }
    }
  });

  return roomData;
};

export const createRoom = async (req, res) => {
  try {
    const roomData = parseRoomData({ ...req.body }, req);

    // Handle uploaded files with labels
    const labels = roomData.newImageLabels ? JSON.parse(roomData.newImageLabels) : [];
    delete roomData.newImageLabels;
    if (req.files && req.files.length > 0) {
      roomData.images = req.files.map((file, idx) => ({
        url: `/uploads/${file.filename}`,
        label: labels[idx] 
      }));
    }

    const room = await Room.create(roomData);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const roomData = parseRoomData({ ...req.body }, req);

    // Handle existing images (objects with url+label)
    const existingImages = roomData.existingImages
      ? JSON.parse(roomData.existingImages)
      : [];
    delete roomData.existingImages;

    // Handle new uploaded files
    const newLabels = roomData.newImageLabels ? JSON.parse(roomData.newImageLabels) : [];
    delete roomData.newImageLabels;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, idx) => ({
        url: `/uploads/${file.filename}`,
        label: newLabels[idx] 
      }));
      roomData.images = [...existingImages, ...newImages];
    } else {
      roomData.images = existingImages;
    }

    const room = await Room.findByIdAndUpdate(req.params.id, roomData, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
