const mongoose = require('mongoose');

const tvCommentSchema = new mongoose.Schema({
  content: { type: mongoose.Schema.Types.ObjectId, ref: 'TVContent', default: null },
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveStream', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('TVComment', tvCommentSchema);
