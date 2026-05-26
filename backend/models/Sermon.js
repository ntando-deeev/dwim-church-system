const mongoose = require('mongoose');

const sermonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  speaker: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  scripture: { type: String, default: '' },
  series: { type: String, default: '' },
  date: { type: Date, required: true },
  videoUrl: { type: String, default: '' },
  videoPublicId: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  audioPublicId: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  thumbnailPublicId: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  tags: [{ type: String }],
  notesUrl: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Sermon', sermonSchema);
