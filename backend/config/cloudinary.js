const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Image/poster storage
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dwim/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

// Video storage
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dwim/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    chunk_size: 6000000
  }
});

// Poster storage
const posterStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'dwim/posters',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    transformation: [{ quality: 'auto' }]
  }
});

// Generic media
const mediaStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: isVideo ? 'dwim/videos' : 'dwim/images',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mkv'],
    };
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

const uploadPoster = multer({
  storage: posterStorage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

module.exports = { cloudinary, uploadImage, uploadVideo, uploadPoster, uploadMedia };
