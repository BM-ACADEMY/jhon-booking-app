import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  ratings: {
    communication: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    comfort: { type: Number, required: true, min: 1, max: 5 },
    facilities: { type: Number, required: true, min: 1, max: 5 },
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }],
  verified: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Review', reviewSchema);
