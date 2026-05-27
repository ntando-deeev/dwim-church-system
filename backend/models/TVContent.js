const mongoose = require('mongoose');

const tvContentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['sermon', 'worship', 'prayer', 'teaching', 'testimony', 'event', 'live', 'other'],
    default: 'sermon'
  },
  videoUrl: { type: String, default: '' },        // Cloudinary or YouTube/Vimeo embed URL
  videoPublicId: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  thumbnailPublicId: { type: String, default: '' },
  speaker: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 },          // in seconds
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('TVContent', tvContentSchema);
