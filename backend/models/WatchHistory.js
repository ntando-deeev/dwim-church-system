const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: mongoose.Schema.Types.ObjectId, ref: 'TVContent', required: true },
  progressSeconds: { type: Number, default: 0 },  // continue watching
  durationSeconds: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  watchedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One record per user+content
watchHistorySchema.index({ user: 1, content: 1 }, { unique: true });

module.exports = mongoose.model('WatchHistory', watchHistorySchema);
