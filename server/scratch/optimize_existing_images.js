import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import dotenv from 'dotenv';
import heicConvert from 'heic-convert';

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

  const files = fs.readdirSync(uploadsDir);
  console.log(`Found ${files.length} files in uploads directory.`);

  // Map of old filename to new filename (relative/absolute or just basenames)
  const conversionMap = new Map();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.tiff', '.bmp', '.gif', '.avif', '.heic', '.heif'].includes(ext);
    
    if (isImage && ext !== '.webp') {
      const originalPath = path.join(uploadsDir, file);
      const webpFilename = file.replace(new RegExp(`${ext}$`, 'i'), '.webp');
      const webpPath = path.join(uploadsDir, webpFilename);

      console.log(`Converting ${file} to ${webpFilename}...`);
      try {
        let inputBuffer;
        if (ext === '.heic' || ext === '.heif') {
          console.log(`HEIC file detected. Converting via heic-convert: ${file}`);
          const heicBuffer = fs.readFileSync(originalPath);
          inputBuffer = await heicConvert({
            buffer: heicBuffer,
            format: 'JPEG',
            quality: 1
          });
        } else {
          inputBuffer = originalPath;
        }

        await sharp(inputBuffer)
          .webp({ quality: 80 })
          .toFile(webpPath);

        // Delete original file
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        conversionMap.set(file, webpFilename);
        console.log(`Successfully converted ${file} to webp.`);
      } catch (err) {
        console.error(`Failed to convert ${file}:`, err);
      }
    }
  }

  console.log('\nStarting database references update...');
  console.log(`Converted files map:`, Object.fromEntries(conversionMap));

  if (conversionMap.size === 0) {
    console.log('No files were converted. Skipping database update.');
    await mongoose.disconnect();
    return;
  }

  // Helper to replace matching filenames in URL strings
  const updateUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    const filename = path.basename(url);
    if (conversionMap.has(filename)) {
      const newFilename = conversionMap.get(filename);
      // Replace the filename portion of the URL
      return url.replace(filename, newFilename);
    }
    return url;
  };

  // 1. Update Rooms
  const rooms = await Room.find({});
  let roomCount = 0;
  for (const room of rooms) {
    let modified = false;
    if (room.images && room.images.length > 0) {
      for (const img of room.images) {
        const updated = updateUrl(img.url);
        if (updated !== img.url) {
          img.url = updated;
          modified = true;
        }
      }
    }
    if (modified) {
      await room.save();
      roomCount++;
    }
  }
  console.log(`Updated ${roomCount} Room documents.`);

  // 2. Update Reviews
  const reviews = await Review.find({});
  let reviewCount = 0;
  for (const review of reviews) {
    let modified = false;
    if (review.images && review.images.length > 0) {
      const newImages = review.images.map(img => {
        const updated = updateUrl(img);
        if (updated !== img) {
          modified = true;
        }
        return updated;
      });
      if (modified) {
        review.images = newImages;
        await review.save();
        reviewCount++;
      }
    }
  }
  console.log(`Updated ${reviewCount} Review documents.`);

  // 3. Update Hero
  const heroes = await Hero.find({});
  let heroCount = 0;
  for (const hero of heroes) {
    let modified = false;
    if (hero.backgroundImage) {
      const updated = updateUrl(hero.backgroundImage);
      if (updated !== hero.backgroundImage) {
        hero.backgroundImage = updated;
        modified = true;
      }
    }
    if (hero.slides && hero.slides.length > 0) {
      for (const slide of hero.slides) {
        if (slide.backgroundImage) {
          const updated = updateUrl(slide.backgroundImage);
          if (updated !== slide.backgroundImage) {
            slide.backgroundImage = updated;
            modified = true;
          }
        }
        if (slide.mobileImage) {
          const updated = updateUrl(slide.mobileImage);
          if (updated !== slide.mobileImage) {
            slide.mobileImage = updated;
            modified = true;
          }
        }
      }
    }
    if (modified) {
      await hero.save();
      heroCount++;
    }
  }
  console.log(`Updated ${heroCount} Hero documents.`);

  // 4. Update Testimonials
  const testimonials = await Testimonial.find({});
  let testimonialCount = 0;
  for (const test of testimonials) {
    if (test.avatar) {
      const updated = updateUrl(test.avatar);
      if (updated !== test.avatar) {
        test.avatar = updated;
        await test.save();
        testimonialCount++;
      }
    }
  }
  console.log(`Updated ${testimonialCount} Testimonial documents.`);

  console.log('\nAll updates completed successfully.');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Fatal error during execution:', err);
  await mongoose.disconnect();
});
