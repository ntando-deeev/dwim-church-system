const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  streamUrl: { type: String, default: '' },        // YouTube Live embed, Zoom, etc.
  chatUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  isLive: { type: Boolean, default: false },
  scheduledAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  viewerCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('LiveStream', liveStreamSchema);
