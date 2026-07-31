import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  color: { type: String, default: 'bg-gray-100 text-gray-700' },
  checkInTime: { type: String, default: '' },
  checkOutTime: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
