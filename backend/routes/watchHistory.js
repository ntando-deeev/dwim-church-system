const express = require('express');
const router = express.Router();
const WatchHistory = require('../models/WatchHistory');
const { protect } = require('../middleware/auth');

// Get user's watch history
router.get('/', protect, async (req, res) => {
  try {
    const history = await WatchHistory.find({ user: req.user._id })
      .populate('content', 'title thumbnailUrl duration speaker date category ratingAvg')
      .sort({ watchedAt: -1 })
      .limit(50);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get continue-watching list (incomplete videos)
router.get('/continue', protect, async (req, res) => {
  try {
    const items = await WatchHistory.find({
      user: req.user._id,
      completed: false,
      progressSeconds: { $gt: 10 }
    })
      .populate('content', 'title thumbnailUrl duration speaker date category videoUrl')
      .sort({ watchedAt: -1 })
      .limit(12);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get progress for a specific content
router.get('/:contentId', protect, async (req, res) => {
  try {
    const entry = await WatchHistory.findOne({
      user: req.user._id,
      content: req.params.contentId
    });
    res.json({ progress: entry ? entry.progressSeconds : 0, completed: entry?.completed || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update watch progress (upsert)
router.post('/:contentId', protect, async (req, res) => {
  try {
    const { progressSeconds, durationSeconds } = req.body;
    const completed = durationSeconds > 0 && progressSeconds >= durationSeconds * 0.9;
    const entry = await WatchHistory.findOneAndUpdate(
      { user: req.user._id, content: req.params.contentId },
      {
        progressSeconds: Number(progressSeconds) || 0,
        durationSeconds: Number(durationSeconds) || 0,
        completed,
        watchedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    res.json({ entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear history entry
router.delete('/:contentId', protect, async (req, res) => {
  try {
    await WatchHistory.deleteOne({ user: req.user._id, content: req.params.contentId });
    res.json({ message: 'Removed from history' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all history
router.delete('/', protect, async (req, res) => {
  try {
    await WatchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'Watch history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
