const express = require('express');
const router = express.Router();
const Giving = require('../models/Giving');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/giving/my - my giving history
router.get('/my', protect, async (req, res) => {
  try {
    const records = await Giving.find({ donor: req.user._id }).sort({ createdAt: -1 });
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    res.json({ records, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/giving - record a giving entry
router.post('/', protect, async (req, res) => {
  try {
    const { amount, currency, category, note, method } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: 'Amount must be at least 1' });

    const reference = `DWIM-${Date.now()}`;
    const record = await Giving.create({
      donor: req.user._id,
      amount: Number(amount),
      currency: currency || 'USD',
      category: category || 'offering',
      note: note || '',
      method: method || 'online',
      status: 'completed',
      reference,
    });

    await Notification.create({
      user: req.user._id,
      type: 'giving_confirmed',
      title: '💛 Thank you for your giving!',
      message: `$${amount} ${category || 'offering'} recorded. Ref: ${reference}`,
      link: '/member/giving',
    });

    res.status(201).json({ record });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/giving/summary - admin totals
router.get('/summary', protect, adminOnly, async (req, res) => {
  try {
    const summary = await Giving.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    const grandTotal = summary.reduce((s, r) => s + r.total, 0);
    res.json({ summary, grandTotal });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
