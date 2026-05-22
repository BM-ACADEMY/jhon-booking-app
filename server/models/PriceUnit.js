import mongoose from 'mongoose';

const priceUnitSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  label: { type: String, required: true, trim: true }
}, { timestamps: true });

export default mongoose.model('PriceUnit', priceUnitSchema);
