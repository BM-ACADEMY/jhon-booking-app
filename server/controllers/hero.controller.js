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

// Helper to delete local files
const deleteLocalFile = (relativePath) => {
  if (!relativePath || !relativePath.startsWith('/uploads/')) return;
  const fullPath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (e) {
      console.error(`Error deleting file: ${fullPath}`, e);
    }
  }
};

// Helper to convert uploaded image file to WebP
const processImageFile = async (file) => {
  if (!file) return null;
  const originalPath = file.path;
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

  return `/uploads/${webpFilename}`;
};

let heroCache = null;

export const getHero = async (req, res) => {
  try {
    if (heroCache) {
      return res.json(heroCache);
    }

    let hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // Auto-migrate legacy data into slides if slides are empty
    if (hero && (!hero.slides || hero.slides.length === 0)) {
      if (hero.backgroundImage || hero.videoUrl || hero.titleLine1) {
        hero.slides = [{
          titleLine1: hero.titleLine1 || 'Experience Luxury',
          titleLine2: hero.titleLine2 || 'Never Before',
          subtitle: hero.subtitle || '',
          videoUrl: hero.videoUrl || '',
          backgroundImage: hero.backgroundImage || '',
          mobileImage: ''
        }];
        await hero.save();
      }
    }

    if (hero) {
      let changed = false;
      
      // Sanitize top level fields
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

      // Sanitize slide fields
      if (hero.slides) {
        for (let slide of hero.slides) {
          const cleanSlideImg = sanitizeToRelativePath(slide.backgroundImage);
          const cleanSlideMobileImg = sanitizeToRelativePath(slide.mobileImage);
          const cleanSlideVid = sanitizeToRelativePath(slide.videoUrl);
          
          if (slide.backgroundImage !== cleanSlideImg) {
            slide.backgroundImage = cleanSlideImg;
            changed = true;
          }
          if (slide.mobileImage !== cleanSlideMobileImg) {
            slide.mobileImage = cleanSlideMobileImg;
            changed = true;
          }
          if (slide.videoUrl !== cleanSlideVid) {
            slide.videoUrl = cleanSlideVid;
            changed = true;
          }
        }
      }

      if (changed) {
        await hero.save();
      }
    }
    heroCache = hero || {};
    res.json(heroCache);
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
        deleteLocalFile(imageFile.path);
        if (req.files?.video?.[0]) deleteLocalFile(req.files.video[0].path);
        return res.status(400).json({ message: 'Image size cannot exceed 5MB' });
      }
    }

    if (req.files?.video?.[0]) {
      const videoFile = req.files.video[0];
      const maxVideoSize = 10 * 1024 * 1024; // 10MB
      if (videoFile.size > maxVideoSize) {
        deleteLocalFile(videoFile.path);
        if (req.files?.image?.[0]) deleteLocalFile(req.files.image[0].path);
        return res.status(400).json({ message: 'Video size cannot exceed 10MB' });
      }
    }

    // Handle multipart uploads for video and image
    if (req.files?.video?.[0]) {
      videoPath = `/uploads/${req.files.video[0].filename}`;
    }
    if (req.files?.image?.[0]) {
      imagePath = await processImageFile(req.files.image[0]);
    }

    // If a new video is uploaded, remove any existing image
    if (videoPath && hero?.backgroundImage) {
      deleteLocalFile(hero.backgroundImage);
      hero.backgroundImage = '';
    }
    // If a new image is uploaded, remove any existing video
    if (imagePath && hero?.videoUrl) {
      deleteLocalFile(hero.videoUrl);
      hero.videoUrl = '';
    }

    if (hero) {
      hero.backgroundImage = sanitizeToRelativePath(hero.backgroundImage);
      hero.videoUrl = sanitizeToRelativePath(hero.videoUrl);

      // Delete old local files if new ones are uploaded
      if (req.files?.video?.[0] && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
        deleteLocalFile(hero.videoUrl);
      }
      if (req.files?.image?.[0] && hero.backgroundImage && hero.backgroundImage.includes('/uploads/')) {
        deleteLocalFile(hero.backgroundImage);
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

    heroCache = null;
    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteHeroVideo = async (req, res) => {
  try {
    const hero = await Hero.findOne().sort({ createdAt: -1 });

    if (hero && hero.videoUrl && hero.videoUrl.includes('/uploads/')) {
      deleteLocalFile(hero.videoUrl);
      hero.videoUrl = '';
      await hero.save();
    }
    heroCache = null;
    res.json({ message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- MULTIPLE SLIDES CRUD CONTROLLERS ---

export const addHeroSlide = async (req, res) => {
  try {
    const { titleLine1, titleLine2, subtitle, videoUrl, backgroundImage, mobileImage } = req.body;
    let hero = await Hero.findOne().sort({ createdAt: -1 });
    if (!hero) {
      hero = await Hero.create({ slides: [] });
    }

    // Size Validation
    if (req.files?.image?.[0] && req.files.image[0].size > 5 * 1024 * 1024) {
      deleteLocalFile(req.files.image[0].path);
      return res.status(400).json({ message: 'Desktop image size cannot exceed 5MB' });
    }
    if (req.files?.mobileImage?.[0] && req.files.mobileImage[0].size > 5 * 1024 * 1024) {
      deleteLocalFile(req.files.mobileImage[0].path);
      return res.status(400).json({ message: 'Mobile image size cannot exceed 5MB' });
    }
    if (req.files?.video?.[0] && req.files.video[0].size > 10 * 1024 * 1024) {
      deleteLocalFile(req.files.video[0].path);
      return res.status(400).json({ message: 'Video size cannot exceed 10MB' });
    }

    // Process files
    let finalVideo = sanitizeToRelativePath(videoUrl) || '';
    if (req.files?.video?.[0]) {
      finalVideo = `/uploads/${req.files.video[0].filename}`;
    }
    let finalDesktopImg = sanitizeToRelativePath(backgroundImage) || '';
    if (req.files?.image?.[0]) {
      finalDesktopImg = await processImageFile(req.files.image[0]);
    }
    let finalMobileImg = sanitizeToRelativePath(mobileImage) || '';
    if (req.files?.mobileImage?.[0]) {
      finalMobileImg = await processImageFile(req.files.mobileImage[0]);
    }

    // Prioritize video over desktop image
    if (finalVideo) {
      finalDesktopImg = '';
    }

    hero.slides.push({
      titleLine1: titleLine1 || 'Experience Luxury',
      titleLine2: titleLine2 || '',
      subtitle: subtitle || '',
      videoUrl: finalVideo,
      backgroundImage: finalDesktopImg,
      mobileImage: finalMobileImg,
    });

    await hero.save();
    heroCache = null;
    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHeroSlide = async (req, res) => {
  try {
    const { slideId } = req.params;
    const { titleLine1, titleLine2, subtitle, videoUrl, backgroundImage, mobileImage } = req.body;
    const hero = await Hero.findOne().sort({ createdAt: -1 });
    if (!hero) {
      return res.status(404).json({ message: 'Hero config not found' });
    }

    const slide = hero.slides.id(slideId);
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Size Validation
    if (req.files?.image?.[0] && req.files.image[0].size > 5 * 1024 * 1024) {
      deleteLocalFile(req.files.image[0].path);
      return res.status(400).json({ message: 'Desktop image size cannot exceed 5MB' });
    }
    if (req.files?.mobileImage?.[0] && req.files.mobileImage[0].size > 5 * 1024 * 1024) {
      deleteLocalFile(req.files.mobileImage[0].path);
      return res.status(400).json({ message: 'Mobile image size cannot exceed 5MB' });
    }
    if (req.files?.video?.[0] && req.files.video[0].size > 10 * 1024 * 1024) {
      deleteLocalFile(req.files.video[0].path);
      return res.status(400).json({ message: 'Video size cannot exceed 10MB' });
    }

    // Process file uploads
    let finalVideo = videoUrl !== undefined ? sanitizeToRelativePath(videoUrl) : slide.videoUrl;
    if (req.files?.video?.[0]) {
      deleteLocalFile(slide.videoUrl);
      finalVideo = `/uploads/${req.files.video[0].filename}`;
    }

    let finalDesktopImg = backgroundImage !== undefined ? sanitizeToRelativePath(backgroundImage) : slide.backgroundImage;
    if (req.files?.image?.[0]) {
      deleteLocalFile(slide.backgroundImage);
      finalDesktopImg = await processImageFile(req.files.image[0]);
    }

    let finalMobileImg = mobileImage !== undefined ? sanitizeToRelativePath(mobileImage) : slide.mobileImage;
    if (req.files?.mobileImage?.[0]) {
      deleteLocalFile(slide.mobileImage);
      finalMobileImg = await processImageFile(req.files.mobileImage[0]);
    }

    // Delete opposite assets based on input prioritizations
    if (finalVideo) {
      deleteLocalFile(finalDesktopImg);
      finalDesktopImg = '';
    } else if (finalDesktopImg) {
      deleteLocalFile(finalVideo);
      finalVideo = '';
    }

    slide.titleLine1 = titleLine1 !== undefined ? titleLine1 : slide.titleLine1;
    slide.titleLine2 = titleLine2 !== undefined ? titleLine2 : slide.titleLine2;
    slide.subtitle = subtitle !== undefined ? subtitle : slide.subtitle;
    slide.videoUrl = finalVideo;
    slide.backgroundImage = finalDesktopImg;
    slide.mobileImage = finalMobileImg;

    await hero.save();
    heroCache = null;
    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteHeroSlide = async (req, res) => {
  try {
    const { slideId } = req.params;
    const hero = await Hero.findOne().sort({ createdAt: -1 });
    if (!hero) {
      return res.status(404).json({ message: 'Hero config not found' });
    }

    const slide = hero.slides.id(slideId);
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    // Delete files associated with the slide
    deleteLocalFile(slide.videoUrl);
    deleteLocalFile(slide.backgroundImage);
    deleteLocalFile(slide.mobileImage);

    slide.deleteOne();
    await hero.save();
    heroCache = null;
    res.json(hero);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

