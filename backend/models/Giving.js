const mongoose = require('mongoose');

const givingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'USD' },
  category: { type: String, enum: ['tithe', 'offering', 'building_fund', 'missions', 'other'], default: 'offering' },
  note: { type: String, default: '' },
  method: { type: String, enum: ['online', 'cash', 'bank_transfer', 'card'], default: 'online' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  reference: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Giving', givingSchema);
