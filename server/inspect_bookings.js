import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Room from './models/Room.js';

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to', uri);
  await mongoose.connect(uri);
  const bookings = await Booking.find().populate('room');
  console.log('Total bookings:', bookings.length);
  bookings.forEach(b => {
    console.log(`Booking ID: ${b._id} | Room: "${b.room?.name}" | Check-In: ${b.checkIn.toISOString().substring(0, 10)} | Check-Out: ${b.checkOut.toISOString().substring(0, 10)} | Status: ${b.status}`);
  });
  await mongoose.disconnect();
}

main().catch(err => console.error(err));
