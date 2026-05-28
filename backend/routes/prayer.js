const express = require('express');
const router = express.Router();
const PrayerRequest = require('../models/PrayerRequest');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/prayer - public wall
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const requests = await PrayerRequest.find({ isPublic: true })
      .populate('author', 'name churchEmail avatar')
      .populate('responses.author', 'name churchEmail')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await PrayerRequest.countDocuments({ isPublic: true });
    res.json({ requests, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/prayer - submit request (must be logged in)
router.post('/', protect, async (req, res) => {
  try {
    const { title, body, isAnonymous, isPublic } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
    const request = await PrayerRequest.create({
      author: req.user._id,
      title, body,
      isAnonymous: isAnonymous === true || isAnonymous === 'true',
      isPublic: isPublic !== false && isPublic !== 'false',
    });
    res.status(201).json({ request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/prayer/:id/pray - increment prayer count
router.post('/:id/pray', protect, async (req, res) => {
  try {
    const request = await PrayerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (request.prayedBy.includes(req.user._id)) {
      return res.status(400).json({ error: 'You already prayed for this' });
    }
    request.prayerCount += 1;
    request.prayedBy.push(req.user._id);
    await request.save();

    // Notify the author
    if (!request.author.equals(req.user._id)) {
      await Notification.create({
        user: request.author,
        type: 'prayer_response',
        title: '🙏 Someone is praying for you',
        message: `"${request.title}"`,
        link: '/member/prayer',
      });
    }
    res.json({ prayerCount: request.prayerCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/prayer/:id/respond - add a pastoral/admin response
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Response text required' });
    const request = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      { $push: { responses: { author: req.user._id, text } } },
      { new: true }
    ).populate('responses.author', 'name churchEmail');

    await Notification.create({
      user: request.author,
      type: 'prayer_response',
      title: '✉️ A response was added to your prayer request',
      message: `"${request.title}"`,
      link: '/member/prayer',
    });
    res.json({ request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/prayer/:id/answered - mark as answered (admin or author)
router.patch('/:id/answered', protect, async (req, res) => {
  try {
    const request = await PrayerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (!request.author.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    request.isAnswered = true;
    await request.save();
    res.json({ request });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
