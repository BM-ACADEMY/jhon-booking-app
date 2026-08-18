import express from 'express';
import { getPageContent, updatePageContent } from '../controllers/pageContent.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.get('/:page', getPageContent);

router.put(
  '/:page',
  protect,
  adminOnly,
  upload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'bannerImages', maxCount: 10 },
    { name: 'storyImage0', maxCount: 1 },
    { name: 'storyImage1', maxCount: 1 },
    { name: 'storyImage2', maxCount: 1 },
    { name: 'storyImage3', maxCount: 1 },
  ]),
  updatePageContent
);

export default router;
