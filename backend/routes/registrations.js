const express = require('express');
const router = express.Router();
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/registrations - register for an event
router.post('/', protect, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const existing = await EventRegistration.findOne({ event: eventId, user: req.user._id });
    if (existing) return res.status(409).json({ error: 'You are already registered for this event' });

    const reg = await EventRegistration.create({ event: eventId, user: req.user._id });

    await Notification.create({
      user: req.user._id,
      type: 'new_event',
      title: '✅ Registration confirmed!',
      message: `You are registered for: ${event.title}`,
      link: '/member/events',
    });

    res.status(201).json({ registration: reg });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/registrations/my - my registrations
router.get('/my', protect, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ user: req.user._id })
      .populate('event', 'title startDate location posterUrl category')
      .sort({ createdAt: -1 });
    res.json({ registrations: regs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/registrations/:eventId - cancel registration
router.delete('/:eventId', protect, async (req, res) => {
  try {
    await EventRegistration.findOneAndDelete({ event: req.params.eventId, user: req.user._id });
    res.json({ message: 'Registration cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
