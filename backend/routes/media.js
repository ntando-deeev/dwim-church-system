const express = require('express');
const router = express.Router();
const Media = require('../models/Media');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadMedia, uploadImage, uploadVideo, uploadPoster, cloudinary } = require('../config/cloudinary');

// ─── Helper: wrap multer middleware so errors are forwarded to next(err) ────
function runUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
}

// Public: get all media
router.get('/', async (req, res) => {
  try {
    const { type, category, page = 1, limit = 20, featured, search } = req.query;
    const query = { isPublic: true };
    if (type) query.type = type;
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
    const media = await Media.find(query)
      .populate('uploadedBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Media.countDocuments(query);
    res.json({ media, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get ALL media (includes private), for management panel
// MUST be before /:id to avoid Express matching 'admin' as an id
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { type, category, page = 1, limit = 30, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    const media = await Media.find(query)
      .populate('uploadedBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Media.countDocuments(query);
    res.json({ media, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get single media + increment views
router.get('/:id', async (req, res) => {
  try {
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('uploadedBy', 'name');
    if (!media) return res.status(404).json({ error: 'Media not found' });
    res.json({ media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: upload image
router.post(
  '/upload/image',
  protect,
  adminOnly,
  runUpload(uploadImage.single('file')),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { title, description, category, tags, featured, isPublic } = req.body;
      const media = await Media.create({
        title: title || req.file.originalname,
        description,
        category: category || 'gallery',
        type: 'image',
        url: req.file.path,
        publicId: req.file.filename,
        size: req.file.size,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        featured: featured === 'true',
        isPublic: isPublic !== 'false',
        uploadedBy: req.user._id,
      });
      res.status(201).json({ media });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin: upload video
router.post(
  '/upload/video',
  protect,
  adminOnly,
  runUpload(uploadVideo.single('file')),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { title, description, category, tags, featured, isPublic } = req.body;
      const media = await Media.create({
        title: title || req.file.originalname,
        description,
        category: category || 'sermon',
        type: 'video',
        url: req.file.path,
        publicId: req.file.filename,
        size: req.file.size,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        featured: featured === 'true',
        isPublic: isPublic !== 'false',
        uploadedBy: req.user._id,
      });
      res.status(201).json({ media });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin: upload poster
router.post(
  '/upload/poster',
  protect,
  adminOnly,
  runUpload(uploadPoster.single('file')),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { title, description, category, tags, featured, isPublic } = req.body;
      const media = await Media.create({
        title: title || req.file.originalname,
        description,
        category: category || 'poster',
        type: 'poster',
        url: req.file.path,
        publicId: req.file.filename,
        size: req.file.size,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        featured: featured === 'true',
        isPublic: isPublic !== 'false',
        uploadedBy: req.user._id,
      });
      res.status(201).json({ media });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin: upload generic (auto-detects image vs video)
router.post(
  '/upload',
  protect,
  adminOnly,
  runUpload(uploadMedia.single('file')),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const { title, description, category, tags, featured, isPublic } = req.body;
      const type = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      const media = await Media.create({
        title: title || req.file.originalname,
        description,
        category: category || 'gallery',
        type,
        url: req.file.path,
        publicId: req.file.filename,
        size: req.file.size,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        featured: featured === 'true',
        isPublic: isPublic !== 'false',
        uploadedBy: req.user._id,
      });
      res.status(201).json({ media });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Admin: delete media
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.publicId) {
      const resourceType = media.type === 'video' ? 'video' : 'image';
      await cloudinary.uploader.destroy(media.publicId, { resource_type: resourceType });
    }
    await media.deleteOne();
    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
