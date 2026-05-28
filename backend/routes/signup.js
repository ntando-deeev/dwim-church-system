const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Generate a unique church email from the user's name
async function generateChurchEmail(name) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .join('.');
  let candidate = `${base}@ntando.org`;
  let suffix = 1;
  while (await User.findOne({ churchEmail: candidate })) {
    candidate = `${base}${suffix}@ntando.org`;
    suffix++;
  }
  return candidate;
}

// POST /api/signup
router.post('/', async (req, res) => {
  try {
    const { name, phone, idNumber, country, password } = req.body;

    if (!name || !phone || !idNumber || !country || !password) {
      return res.status(400).json({ error: 'All fields are required: name, phone, ID number, country, password' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check for duplicate phone/idNumber
    const existingId = await User.findOne({ idNumber });
    if (existingId) return res.status(409).json({ error: 'A member with this ID number already exists' });

    const churchEmail = await generateChurchEmail(name);

    const user = await User.create({
      name,
      phone,
      idNumber,
      country,
      email: churchEmail, // church email IS their login email
      churchEmail,
      password,
      role: 'member',
      isActive: true,
    });

    // Welcome notification
    await Notification.create({
      user: user._id,
      type: 'announcement',
      title: '🎉 Welcome to DWIM!',
      message: `Your church email is ${churchEmail}. Use it to log in anytime.`,
      link: '/member',
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user, churchEmail });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
