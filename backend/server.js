require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('combined'));

// Rate limiting — generous limit for uploads; auth endpoints get a tighter sub-limiter below
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Tighter rate limit on auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/signup', require('./routes/signup'));
app.use('/api/users', require('./routes/users'));
app.use('/api/media', require('./routes/media'));
app.use('/api/events', require('./routes/events'));
app.use('/api/sermons', require('./routes/sermons'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tv', require('./routes/tv'));
app.use('/api/mail', require('./routes/mail'));
app.use('/api/prayer', require('./routes/prayer'));
app.use('/api/giving', require('./routes/giving'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/members', require('./routes/members'));
app.use('/api/churches', require('./routes/churches'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/watch-history', require('./routes/watchHistory'));
app.use('/api/ratings', require('./routes/ratings'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
  app.use(express.static(frontendBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Multer / file-upload error handler (must come before the generic error handler)
app.use((err, req, res, next) => {
  const multer = require('multer');
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum allowed size exceeded.' });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  // Cloudinary / unexpected upload errors
  if (err && err.message && err.message.toLowerCase().includes('invalid image')) {
    return res.status(400).json({ error: 'Invalid file type or corrupted file.' });
  }
  next(err);
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Connect DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;
