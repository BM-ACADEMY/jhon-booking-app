import Hero from '../models/Hero.js';
import fs from 'fs';
import path from 'path';

export const getHero = async (req, res) => {
  try {
    const hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });
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
    let videoPath = videoUrl;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
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

    // Handle multipart uploads for video and image
    if (req.files?.video?.[0]) {
      videoPath = `${baseUrl}/uploads/${req.files.video[0].filename}`;
    }
    if (req.files?.image?.[0]) {
      imagePath = `${baseUrl}/uploads/${req.files.image[0].filename}`;
    }
    // If a new video is uploaded, remove any existing image
    if (videoPath && hero?.backgroundImage) {
      const relativePath = hero.backgroundImage.split(`${baseUrl}`)[1] || hero.backgroundImage;
      const oldPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      hero.backgroundImage = '';
    }
    // If a new image is uploaded, remove any existing video
    if (imagePath && hero?.videoUrl) {
      const relativePath = hero.videoUrl.split(`${baseUrl}`)[1] || hero.videoUrl;
      const oldPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      hero.videoUrl = '';
    }

    if (hero) {
      // Delete old local files if new ones are uploaded
  if (req.files?.video?.[0] && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
    const relativePath = hero.videoUrl.split(`${baseUrl}`)[1] || hero.videoUrl;
    const oldPath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  if (req.files?.image?.[0] && hero.backgroundImage && hero.backgroundImage.includes('/uploads/')) {
    const relativePath = hero.backgroundImage.split(`${baseUrl}`)[1] || hero.backgroundImage;
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
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    
    if (hero && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
      const relativePath = hero.videoUrl.split(`${baseUrl}`)[1] || hero.videoUrl;
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
