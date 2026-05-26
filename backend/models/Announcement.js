const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['general', 'urgent', 'event', 'prayer', 'giving'],
    default: 'general'
  },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  isPublished: { type: Boolean, default: true },
  isPinned: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
