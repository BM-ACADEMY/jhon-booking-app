import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  roomsCount: { type: Number, default: 1 },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  guests: { type: Number, required: true, default: 1 },
  adults: { type: Number, required: true, default: 1 },
  children: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  paymentId: { type: String }, // Legacy field
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  addons: [{
    name: { type: String },
    price: { type: Number },
    iconType: { type: String }
  }],
  specialRequests: { type: String },
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
