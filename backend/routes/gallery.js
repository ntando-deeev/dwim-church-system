const express = require('express');
const router = express.Router();
const Media = require('../models/Media');

// Public gallery - images only
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 24, category } = req.query;
    const query = { isPublic: true, type: { $in: ['image', 'poster'] } };
    if (category) query.category = category;
    const images = await Media.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Media.countDocuments(query);
    res.json({ images, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
