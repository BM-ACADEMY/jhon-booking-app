import mongoose from 'mongoose';

const addonServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  iconType: { 
    type: String, 
    required: true, 
    enum: ['food', 'room services', 'transport', 'Special Arrangements', 'Guest Services'] 
  }
}, { timestamps: true });

export default mongoose.model('AddonService', addonServiceSchema);
