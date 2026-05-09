import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  designation: { type: String },
  message: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);
