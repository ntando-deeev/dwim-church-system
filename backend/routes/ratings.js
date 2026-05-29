const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const TVContent = require('../models/TVContent');
const { protect } = require('../middleware/auth');

// Get rating for a content item (public)
router.get('/:contentId', async (req, res) => {
  try {
    const content = await TVContent.findById(req.params.contentId).select('ratingAvg ratingCount');
    if (!content) return res.status(404).json({ error: 'Not found' });
    res.json({ avg: content.ratingAvg, count: content.ratingCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's own rating
router.get('/:contentId/mine', protect, async (req, res) => {
  try {
    const rating = await Rating.findOne({ user: req.user._id, content: req.params.contentId });
    res.json({ stars: rating ? rating.stars : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit / update rating
router.post('/:contentId', protect, async (req, res) => {
  try {
    const { stars } = req.body;
    if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1–5' });

    // Upsert the user's rating
    await Rating.findOneAndUpdate(
      { user: req.user._id, content: req.params.contentId },
      { stars: Number(stars) },
      { upsert: true, new: true }
    );

    // Recalculate aggregates
    const agg = await Rating.aggregate([
      { $match: { content: require('mongoose').Types.ObjectId.createFromHexString(req.params.contentId) } },
      { $group: { _id: '$content', sum: { $sum: '$stars' }, count: { $sum: 1 } } }
    ]);
    const sum = agg[0]?.sum || 0;
    const count = agg[0]?.count || 0;
    const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

    await TVContent.findByIdAndUpdate(req.params.contentId, {
      ratingSum: sum, ratingCount: count, ratingAvg: avg
    });

    res.json({ avg, count, userStars: Number(stars) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete rating
router.delete('/:contentId', protect, async (req, res) => {
  try {
    await Rating.deleteOne({ user: req.user._id, content: req.params.contentId });
    const agg = await Rating.aggregate([
      { $match: { content: require('mongoose').Types.ObjectId.createFromHexString(req.params.contentId) } },
      { $group: { _id: '$content', sum: { $sum: '$stars' }, count: { $sum: 1 } } }
    ]);
    const sum = agg[0]?.sum || 0;
    const count = agg[0]?.count || 0;
    const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
    await TVContent.findByIdAndUpdate(req.params.contentId, { ratingSum: sum, ratingCount: count, ratingAvg: avg });
    res.json({ message: 'Rating removed', avg, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
