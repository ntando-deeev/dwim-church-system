const express = require('express');
const router = express.Router();
const TVContent = require('../models/TVContent');
const LiveStream = require('../models/LiveStream');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadVideo, uploadImage } = require('../config/cloudinary');

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// Get all published TV content
router.get('/content', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, featured } = req.query;
    const query = { isPublished: true };
    if (category && category !== 'all') query.category = category;
    if (featured) query.featured = featured === 'true';
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { speaker: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    const content = await TVContent.find(query)
      .populate('createdBy', 'name')
      .sort({ isPinned: -1, date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await TVContent.countDocuments(query);
    res.json({ content, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single TV content + increment views
router.get('/content/:id', async (req, res) => {
  try {
    const item = await TVContent.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('createdBy', 'name');
    if (!item) return res.status(404).json({ error: 'Content not found' });
    res.json({ content: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active live stream (public)
router.get('/live', async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ isLive: true }).sort('-createdAt');
    res.json({ stream: stream || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all upcoming/recent streams (public)
router.get('/streams', async (req, res) => {
  try {
    const streams = await LiveStream.find()
      .populate('createdBy', 'name')
      .sort('-scheduledAt')
      .limit(10);
    res.json({ streams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ROUTES ────────────────────────────────────────────────────────────

// Get ALL TV content for admin
router.get('/admin/content', protect, adminOnly, async (req, res) => {
  try {
    const content = await TVContent.find()
      .populate('createdBy', 'name')
      .sort({ date: -1 });
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create TV content
router.post('/content', protect, adminOnly, uploadVideo.single('video'), async (req, res) => {
  try {
    const { title, description, category, speaker, date, featured, isPublished, isPinned, tags, videoUrl, thumbnailUrl, duration } = req.body;
    const data = {
      title, description, category: category || 'sermon',
      speaker: speaker || '',
      date: date ? new Date(date) : new Date(),
      featured: featured === 'true',
      isPublished: isPublished !== 'false',
      isPinned: isPinned === 'true',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      duration: Number(duration) || 0,
      createdBy: req.user._id,
    };
    if (req.file) {
      data.videoUrl = req.file.path;
      data.videoPublicId = req.file.filename;
    }
    const item = await TVContent.create(data);
    res.status(201).json({ content: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update TV content
router.put('/content/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, category, speaker, date, featured, isPublished, isPinned, tags, videoUrl, thumbnailUrl, duration } = req.body;
    const update = {
      title, description, category,
      speaker: speaker || '',
      date: date ? new Date(date) : undefined,
      featured: featured === 'true' || featured === true,
      isPublished: isPublished !== 'false' && isPublished !== false,
      isPinned: isPinned === 'true' || isPinned === true,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : [],
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      duration: Number(duration) || 0,
    };
    const item = await TVContent.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ content: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete TV content
router.delete('/content/:id', protect, adminOnly, async (req, res) => {
  try {
    await TVContent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload thumbnail for TV content
router.post('/content/:id/thumbnail', protect, adminOnly, uploadImage.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const item = await TVContent.findByIdAndUpdate(
      req.params.id,
      { thumbnailUrl: req.file.path, thumbnailPublicId: req.file.filename },
      { new: true }
    );
    res.json({ thumbnailUrl: item.thumbnailUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LIVE STREAM ADMIN ───────────────────────────────────────────────────────

// Get all streams for admin
router.get('/admin/streams', protect, adminOnly, async (req, res) => {
  try {
    const streams = await LiveStream.find().populate('createdBy', 'name').sort('-createdAt');
    res.json({ streams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a live stream
router.post('/streams', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, streamUrl, chatUrl, thumbnailUrl, scheduledAt } = req.body;
    const stream = await LiveStream.create({
      title, description,
      streamUrl: streamUrl || '',
      chatUrl: chatUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      isLive: false,
      createdBy: req.user._id,
    });
    res.status(201).json({ stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update stream
router.put('/streams/:id', protect, adminOnly, async (req, res) => {
  try {
    const stream = await LiveStream.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stream) return res.status(404).json({ error: 'Stream not found' });
    res.json({ stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Go LIVE
router.post('/streams/:id/go-live', protect, adminOnly, async (req, res) => {
  try {
    // Set all other streams to not live
    await LiveStream.updateMany({}, { isLive: false });
    const stream = await LiveStream.findByIdAndUpdate(
      req.params.id,
      { isLive: true, endedAt: null },
      { new: true }
    );
    res.json({ stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End live stream
router.post('/streams/:id/end', protect, adminOnly, async (req, res) => {
  try {
    const stream = await LiveStream.findByIdAndUpdate(
      req.params.id,
      { isLive: false, endedAt: new Date() },
      { new: true }
    );
    res.json({ stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stream
router.delete('/streams/:id', protect, adminOnly, async (req, res) => {
  try {
    await LiveStream.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
