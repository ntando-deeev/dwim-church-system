const mongoose = require('mongoose');

const internalMailSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isDeletedBySender: { type: Boolean, default: false },
  isDeletedByRecipient: { type: Boolean, default: false },
  parentMail: { type: mongoose.Schema.Types.ObjectId, ref: 'InternalMail', default: null },
}, { timestamps: true });

module.exports = mongoose.model('InternalMail', internalMailSchema);
