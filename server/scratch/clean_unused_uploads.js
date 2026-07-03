import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

import Room from '../models/Room.js';
import Review from '../models/Review.js';
import Hero from '../models/Hero.js';
import Testimonial from '../models/Testimonial.js';

async function run() {
  if (!MONGODB_URI) {
    console.error('No MONGODB_URI found in environment!');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('No uploads directory found. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // 1. Gather all referenced files
  const referencedFiles = new Set();

  const addFilename = (url) => {
    if (!url || typeof url !== 'string') return;
    if (url.includes('/uploads/')) {
      const filename = path.basename(url);
      referencedFiles.add(filename.toLowerCase());
    }
  };

  // Rooms
  const rooms = await Room.find({});
  rooms.forEach(room => {
    if (room.images && room.images.length > 0) {
      room.images.forEach(img => addFilename(img.url));
    }
  });

  // Reviews
  const reviews = await Review.find({});
  reviews.forEach(review => {
    if (review.images && review.images.length > 0) {
      review.images.forEach(img => addFilename(img));
    }
  });

  // Heroes
  const heroes = await Hero.find({});
  heroes.forEach(hero => {
    addFilename(hero.backgroundImage);
    addFilename(hero.videoUrl);
    if (hero.slides && hero.slides.length > 0) {
      hero.slides.forEach(slide => {
        addFilename(slide.backgroundImage);
        addFilename(slide.mobileImage);
        addFilename(slide.videoUrl);
      });
    }
  });

  // Testimonials
  const testimonials = await Testimonial.find({});
  testimonials.forEach(test => {
    addFilename(test.avatar);
  });

  console.log(`Gathered ${referencedFiles.size} referenced files in the database.`);

  // 2. Scan uploads directory and delete unreferenced files
  const files = fs.readdirSync(uploadsDir);
  let deletedCount = 0;
  let savedSpace = 0;

  for (const file of files) {
    const filenameLower = file.toLowerCase();
    if (!referencedFiles.has(filenameLower)) {
      const filePath = path.join(uploadsDir, file);
      try {
        const stats = fs.statSync(filePath);
        savedSpace += stats.size;
        fs.unlinkSync(filePath);
        console.log(`Deleted unused upload: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete file: ${file}`, err);
      }
    }
  }

  console.log(`\nCleanup finished:`);
  console.log(`- Deleted ${deletedCount} unused files.`);
  console.log(`- Freed up ${(savedSpace / (1024 * 1024)).toFixed(2)} MB of space.`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Fatal error during cleanup:', err);
  await mongoose.disconnect();
});
