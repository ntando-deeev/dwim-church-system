const express = require('express');
const router = express.Router();
const InternalMail = require('../models/InternalMail');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/mail/inbox
router.get('/inbox', protect, async (req, res) => {
  try {
    const mails = await InternalMail.find({ to: req.user._id, isDeletedByRecipient: false })
      .populate('from', 'name churchEmail avatar')
      .sort({ createdAt: -1 });
    res.json({ mails });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/mail/sent
router.get('/sent', protect, async (req, res) => {
  try {
    const mails = await InternalMail.find({ from: req.user._id, isDeletedBySender: false })
      .populate('to', 'name churchEmail avatar')
      .sort({ createdAt: -1 });
    res.json({ mails });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/mail/unread-count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await InternalMail.countDocuments({ to: req.user._id, isRead: false, isDeletedByRecipient: false });
    res.json({ count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/mail/send
router.post('/send', protect, async (req, res) => {
  try {
    const { toChurchEmail, subject, body } = req.body;
    if (!toChurchEmail || !subject || !body) return res.status(400).json({ error: 'Recipient, subject and body required' });

    const recipient = await User.findOne({ churchEmail: toChurchEmail.toLowerCase() });
    if (!recipient) return res.status(404).json({ error: 'No member found with that church email' });
    if (recipient._id.equals(req.user._id)) return res.status(400).json({ error: 'You cannot mail yourself' });

    const mail = await InternalMail.create({
      from: req.user._id,
      to: recipient._id,
      subject,
      body,
    });

    await Notification.create({
      user: recipient._id,
      type: 'mail',
      title: `📬 New message from ${req.user.name}`,
      message: subject,
      link: '/member/inbox',
    });

    res.status(201).json({ mail });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/mail/:id/read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const mail = await InternalMail.findOneAndUpdate(
      { _id: req.params.id, to: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!mail) return res.status(404).json({ error: 'Mail not found' });
    res.json({ mail });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/mail/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const mail = await InternalMail.findById(req.params.id);
    if (!mail) return res.status(404).json({ error: 'Mail not found' });
    if (mail.to.equals(req.user._id)) mail.isDeletedByRecipient = true;
    else if (mail.from.equals(req.user._id)) mail.isDeletedBySender = true;
    else return res.status(403).json({ error: 'Forbidden' });
    await mail.save();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
