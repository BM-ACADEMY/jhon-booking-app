import mongoose from 'mongoose';

const roomVisitSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  visitorId: { type: String, required: true }, // unique string generated in frontend localstorage
  ipAddress: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexing for faster lookups
roomVisitSchema.index({ room: 1, visitorId: 1 });
roomVisitSchema.index({ visitedAt: -1 });

export default mongoose.model('RoomVisit', roomVisitSchema);
