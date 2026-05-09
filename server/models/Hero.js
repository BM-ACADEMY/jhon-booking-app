import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  videoUrl: { type: String },
  backgroundImage: { type: String },
  ctaPrimaryText: { type: String, default: 'Book Now' },
  ctaSecondaryText: { type: String, default: 'Explore' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Hero', heroSchema);
