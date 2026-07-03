import mongoose from 'mongoose';
import Room from '../models/Room.js';
import RoomVisit from '../models/RoomVisit.js';
import https from 'https';
import fs from 'fs';
import path from 'path';

const resolveRedirect = (url, depth = 0) => {
  return new Promise((resolve) => {
    if (depth > 5 || !url || typeof url !== 'string') return resolve(url);
    if (!url.startsWith('http://') && !url.startsWith('https://')) return resolve(url);
    
    https.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        resolve(resolveRedirect(res.headers.location, depth + 1));
      } else {
        resolve(url);
      }
    }).on('error', () => {
      resolve(url);
    });
  });
};

// Helper to count unique visitors using mongo aggregation
const getVisitorCounts = async (roomIds) => {
  try {
    const counts = await RoomVisit.aggregate([
      { $match: { room: { $in: roomIds } } },
      { $group: { _id: '$room', uniqueVisitors: { $addToSet: '$visitorId' } } },
      { $project: { _id: 1, count: { $size: '$uniqueVisitors' } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      countMap[c._id.toString()] = c.count;
    });
    return countMap;
  } catch (err) {
    console.error('Error getting visitor counts:', err);
    return {};
  }
};

// Public: only return published rooms
export const getRooms = async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (available) filter.isAvailable = available === 'true';
    const rooms = await Room.find(filter).sort({ createdAt: -1 });

    const roomIds = rooms.map(r => r._id);
    const visitorCounts = await getVisitorCounts(roomIds);
    const roomsWithVisitors = rooms.map(r => {
      const roomObj = r.toObject();
      roomObj.visitorsCount = visitorCounts[r._id.toString()] || 0;
      return roomObj;
    });

    res.json(roomsWithVisitors);
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
    const rooms = await Room.find(filter).sort({ createdAt: -1 });

    const roomIds = rooms.map(r => r._id);
    const visitorCounts = await getVisitorCounts(roomIds);
    const roomsWithVisitors = rooms.map(r => {
      const roomObj = r.toObject();
      roomObj.visitorsCount = visitorCounts[r._id.toString()] || 0;
      return roomObj;
    });

    res.json(roomsWithVisitors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    let room;
    // Check if the id is a valid Mongo ObjectId
    if (mongoose.isValidObjectId(req.params.id)) {
      room = await Room.findById(req.params.id);
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
      room = await Room.findOne({ name: { $regex: slugRegex } });
    }
    
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Inject visitor count
    const uniqueVisitors = await RoomVisit.distinct('visitorId', { room: room._id });
    const roomObj = room.toObject();
    roomObj.visitorsCount = uniqueVisitors.length;

    res.json(roomObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: get the most recent draft (for resuming)
export const getLatestDraft = async (req, res) => {
  try {
    const draft = await Room.findOne({ status: 'draft' }).sort({ updatedAt: -1 });
    if (!draft) return res.status(404).json({ message: 'No draft found' });
    res.json(draft);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const parseRoomData = (roomData, req) => {
  // Parse numeric fields
  ['price', 'originalPrice', 'guests', 'bedrooms', 'beds', 'bathrooms', 'showers', 'maxAdults', 'maxChildren'].forEach(field => {
    if (roomData[field] !== undefined && roomData[field] !== '') {
      roomData[field] = Number(roomData[field]);
    }
  });

  // Parse JSON fields
  ['amenities', 'highlights', 'datePrices', 'blockedDates'].forEach(field => {
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

    if (roomData.mapLink) {
      roomData.mapLink = await resolveRedirect(roomData.mapLink);
    }

    const room = await Room.create(roomData);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper to delete local files
const deleteLocalFile = (relativePath) => {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return;
  const fullPath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {
      console.error(`Error deleting file: ${fullPath}`, e);
    }
  }
};

export const updateRoom = async (req, res) => {
  try {
    const roomData = parseRoomData({ ...req.body }, req);

    // Fetch the room before updating to identify removed images
    const oldRoom = await Room.findById(req.params.id);
    if (!oldRoom) return res.status(404).json({ message: 'Room not found' });

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

    if (roomData.mapLink) {
      roomData.mapLink = await resolveRedirect(roomData.mapLink);
    }

    const room = await Room.findByIdAndUpdate(req.params.id, roomData, {
      new: true,
      runValidators: true,
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Identify and delete removed images from disk
    const oldUrls = oldRoom.images ? oldRoom.images.map(img => img.url) : [];
    const newUrls = new Set(roomData.images ? roomData.images.map(img => img.url) : []);
    
    const deletedUrls = oldUrls.filter(url => !newUrls.has(url));
    deletedUrls.forEach(deleteLocalFile);

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (room) {
      if (room.images && room.images.length > 0) {
        room.images.forEach(img => deleteLocalFile(img.url));
      }
      await Room.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public: Record a room visit
export const recordVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorId, userId } = req.body;

    if (!visitorId) {
      return res.status(400).json({ message: 'visitorId is required' });
    }

    // Resolve room ID (could be ID or name slug)
    let roomId = id;
    if (!mongoose.isValidObjectId(id)) {
      const words = id.split('-');
      const slugRegex = new RegExp(
        '^\\W*' + 
        words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('\\W+') + 
        '\\W*$', 
        'i'
      );
      const room = await Room.findOne({ name: { $regex: slugRegex } });
      if (!room) return res.status(404).json({ message: 'Room not found' });
      roomId = room._id;
    }

    // Set range for start/end of today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if same visitor logged for same room today
    const existingVisit = await RoomVisit.findOne({
      room: roomId,
      visitorId,
      visitedAt: { $gte: todayStart }
    });

    if (!existingVisit) {
      await RoomVisit.create({
        room: roomId,
        visitorId,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userId: userId || null
      });
    }

    const uniqueVisitors = await RoomVisit.distinct('visitorId', { room: roomId });

    res.json({ success: true, visitorsCount: uniqueVisitors.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get stats of all rooms with visitor count
export const getAdminVisitorsStats = async (req, res) => {
  try {
    const rooms = await Room.find({});
    const roomIds = rooms.map(r => r._id);
    const visitorCounts = await getVisitorCounts(roomIds);
    
    const stats = rooms.map(r => ({
      _id: r._id,
      name: r.name,
      category: r.category,
      price: r.price,
      guests: r.guests,
      visitorsCount: visitorCounts[r._id.toString()] || 0
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: Get detailed visits for a specific room
export const getAdminRoomVisits = async (req, res) => {
  try {
    const { id } = req.params;
    
    const visits = await RoomVisit.find({ room: id })
      .populate('userId', 'name email avatar')
      .sort({ visitedAt: -1 });

    res.json(visits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resolveMapLink = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(450).json({ message: 'URL is required' });
    const resolvedUrl = await resolveRedirect(url);
    res.json({ resolvedUrl });
  } catch (err) {
    res.status(550).json({ message: err.message });
  }
};

