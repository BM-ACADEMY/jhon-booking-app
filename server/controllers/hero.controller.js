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
    const { title, subtitle, ctaPrimaryText, ctaSecondaryText, videoUrl, stats } = req.body;
    let videoPath = videoUrl;
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    let parsedStats = stats;
    if (typeof stats === 'string') {
      try {
        parsedStats = JSON.parse(stats);
      } catch (e) {
        parsedStats = [];
      }
    }

    if (req.file) {
      videoPath = `${baseUrl}/uploads/${req.file.filename}`;
    }

    let hero = await Hero.findOne().sort({ createdAt: -1 });

    if (hero) {
      // Delete old local file if a new one is uploaded
      if (req.file && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
        const relativePath = hero.videoUrl.split(`${baseUrl}`)[1] || hero.videoUrl;
        const oldPath = path.join(process.cwd(), relativePath);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      hero.title = title || hero.title;
      hero.subtitle = subtitle || hero.subtitle;
      hero.ctaPrimaryText = ctaPrimaryText || hero.ctaPrimaryText;
      hero.ctaSecondaryText = ctaSecondaryText || hero.ctaSecondaryText;
      hero.videoUrl = videoPath !== undefined ? videoPath : hero.videoUrl;
      hero.stats = parsedStats || hero.stats;
      await hero.save();
    } else {
      hero = await Hero.create({
        title,
        subtitle,
        ctaPrimaryText,
        ctaSecondaryText,
        videoUrl: videoPath,
        stats: parsedStats || []
      });
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
