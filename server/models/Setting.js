import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  email: { type: String, default: 'info@jhonhotel.com' },
  phone: { type: String, default: '+1 (555) 123-4567' },
  address: { type: String, default: '123 Luxury Lane, Beverly Hills, CA 90210' },
  checkInTime: { type: String, default: '14:00' },
  checkOutTime: { type: String, default: '11:00' },
  facebook: { type: String, default: '' },
  instagram: { type: String, default: '' },
  twitter: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  cancelDurationHrs: { type: Number, default: 24 },
  advancePercent1Day: { type: Number, default: 100 },
  advancePercent2Day: { type: Number, default: 50 },
  advancePercent3Day: { type: Number, default: 40 },
  advancePercent4Day: { type: Number, default: 30 },
  advancePercent5To7Days: { type: Number, default: 25 },
  advancePercentAbove7Days: { type: Number, default: 20 },
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);
