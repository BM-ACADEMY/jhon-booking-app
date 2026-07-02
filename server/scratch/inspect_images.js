import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Room from '../models/Room.js';

async function main() {
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to', uri);
  await mongoose.connect(uri);
  const rooms = await Room.find({});
  rooms.forEach(r => {
    console.log(`Room: "${r.name}"`);
    console.log(`Images:`, r.images);
  });
  await mongoose.disconnect();
}
main().catch(err => console.error(err));
