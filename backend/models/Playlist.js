const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TVContent' }],
  church: { type: mongoose.Schema.Types.ObjectId, ref: 'Church', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Playlist', playlistSchema);
