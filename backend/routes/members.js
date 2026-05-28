const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Giving = require('../models/Giving');
const EventRegistration = require('../models/EventRegistration');
const Sermon = require('../models/Sermon');
const { protect } = require('../middleware/auth');

// GET /api/members/directory - public member directory (name, churchEmail, country, avatar)
router.get('/directory', protect, async (req, res) => {
  try {
    const { search, country } = req.query;
    const query = { isActive: true, churchEmail: { $exists: true } };
    if (country) query.country = country;
    if (search) query.name = { $regex: search, $options: 'i' };

    const members = await User.find(query)
      .select('name churchEmail country avatar department bio createdAt')
      .sort({ name: 1 });
    res.json({ members });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/members/dashboard - my dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const [givingData, registrations] = await Promise.all([
      Giving.find({ donor: req.user._id, status: 'completed' }),
      EventRegistration.find({ user: req.user._id }).populate('event', 'title startDate location posterUrl'),
    ]);

    const totalGiven = givingData.reduce((s, r) => s + r.amount, 0);
    const givingByCategory = givingData.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
      return acc;
    }, {});

    res.json({
      totalGiven,
      givingCount: givingData.length,
      givingByCategory,
      eventsRegistered: registrations.length,
      recentRegistrations: registrations.slice(0, 5),
      recentGiving: givingData.slice(0, 5),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/members/bible-verse - verse of the day (rotates daily)
router.get('/bible-verse', async (req, res) => {
  const verses = [
    { text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', ref: 'Jeremiah 29:11' },
    { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
    { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
    { text: 'Trust in the Lord with all your heart and lean not on your own understanding.', ref: 'Proverbs 3:5' },
    { text: 'For God so loved the world that He gave His one and only Son, that whoever believes in Him shall not perish but have eternal life.', ref: 'John 3:16' },
    { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', ref: 'Joshua 1:9' },
    { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },
    { text: 'The Lord will fight for you; you need only to be still.', ref: 'Exodus 14:14' },
    { text: 'And we know that in all things God works for the good of those who love him.', ref: 'Romans 8:28' },
    { text: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
    { text: 'Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.', ref: 'Philippians 4:6' },
    { text: 'The name of the Lord is a fortified tower; the righteous run to it and are safe.', ref: 'Proverbs 18:10' },
    { text: 'Delight yourself in the Lord and he will give you the desires of your heart.', ref: 'Psalm 37:4' },
    { text: 'With God nothing will be impossible.', ref: 'Luke 1:37' },
    { text: 'No weapon formed against you shall prosper.', ref: 'Isaiah 54:17' },
    { text: 'I will never leave you nor forsake you.', ref: 'Hebrews 13:5' },
    { text: 'But they that wait upon the Lord shall renew their strength.', ref: 'Isaiah 40:31' },
    { text: 'This is the day the Lord has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24' },
    { text: 'Greater is He that is in me than he that is in the world.', ref: '1 John 4:4' },
    { text: 'Seek first the kingdom of God and His righteousness, and all these things shall be added to you.', ref: 'Matthew 6:33' },
    { text: 'By his wounds we are healed.', ref: 'Isaiah 53:5' },
    { text: 'The joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
    { text: 'If God is for us, who can be against us?', ref: 'Romans 8:31' },
    { text: 'Let your light so shine before men, that they may see your good works and glorify your Father in heaven.', ref: 'Matthew 5:16' },
    { text: 'Blessed are the pure in heart, for they shall see God.', ref: 'Matthew 5:8' },
    { text: 'Your word is a lamp to my feet and a light to my path.', ref: 'Psalm 119:105' },
    { text: 'The earth is the Lord\'s, and everything in it.', ref: 'Psalm 24:1' },
    { text: 'But seek the welfare of the city where I have sent you, and pray to the Lord on its behalf.', ref: 'Jeremiah 29:7' },
    { text: 'Love one another as I have loved you.', ref: 'John 13:34' },
    { text: 'Every good and perfect gift is from above.', ref: 'James 1:17' },
    { text: 'Be still and know that I am God.', ref: 'Psalm 46:10' },
  ];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const verse = verses[dayOfYear % verses.length];
  res.json({ verse });
});

// PATCH /api/members/profile - update own profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const allowed = ['bio', 'department', 'phone', 'country', 'avatar', 'notifyLiveStream', 'notifyNewSermon', 'notifyNewEvent'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
