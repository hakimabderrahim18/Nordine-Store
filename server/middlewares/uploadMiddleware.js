import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { cloudinary, isConfigured } from '../config/cloudinary.js';

// Setup local uploads storage directory
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Local Disk Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter (images only)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, jpeg, png, webp)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Custom middleware to handle both local and Cloudinary upload paths
export const uploadImages = (fieldName, maxCount = 5) => {
  const multerUpload = maxCount === 1 ? upload.single(fieldName) : upload.array(fieldName, maxCount);

  return (req, res, next) => {
    multerUpload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file && !req.files) {
        return next();
      }

      try {
        if (isConfigured) {
          // Cloudinary Path
          if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
              folder: 'nordinestore/products',
            });
            // Delete local temp file
            fs.unlinkSync(req.file.path);
            // Overwrite req.file path/filename with Cloudinary secure URL
            req.file.path = result.secure_url;
            req.body[fieldName] = result.secure_url;
          } else if (req.files) {
            const urls = [];
            for (const file of req.files) {
              const result = await cloudinary.uploader.upload(file.path, {
                folder: 'nordinestore/products',
              });
              fs.unlinkSync(file.path);
              urls.push(result.secure_url);
            }
            req.files = req.files.map((file, idx) => ({
              ...file,
              path: urls[idx]
            }));
            req.body[fieldName] = urls;
          }
        } else {
          // Local Storage Path (Fallback)
          // We rewrite paths to client-accessible URLs
          if (req.file) {
            const relativePath = `/uploads/${req.file.filename}`;
            req.file.path = relativePath;
            req.body[fieldName] = relativePath;
          } else if (req.files) {
            const urls = req.files.map(file => `/uploads/${file.filename}`);
            req.files = req.files.map((file, idx) => ({
              ...file,
              path: urls[idx]
  }));
            req.body[fieldName] = urls;
          }
        }
        next();
      } catch (error) {
        console.error('Image Upload Error:', error);
        res.status(500).json({ success: false, message: 'Image upload failed: ' + error.message });
      }
    });
  };
};

const excelFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xls' || ext === '.xlsx' || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only Excel (.xls, .xlsx) or CSV files are allowed'));
  }
};

const excelUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: excelFilter
});

export const uploadExcel = excelUpload.single('file');
