import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const MONGODB_URI = process.env.MONGODB_URI;

import Room from '../models/Room.js';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const rooms = await Room.find({});
  for (const r of rooms) {
    console.log(`Room: ${r.name}`);
    r.images.forEach(img => {
      const relativePath = img.url;
      const fullPath = path.join(process.cwd(), relativePath);
      const exists = fs.existsSync(fullPath);
      console.log(`  - URL: ${img.url} | Exists on disk: ${exists}`);
    });
  }
  await mongoose.disconnect();
}

run().catch(console.error);
