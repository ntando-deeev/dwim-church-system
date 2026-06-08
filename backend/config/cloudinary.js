const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ─── Image storage ────────────────────────────────────────────────────────
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'dwim/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  }),
});

// ─── Video storage ────────────────────────────────────────────────────────
// multer-storage-cloudinary v4 + cloudinary v2: resource_type:'video' now works correctly.
// chunk_size enables resumable uploads for large files (Cloudinary recommends 6 MB chunks).
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'dwim/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    chunk_size: 6000000,
  }),
});

// ─── Poster storage ───────────────────────────────────────────────────────
const posterStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'dwim/posters',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    transformation: [{ quality: 'auto' }],
  }),
});

// ─── Generic media storage (auto-detects image vs video) ─────────────────
const mediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: isVideo ? 'dwim/videos' : 'dwim/images',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo
        ? ['mp4', 'mov', 'avi', 'mkv', 'webm']
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      ...(isVideo && { chunk_size: 6000000 }),
    };
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'));
    }
    cb(null, true);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only video files are allowed'));
    }
    cb(null, true);
  },
});

const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image or PDF files are allowed'));
    }
    cb(null, true);
  },
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (!ok) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image or video files are allowed'));
    }
    cb(null, true);
  },
});

module.exports = { cloudinary, uploadImage, uploadVideo, uploadPoster, uploadMedia };
