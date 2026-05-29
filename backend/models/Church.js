const mongoose = require('mongoose');

const churchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },
  website: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true, trim: true },
  socialLinks: {
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' },
    instagram: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
  },
  // EcoCash payment verification
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  paymentProof: { type: String, default: '' }, // Cloudinary URL of receipt screenshot
  paymentRef: { type: String, default: '' },   // EcoCash transaction reference
  paymentAmount: { type: Number, default: 5 },
  paidAt: { type: Date },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, default: '' },
  // Admin who manages this church
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Slug for public channel URL
  slug: { type: String, unique: true, lowercase: true, trim: true },
  isActive: { type: Boolean, default: false },
  memberCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Church', churchSchema);
