const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadImage, cloudinary } = require('../config/cloudinary');

// ─── Helper: wrap multer middleware so errors are forwarded to next(err) ────
function runUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
}

// Public: get announcements
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, pinned } = req.query;
    const query = { isPublished: true, $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: null }] };
    if (type) query.type = type;
    if (pinned) query.isPinned = pinned === 'true';
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Announcement.countDocuments(query);
    res.json({ announcements, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get ALL announcements (including unpublished/expired) for management panel
// MUST be before /:id to avoid Express matching 'admin' as an id
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Announcement.countDocuments();
    res.json({ announcements, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get single
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'name');
    if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create
router.post('/', protect, adminOnly, runUpload(uploadImage.single('image')), async (req, res) => {
  try {
    const { title, content, type, isPinned, isPublished, expiresAt } = req.body;
    const data = {
      title, content, type: type || 'general',
      isPinned: isPinned === 'true',
      isPublished: isPublished !== 'false',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id
    };
    if (req.file) { data.imageUrl = req.file.path; data.imagePublicId = req.file.filename; }
    const announcement = await Announcement.create(data);
    res.status(201).json({ announcement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update
router.put('/:id', protect, adminOnly, runUpload(uploadImage.single('image')), async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });
    const updates = { ...req.body };
    if (req.body.expiresAt) updates.expiresAt = new Date(req.body.expiresAt);
    if (req.file) {
      if (ann.imagePublicId) await cloudinary.uploader.destroy(ann.imagePublicId);
      updates.imageUrl = req.file.path;
      updates.imagePublicId = req.file.filename;
    }
    const updated = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ announcement: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Announcement not found' });
    if (ann.imagePublicId) await cloudinary.uploader.destroy(ann.imagePublicId);
    await ann.deleteOne();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
