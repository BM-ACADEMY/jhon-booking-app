import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

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
  const allowedExts = ['.jpeg', '.jpg', '.png', '.gif', '.mp4', '.webm', '.ogg', '.mov', '.m4v', '.webp', '.avif', '.heic', '.heif', '.svg', '.bmp', '.tiff'];
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

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // Increased to 500MB
});

const cleanAllFiles = (files) => {
  if (!files) return;
  const deleteFile = (file) => {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (e) {
        console.error(`Error deleting file during cleanup: ${file.path}`, e);
      }
    }
  };
  if (Array.isArray(files)) {
    files.forEach(deleteFile);
  } else if (typeof files === 'object') {
    Object.keys(files).forEach(key => {
      if (Array.isArray(files[key])) {
        files[key].forEach(deleteFile);
      }
    });
  }
};

const convertImagesToWebp = async (files) => {
  if (!files) return;

  const processFile = async (file) => {
    const isImage = file.mimetype.startsWith('image/');

    // Enforce 5MB limit for images
    if (isImage && file.size > 5 * 1024 * 1024) {
      throw new Error(`Image upload limit is 5MB only.`);
    }

    const isSvg = file.mimetype.includes('svg') || file.originalname.endsWith('.svg');
    const isWebpAlready = file.mimetype === 'image/webp' || file.originalname.endsWith('.webp');

    if (isImage && !isSvg && !isWebpAlready) {
      const originalPath = file.path;
      const ext = path.extname(originalPath);
      const webpFilename = file.filename.replace(ext, '.webp');
      const webpPath = path.join(path.dirname(originalPath), webpFilename);

      try {
        await sharp(originalPath)
          .webp({ quality: 80 })
          .toFile(webpPath);

        // Delete the original file
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }

        // Update the file properties
        file.path = webpPath;
        file.filename = webpFilename;
        file.mimetype = 'image/webp';
        file.size = fs.statSync(webpPath).size;
      } catch (err) {
        console.error(`Error converting file ${file.filename} to webp:`, err);
      }
    }
  };

  try {
    if (Array.isArray(files)) {
      await Promise.all(files.map(processFile));
    } else if (typeof files === 'object') {
      // fields upload has the form { fieldname1: [file1, file2], fieldname2: [file3] }
      const fileKeys = Object.keys(files);
      for (const key of fileKeys) {
        if (Array.isArray(files[key])) {
          await Promise.all(files[key].map(processFile));
        }
      }
    }
  } catch (err) {
    cleanAllFiles(files);
    throw err;
  }
};

const upload = {
  array: (fieldName, maxCount) => {
    const middleware = multerUpload.array(fieldName, maxCount);
    return (req, res, next) => {
      middleware(req, res, async (err) => {
        if (err) return next(err);
        try {
          await convertImagesToWebp(req.files);
          next();
        } catch (convErr) {
          next(convErr);
        }
      });
    };
  },
  fields: (fields) => {
    const middleware = multerUpload.fields(fields);
    return (req, res, next) => {
      middleware(req, res, async (err) => {
        if (err) return next(err);
        try {
          await convertImagesToWebp(req.files);
          next();
        } catch (convErr) {
          next(convErr);
        }
      });
    };
  },
  single: (fieldName) => {
    const middleware = multerUpload.single(fieldName);
    return (req, res, next) => {
      middleware(req, res, async (err) => {
        if (err) return next(err);
        try {
          if (req.file) {
            await convertImagesToWebp([req.file]);
          }
          next();
        } catch (convErr) {
          next(convErr);
        }
      });
    };
  }
};

export default upload;

