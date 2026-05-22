import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpeg', '.jpg', '.png', '.gif', '.mp4', '.webm', '.ogg', '.mov', '.m4v', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Allow if it's a known extension OR if the mimetype starts with image/ or video/
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  if (allowedExts.includes(ext) || isImage || isVideo) {
    return cb(null, true);
  } else {
    console.error(`Rejected file: Ext=${ext}, Mime=${file.mimetype}`);
    cb(new Error(`Only images and videos are allowed! (Detected: ${ext}, ${file.mimetype})`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // Increased to 500MB
});

export default upload;
