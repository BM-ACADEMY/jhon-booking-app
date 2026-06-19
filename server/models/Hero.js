import mongoose from 'mongoose';

const slideSchema = new mongoose.Schema({
  titleLine1: { type: String, default: 'Experience Luxury' },
  titleLine2: { type: String },
  subtitle: { type: String },
  videoUrl: { type: String },
  backgroundImage: { type: String },
  mobileImage: { type: String },
});

const heroSchema = new mongoose.Schema({
  title: { type: String }, // legacy field
  titleLine1: { type: String, default: 'Experience Luxury' },
  titleLine2: { type: String },
  subtitle: { type: String },
  videoUrl: { type: String },
  backgroundImage: { type: String },
  
  slides: [slideSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Hero', heroSchema);
