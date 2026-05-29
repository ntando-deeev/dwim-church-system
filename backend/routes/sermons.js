const express = require('express');
const router = express.Router();
const Sermon = require('../models/Sermon');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadVideo, uploadImage, cloudinary } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer();

// Public: get sermons
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, speaker, series, featured, search } = req.query;
    const query = { isPublished: true };
    if (speaker) query.speaker = { $regex: speaker, $options: 'i' };
    if (series) query.series = { $regex: series, $options: 'i' };
    if (featured) query.featured = featured === 'true';
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { speaker: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { scripture: { $regex: search, $options: 'i' } }
    ];
    const sermons = await Sermon.find(query)
      .populate('createdBy', 'name')
      .sort('-date')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Sermon.countDocuments(query);
    res.json({ sermons, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get single sermon + views
router.get('/:id', async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate('createdBy', 'name');
    if (!sermon) return res.status(404).json({ error: 'Sermon not found' });
    res.json({ sermon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create sermon (with video upload)
router.post('/', protect, adminOnly, uploadVideo.single('video'), async (req, res) => {
  try {
    const { title, speaker, description, scripture, series, date, featured, isPublished, tags, videoUrl, thumbnailUrl } = req.body;
    const sermonData = {
      title, speaker, description, scripture, series,
      date: new Date(date),
      featured: featured === 'true',
      isPublished: isPublished !== 'false',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdBy: req.user._id,
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || ''
    };
    if (req.file) {
      sermonData.videoUrl = req.file.path;
      sermonData.videoPublicId = req.file.filename;
    }
    const sermon = await Sermon.create(sermonData);
    res.status(201).json({ sermon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: upload thumbnail for sermon
router.post('/:id/thumbnail', protect, adminOnly, uploadImage.single('thumbnail'), async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ error: 'Sermon not found' });
    if (sermon.thumbnailPublicId) await cloudinary.uploader.destroy(sermon.thumbnailPublicId);
    sermon.thumbnailUrl = req.file.path;
    sermon.thumbnailPublicId = req.file.filename;
    await sermon.save();
    res.json({ sermon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update sermon (accepts multipart so a video can also be replaced on edit)
router.put('/:id', protect, adminOnly, uploadVideo.single('video'), async (req, res) => {
  try {
    const { title, speaker, description, scripture, series, date, featured, isPublished, tags, videoUrl, thumbnailUrl } = req.body;
    const updates = {
      title, speaker, description, scripture, series,
      date: date ? new Date(date) : undefined,
      featured: featured === 'true',
      isPublished: isPublished !== 'false',
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
      videoUrl: videoUrl || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
    };
    // Remove undefined keys so we don't accidentally overwrite existing values
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);
    if (req.file) {
      // Replace video — delete old one from Cloudinary first
      const existing = await Sermon.findById(req.params.id);
      if (existing && existing.videoPublicId) {
        await cloudinary.uploader.destroy(existing.videoPublicId, { resource_type: 'video' });
      }
      updates.videoUrl = req.file.path;
      updates.videoPublicId = req.file.filename;
    }
    const sermon = await Sermon.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!sermon) return res.status(404).json({ error: 'Sermon not found' });
    res.json({ sermon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete sermon
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ error: 'Sermon not found' });
    if (sermon.videoPublicId) await cloudinary.uploader.destroy(sermon.videoPublicId, { resource_type: 'video' });
    if (sermon.thumbnailPublicId) await cloudinary.uploader.destroy(sermon.thumbnailPublicId);
    await sermon.deleteOne();
    res.json({ message: 'Sermon deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
