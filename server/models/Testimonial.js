import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String },
  message: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  avatar: { type: String },
  color: { type: String, default: 'bg-primary-500' },
  isActive: { type: Boolean, default: true },
  isApproved: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  source: { type: String, enum: ['admin', 'user'], default: 'admin' },
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);
