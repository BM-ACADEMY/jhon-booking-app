import './config/env.js';
import mongoose from 'mongoose';
import Room from './models/Room.js';
import AddonService from './models/AddonService.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const addons = await AddonService.find({});
  console.log('\n--- GLOBAL ADDONS ---');
  console.log(JSON.stringify(addons, null, 2));

  const rooms = await Room.find({});
  console.log('\n--- ROOMS ---');
  rooms.forEach(r => {
    console.log(`Room: ${r.name} (ID: ${r._id})`);
    console.log(`Addons Array: ${JSON.stringify(r.addons)}`);
    console.log(`Status: ${r.status}`);
  });

  mongoose.disconnect();
}

main().catch(err => console.error(err));
