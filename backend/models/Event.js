const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['service', 'conference', 'prayer', 'youth', 'women', 'men', 'outreach', 'special', 'other'],
    default: 'other'
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, default: 'Main Sanctuary' },
  address: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  posterPublicId: { type: String, default: '' },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', ''],
    default: ''
  },
  registrationRequired: { type: Boolean, default: false },
  registrationLink: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
