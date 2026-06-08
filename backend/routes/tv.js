const express = require('express');
const router = express.Router();
const TVContent = require('../models/TVContent');
const LiveStream = require('../models/LiveStream');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadVideo, uploadImage, cloudinary } = require('../config/cloudinary');

// ─── Helper: wrap multer middleware so errors are forwarded to next(err) ────
function runUpload(uploadFn) {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
}

// multer .fields() middleware — accepts an optional video file and an optional thumbnail image
const uploadTVFields = uploadVideo.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

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
      { description: { $regex: search, $options: 'i' } },
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
router.post(
  '/content',
  protect,
  adminOnly,
  runUpload(uploadTVFields),
  async (req, res) => {
    try {
      const {
        title, description, category, speaker, date,
        featured, isPublished, isPinned, tags, videoUrl, thumbnailUrl, duration,
      } = req.body;
      const data = {
        title, description,
        category: category || 'sermon',
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
      const videoFile = req.files?.video?.[0];
      const thumbFile = req.files?.thumbnail?.[0];
      if (videoFile) {
        data.videoUrl = videoFile.path;
        data.videoPublicId = videoFile.filename;
      }
      if (thumbFile) {
        data.thumbnailUrl = thumbFile.path;
        data.thumbnailPublicId = thumbFile.filename;
      }
      const item = await TVContent.create(data);
      res.status(201).json({ content: item });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update TV content
router.put(
  '/content/:id',
  protect,
  adminOnly,
  runUpload(uploadTVFields),
  async (req, res) => {
    try {
      const {
        title, description, category, speaker, date,
        featured, isPublished, isPinned, tags, videoUrl, thumbnailUrl, duration,
      } = req.body;
      const update = {
        title, description, category,
        speaker: speaker || '',
        date: date ? new Date(date) : undefined,
        featured: featured === 'true' || featured === true,
        isPublished: isPublished !== 'false' && isPublished !== false,
        isPinned: isPinned === 'true' || isPinned === true,
        tags: tags
          ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean))
          : [],
        videoUrl: videoUrl || '',
        thumbnailUrl: thumbnailUrl || '',
        duration: Number(duration) || 0,
      };
      // Remove undefined keys
      Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

      const videoFile = req.files?.video?.[0];
      const thumbFile = req.files?.thumbnail?.[0];
      if (videoFile || thumbFile) {
        const existing = await TVContent.findById(req.params.id);
        if (videoFile) {
          if (existing?.videoPublicId) {
            await cloudinary.uploader.destroy(existing.videoPublicId, { resource_type: 'video' });
          }
          update.videoUrl = videoFile.path;
          update.videoPublicId = videoFile.filename;
        }
        if (thumbFile) {
          if (existing?.thumbnailPublicId) {
            await cloudinary.uploader.destroy(existing.thumbnailPublicId);
          }
          update.thumbnailUrl = thumbFile.path;
          update.thumbnailPublicId = thumbFile.filename;
        }
      }
      const item = await TVContent.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json({ content: item });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Delete TV content
router.delete('/content/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await TVContent.findById(req.params.id);
    if (item) {
      if (item.videoPublicId) {
        await cloudinary.uploader.destroy(item.videoPublicId, { resource_type: 'video' });
      }
      if (item.thumbnailPublicId) {
        await cloudinary.uploader.destroy(item.thumbnailPublicId);
      }
      await item.deleteOne();
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload thumbnail for TV content
router.post(
  '/content/:id/thumbnail',
  protect,
  adminOnly,
  runUpload(uploadImage.single('thumbnail')),
  async (req, res) => {
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
  }
);

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

// Create stream
router.post('/streams', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, streamUrl, chatUrl, thumbnailUrl, scheduledAt } = req.body;
    const stream = await LiveStream.create({
      title, description, streamUrl, chatUrl, thumbnailUrl,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
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
    const { title, description, streamUrl, chatUrl, thumbnailUrl, scheduledAt } = req.body;
    const update = { title, description, streamUrl, chatUrl, thumbnailUrl };
    if (scheduledAt) update.scheduledAt = new Date(scheduledAt);
    const stream = await LiveStream.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Go live
router.post('/streams/:id/go-live', protect, adminOnly, async (req, res) => {
  try {
    // End any other active streams first
    await LiveStream.updateMany({ isLive: true }, { isLive: false, endedAt: new Date() });
    const stream = await LiveStream.findByIdAndUpdate(
      req.params.id,
      { isLive: true, startedAt: new Date() },
      { new: true }
    );
    res.json({ stream });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End stream
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

// ─── COMMENTS (Watch Party Chat) ─────────────────────────────────────────────
const TVComment = require('../models/TVComment');

// GET comments for a video
router.get('/content/:id/comments', async (req, res) => {
  try {
    const comments = await TVComment.find({ content: req.params.id, isDeleted: false })
      .populate('author', 'name churchEmail avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ comments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a comment on a video
router.post('/content/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
    const item = await TVComment.create({
      content: req.params.id,
      author: req.user._id,
      text: text.trim(),
    });
    const populated = await TVComment.findById(item._id).populate('author', 'name churchEmail avatar');
    res.status(201).json({ comment: populated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a comment on live stream
router.post('/streams/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
    const item = await TVComment.create({
      stream: req.params.id,
      author: req.user._id,
      text: text.trim(),
    });
    const populated = await TVComment.findById(item._id).populate('author', 'name churchEmail avatar');
    res.status(201).json({ comment: populated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET comments for live stream
router.get('/streams/:id/comments', async (req, res) => {
  try {
    const comments = await TVComment.find({ stream: req.params.id, isDeleted: false })
      .populate('author', 'name churchEmail avatar')
      .sort({ createdAt: 1 })
      .limit(200);
    res.json({ comments });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH like/unlike a comment
router.patch('/comments/:id/like', protect, async (req, res) => {
  try {
    const comment = await TVComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Not found' });
    const idx = comment.likes.indexOf(req.user._id);
    if (idx === -1) { comment.likes.push(req.user._id); comment.likeCount += 1; }
    else { comment.likes.splice(idx, 1); comment.likeCount -= 1; }
    await comment.save();
    res.json({ likeCount: comment.likeCount, liked: idx === -1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a comment (author or admin)
router.delete('/comments/:id', protect, async (req, res) => {
  try {
    const comment = await TVComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (!comment.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    comment.isDeleted = true;
    await comment.save();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
