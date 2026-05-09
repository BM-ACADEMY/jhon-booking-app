import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Standard', 'Deluxe', 'Suite', 'Presidential'] },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true, default: 2 },
  size: { type: String },
  amenities: [{ type: String }],
  images: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
