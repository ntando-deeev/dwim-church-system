const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['live_stream', 'new_sermon', 'new_event', 'prayer_response', 'mail', 'announcement', 'giving_confirmed'], default: 'announcement' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
