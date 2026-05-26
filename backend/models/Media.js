const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['image', 'video', 'poster', 'audio'], required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  category: {
    type: String,
    enum: ['sermon', 'worship', 'event', 'announcement', 'gallery', 'poster', 'other'],
    default: 'other'
  },
  tags: [{ type: String }],
  size: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
