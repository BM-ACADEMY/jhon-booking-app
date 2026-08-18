import PageContent from '../models/PageContent.js';
import fs from 'fs';
import path from 'path';

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

export const getPageContent = async (req, res) => {
  try {
    const { page } = req.params;
    let content = await PageContent.findOne({ page });
    if (!content) {
      // Create default
      content = new PageContent({ page });
      if (page === 'about') {
        content.bannerTitle = 'About Us';
        content.bannerSubtitle = 'Learn more about our heritage and values';
        content.bannerImage = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80';
      } else if (page === 'contact') {
        content.bannerTitle = 'Contact Us';
        content.bannerSubtitle = "Have questions? We're here to help you plan your perfect stay.";
        content.bannerImage = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1920&q=80';
      }
      await content.save();
    }
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error getting page content', error: err.message });
  }
};

export const updatePageContent = async (req, res) => {
  try {
    const { page } = req.params;
    let content = await PageContent.findOne({ page });
    if (!content) {
      content = new PageContent({ page });
    }

    // Handle single fields
    if (req.body.bannerTitle !== undefined) content.bannerTitle = req.body.bannerTitle;
    if (req.body.bannerSubtitle !== undefined) content.bannerSubtitle = req.body.bannerSubtitle;
    if (req.body.storyTitle !== undefined) content.storyTitle = req.body.storyTitle;
    
    // Handle storyContent array if sent
    if (req.body.storyContent) {
      try {
        content.storyContent = Array.isArray(req.body.storyContent) 
          ? req.body.storyContent 
          : JSON.parse(req.body.storyContent);
      } catch (e) {
        // Fallback if not JSON
      }
    }

    // Process files using multer
    const files = req.files || {};

    // 1. Banner Image update (Legacy single)
    if (files.bannerImage && files.bannerImage[0]) {
      // Delete old banner if it is a local upload
      if (content.bannerImage && content.bannerImage.startsWith('/uploads/')) {
        deleteLocalFile(content.bannerImage);
      }
      content.bannerImage = `/uploads/${files.bannerImage[0].filename}`;
    }

    // 1.5. Dynamic Banner Images Array update
    let keptImages = [];
    if (req.body.existingBannerImages) {
      try {
        keptImages = Array.isArray(req.body.existingBannerImages)
          ? req.body.existingBannerImages
          : JSON.parse(req.body.existingBannerImages);
      } catch (e) {}
    }

    // Find and delete removed images
    const oldImages = content.bannerImages || [];
    oldImages.forEach((img) => {
      if (!keptImages.includes(img) && img.startsWith('/uploads/')) {
        deleteLocalFile(img);
      }
    });

    let newBannerImages = [...keptImages];
    if (files.bannerImages && files.bannerImages.length > 0) {
      const uploadedImages = files.bannerImages.map((f) => `/uploads/${f.filename}`);
      newBannerImages = [...newBannerImages, ...uploadedImages];
    }
    content.bannerImages = newBannerImages;

    // 2. Story Images update (4 possible files: storyImage0, storyImage1, storyImage2, storyImage3)
    if (page === 'about') {
      const updatedStoryImages = [...content.storyImages];
      for (let i = 0; i < 4; i++) {
        const fieldName = `storyImage${i}`;
        if (files[fieldName] && files[fieldName][0]) {
          const oldImg = updatedStoryImages[i];
          if (oldImg && oldImg.startsWith('/uploads/')) {
            deleteLocalFile(oldImg);
          }
          updatedStoryImages[i] = `/uploads/${files[fieldName][0].filename}`;
        }
      }
      content.storyImages = updatedStoryImages;
    }

    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error updating page content', error: err.message });
  }
};
