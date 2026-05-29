const mongoose = require('mongoose');

const tvContentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['sermon', 'worship', 'prayer', 'teaching', 'testimony', 'event', 'live', 'other'],
    default: 'sermon'
  },
  videoUrl: { type: String, default: '' },
  videoPublicId: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  thumbnailPublicId: { type: String, default: '' },
  speaker: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Multi-church support
  church: { type: mongoose.Schema.Types.ObjectId, ref: 'Church', default: null },
  // Ratings aggregates (denormalized for speed)
  ratingCount: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
  ratingAvg: { type: Number, default: 0 },
  // Download allowed
  allowDownload: { type: Boolean, default: false },
  downloadUrl: { type: String, default: '' },
  // Subtitles / captions
  subtitles: [{
    label: { type: String },   // e.g. "English", "Shona"
    lang: { type: String },    // e.g. "en", "sn"
    url: { type: String },     // .vtt file URL
  }],
}, { timestamps: true });

module.exports = mongoose.model('TVContent', tvContentSchema);
