const express = require('express');
const router = express.Router();
const Church = require('../models/Church');
const TVContent = require('../models/TVContent');
const Playlist = require('../models/Playlist');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadImage } = require('../config/cloudinary');

// ─── PUBLIC ────────────────────────────────────────────────────────────────

// List approved churches
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { paymentStatus: 'approved', isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } },
    ];
    const churches = await Church.find(query)
      .select('-paymentProof -adminUser -approvedBy')
      .sort({ viewCount: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Church.countDocuments(query);
    res.json({ churches, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single church by slug
router.get('/:slug', async (req, res) => {
  try {
    const church = await Church.findOne({ slug: req.params.slug, paymentStatus: 'approved', isActive: true })
      .select('-paymentProof -adminUser -approvedBy');
    if (!church) return res.status(404).json({ error: 'Church not found' });
    church.viewCount = (church.viewCount || 0) + 1;
    await church.save();
    res.json({ church });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get church content
router.get('/:slug/content', async (req, res) => {
  try {
    const church = await Church.findOne({ slug: req.params.slug, paymentStatus: 'approved' });
    if (!church) return res.status(404).json({ error: 'Church not found' });
    const { page = 1, limit = 12, category } = req.query;
    const query = { church: church._id, isPublished: true };
    if (category && category !== 'all') query.category = category;
    const content = await TVContent.find(query)
      .sort({ isPinned: -1, date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await TVContent.countDocuments(query);
    res.json({ content, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get church playlists
router.get('/:slug/playlists', async (req, res) => {
  try {
    const church = await Church.findOne({ slug: req.params.slug });
    if (!church) return res.status(404).json({ error: 'Church not found' });
    const playlists = await Playlist.find({ church: church._id, isPublished: true })
      .populate('items', 'title thumbnailUrl duration views')
      .sort({ order: 1 });
    res.json({ playlists });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHURCH REGISTRATION ──────────────────────────────────────────────────

// Submit church registration (with EcoCash proof)
router.post('/register', uploadImage.single('paymentProof'), async (req, res) => {
  try {
    const {
      name, description, email, country, city, website, phone,
      paymentRef, facebookUrl, youtubeUrl, instagramUrl, whatsappUrl
    } = req.body;

    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    if (!req.file && !req.body.paymentProofUrl) {
      return res.status(400).json({ error: 'Payment proof screenshot is required' });
    }

    // Generate slug from name
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let i = 1;
    while (await Church.findOne({ slug })) { slug = `${baseSlug}-${i++}`; }

    const church = await Church.create({
      name,
      description: description || '',
      email,
      country: country || '',
      city: city || '',
      website: website || '',
      phone: phone || '',
      slug,
      paymentRef: paymentRef || '',
      paymentProof: req.file ? req.file.path : (req.body.paymentProofUrl || ''),
      paymentStatus: 'pending',
      paidAt: new Date(),
      socialLinks: {
        facebook: facebookUrl || '',
        youtube: youtubeUrl || '',
        instagram: instagramUrl || '',
        whatsapp: whatsappUrl || '',
      }
    });

    res.status(201).json({
      message: 'Registration submitted! We will review your payment and activate your channel within 24 hours.',
      churchId: church._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN ────────────────────────────────────────────────────────────────

// List all churches (admin)
router.get('/admin/all', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    const churches = await Church.find(query)
      .populate('adminUser', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ churches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve church
router.patch('/admin/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const church = await Church.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'approved',
      isActive: true,
      approvedAt: new Date(),
      approvedBy: req.user._id,
    }, { new: true });
    if (!church) return res.status(404).json({ error: 'Church not found' });
    res.json({ church, message: `${church.name} approved and activated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject church
router.patch('/admin/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const church = await Church.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'rejected',
      isActive: false,
      rejectionReason: reason || '',
    }, { new: true });
    if (!church) return res.status(404).json({ error: 'Church not found' });
    res.json({ church, message: `${church.name} rejected.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update church details (admin)
router.put('/admin/:id', protect, adminOnly, uploadImage.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.files?.logo?.[0]) updates.logo = req.files.logo[0].path;
    if (req.files?.coverImage?.[0]) updates.coverImage = req.files.coverImage[0].path;
    const church = await Church.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!church) return res.status(404).json({ error: 'Church not found' });
    res.json({ church });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete church
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    await Church.findByIdAndDelete(req.params.id);
    res.json({ message: 'Church deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
