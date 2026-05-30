import Hero from '../models/Hero.js';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Helper to sanitize paths saved in DB to a clean relative path starting with /uploads/
const sanitizeToRelativePath = (urlOrPath) => {
  if (!urlOrPath) return '';
  if (urlOrPath.includes('/uploads/')) {
    return '/uploads/' + urlOrPath.split('/uploads/')[1];
  }
  return urlOrPath;
};

export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (hero) {
      let changed = false;
      const cleanImg = sanitizeToRelativePath(hero.backgroundImage);
      const cleanVid = sanitizeToRelativePath(hero.videoUrl);
      
      if (hero.backgroundImage !== cleanImg) {
        hero.backgroundImage = cleanImg;
        changed = true;
      }
      if (hero.videoUrl !== cleanVid) {
        hero.videoUrl = cleanVid;
        changed = true;
      }
      if (changed) {
        await hero.save();
      }
    }
    res.json(hero || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHero = async (req, res) => {
  try {
    let { titleLine1, titleLine2, subtitle, videoUrl, backgroundImage, stats } = req.body;
    if (titleLine1 === '') titleLine1 = undefined;
    if (titleLine2 === '') titleLine2 = undefined;
    
    let videoPath = sanitizeToRelativePath(videoUrl);
    let imagePath = null;

    let parsedStats = stats;
    if (typeof stats === 'string') {
      try {
        parsedStats = JSON.parse(stats);
      } catch (e) {
        parsedStats = [];
      }
    }

    let hero = await Hero.findOne().sort({ createdAt: -1 });

    // Validation: Image <= 5MB, Video <= 10MB
    if (req.files?.image?.[0]) {
      const imageFile = req.files.image[0];
      const maxImageSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxImageSize) {
        if (fs.existsSync(imageFile.path)) {
          fs.unlinkSync(imageFile.path);
        }
        if (req.files?.video?.[0] && fs.existsSync(req.files.video[0].path)) {
          fs.unlinkSync(req.files.video[0].path);
        }
        return res.status(400).json({ message: 'Image size cannot exceed 5MB' });
      }
    }

    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];
      const maxVideoSize = 10 * 1024 * 1024; // 10MB
      if (videoFile.size > maxVideoSize) {
        if (fs.existsSync(videoFile.path)) {
          fs.unlinkSync(videoFile.path);
        }
        if (req.files?.image?.[0] && fs.existsSync(req.files.image[0].path)) {
          fs.unlinkSync(req.files.image[0].path);
        }
        return res.status(400).json({ message: 'Video size cannot exceed 10MB' });
      }
    }

    // Handle multipart uploads for video and image
    if (req.files?.video?.[0]) {
      videoPath = `/uploads/${req.files.video[0].filename}`;
    }
    if (req.files?.image?.[0]) {
      const imgFile = req.files.image[0];
      const originalPath = imgFile.path;
      const parsedPath = path.parse(originalPath);
      const webpFilename = `${parsedPath.name}.webp`;
      const webpPath = path.join(parsedPath.dir, webpFilename);

      // Convert image to webp format using sharp
      await sharp(originalPath)
        .webp({ quality: 85 })
        .toFile(webpPath);

      // Delete the original uploaded file to save space
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      imagePath = `/uploads/${webpFilename}`;
    }

    // If a new video is uploaded, remove any existing image
    if (videoPath && hero?.backgroundImage) {
      const relativePath = sanitizeToRelativePath(hero.backgroundImage);
      const oldPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      hero.backgroundImage = '';
    }
    // If a new image is uploaded, remove any existing video
    if (imagePath && hero?.videoUrl) {
      const relativePath = sanitizeToRelativePath(hero.videoUrl);
      const oldPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      hero.videoUrl = '';
    }

    if (hero) {
      // Auto-heal any corrupted database entries from previous errors to relative paths
      hero.backgroundImage = sanitizeToRelativePath(hero.backgroundImage);
      hero.videoUrl = sanitizeToRelativePath(hero.videoUrl);

      // Delete old local files if new ones are uploaded
      if (req.files?.video?.[0] && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
        const relativePath = sanitizeToRelativePath(hero.videoUrl);
        const oldPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      if (req.files?.image?.[0] && hero.backgroundImage && hero.backgroundImage.includes('/uploads/')) {
        const relativePath = sanitizeToRelativePath(hero.backgroundImage);
        const oldPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      hero.titleLine1 = titleLine1 || hero.titleLine1;
      hero.titleLine2 = titleLine2 || hero.titleLine2;
      hero.subtitle = subtitle || hero.subtitle;
      hero.videoUrl = videoPath !== undefined ? videoPath : hero.videoUrl;
      hero.backgroundImage = imagePath ? imagePath : hero.backgroundImage;
      hero.stats = parsedStats || hero.stats;
      await hero.save();
    } else {
      const heroData = {
        ...(titleLine1 ? { titleLine1 } : {}),
        ...(titleLine2 ? { titleLine2 } : {}),
        subtitle,
        videoUrl: videoPath,
        backgroundImage: imagePath,
        stats: parsedStats || []
      };
      hero = await Hero.create(heroData);
    }

    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteHeroVideo = async (req, res) => {
  try {
    const hero = await Hero.findOne().sort({ createdAt: -1 });

    if (hero && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
      const relativePath = sanitizeToRelativePath(hero.videoUrl);
      const oldPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      hero.videoUrl = '';
      await hero.save();
    }
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
