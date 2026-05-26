const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Media = require('../models/Media');
const Event = require('../models/Event');
const Sermon = require('../models/Sermon');
const Announcement = require('../models/Announcement');
const { protect, adminOnly } = require('../middleware/auth');

// Admin dashboard stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers, totalMedia, totalEvents, totalSermons, totalAnnouncements,
      recentMedia, upcomingEvents, latestSermons, activeAnnouncements,
      videoCount, imageCount, posterCount, totalViews
    ] = await Promise.all([
      User.countDocuments(),
      Media.countDocuments(),
      Event.countDocuments({ isPublished: true }),
      Sermon.countDocuments({ isPublished: true }),
      Announcement.countDocuments({ isPublished: true }),
      Media.find().sort('-createdAt').limit(6).populate('uploadedBy', 'name'),
      Event.find({ startDate: { $gte: new Date() }, isPublished: true }).sort('startDate').limit(5),
      Sermon.find({ isPublished: true }).sort('-date').limit(5),
      Announcement.find({ isPublished: true }).sort({ isPinned: -1, createdAt: -1 }).limit(5),
      Media.countDocuments({ type: 'video' }),
      Media.countDocuments({ type: 'image' }),
      Media.countDocuments({ type: 'poster' }),
      Media.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }])
    ]);

    res.json({
      stats: {
        totalUsers, totalMedia, totalEvents, totalSermons, totalAnnouncements,
        videoCount, imageCount, posterCount,
        totalViews: totalViews[0]?.total || 0
      },
      recentMedia, upcomingEvents, latestSermons, activeAnnouncements
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
