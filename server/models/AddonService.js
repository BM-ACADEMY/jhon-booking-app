import mongoose from 'mongoose';

const addonServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('AddonService', addonServiceSchema);
