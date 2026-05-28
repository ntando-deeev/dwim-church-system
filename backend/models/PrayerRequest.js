const mongoose = require('mongoose');

const prayerRequestSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  isAnswered: { type: Boolean, default: false },
  prayerCount: { type: Number, default: 0 },
  prayedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  responses: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);
