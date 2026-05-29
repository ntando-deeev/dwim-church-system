const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const { protect, adminOnly } = require('../middleware/auth');

// Get all public playlists (optionally filter by church)
router.get('/', async (req, res) => {
  try {
    const { churchId } = req.query;
    const query = { isPublished: true };
    if (churchId) query.church = churchId;
    const playlists = await Playlist.find(query)
      .populate('items', 'title thumbnailUrl duration views ratingAvg')
      .populate('church', 'name slug logo')
      .sort({ order: 1, createdAt: -1 });
    res.json({ playlists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single playlist
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('items', 'title thumbnailUrl duration views speaker date ratingAvg videoUrl')
      .populate('church', 'name slug logo');
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create playlist (admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, items, churchId, isPublished, order } = req.body;
    const playlist = await Playlist.create({
      title,
      description: description || '',
      items: items || [],
      church: churchId || null,
      isPublished: isPublished !== false,
      order: Number(order) || 0,
      createdBy: req.user._id,
    });
    res.status(201).json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update playlist (admin)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, items, isPublished, order } = req.body;
    const playlist = await Playlist.findByIdAndUpdate(req.params.id, {
      title, description, items, isPublished, order: Number(order) || 0
    }, { new: true }).populate('items', 'title thumbnailUrl duration');
    if (!playlist) return res.status(404).json({ error: 'Not found' });
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to playlist (admin)
router.post('/:id/items', protect, adminOnly, async (req, res) => {
  try {
    const { contentId } = req.body;
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { items: contentId } },
      { new: true }
    ).populate('items', 'title thumbnailUrl duration');
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove item from playlist (admin)
router.delete('/:id/items/:contentId', protect, adminOnly, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $pull: { items: req.params.contentId } },
      { new: true }
    );
    res.json({ playlist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete playlist (admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
