const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadPoster, cloudinary } = require('../config/cloudinary');

// Public: get events
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, featured, upcoming } = req.query;
    const query = { isPublished: true };
    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (upcoming === 'true') query.startDate = { $gte: new Date() };
    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort('startDate')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Event.countDocuments(query);
    res.json({ events, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name');
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: create event
router.post('/', protect, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const { title, description, category, startDate, endDate, location, address,
      isRecurring, recurringPattern, registrationRequired, registrationLink,
      capacity, featured, isPublished, tags } = req.body;
    const eventData = {
      title, description, category, location, address,
      startDate: new Date(startDate), endDate: new Date(endDate),
      isRecurring: isRecurring === 'true', recurringPattern,
      registrationRequired: registrationRequired === 'true',
      registrationLink, capacity: Number(capacity) || 0,
      featured: featured === 'true', isPublished: isPublished !== 'false',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdBy: req.user._id
    };
    if (req.file) {
      eventData.posterUrl = req.file.path;
      eventData.posterPublicId = req.file.filename;
    }
    const event = await Event.create(eventData);
    res.status(201).json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update event
router.put('/:id', protect, adminOnly, uploadPoster.single('poster'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const updates = { ...req.body };
    if (req.body.startDate) updates.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updates.endDate = new Date(req.body.endDate);
    if (req.body.tags) updates.tags = req.body.tags.split(',').map(t => t.trim());
    if (req.file) {
      if (event.posterPublicId) await cloudinary.uploader.destroy(event.posterPublicId);
      updates.posterUrl = req.file.path;
      updates.posterPublicId = req.file.filename;
    }
    const updated = await Event.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ event: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete event
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.posterPublicId) await cloudinary.uploader.destroy(event.posterPublicId);
    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
