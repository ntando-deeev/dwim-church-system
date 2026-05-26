require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@dwim.org' });
    if (existingAdmin) {
      console.log('✅ Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create default admin
    const admin = await User.create({
      name: 'DWIM Admin',
      email: 'admin@dwim.org',
      password: 'Admin@2024!',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Default admin created:');
    console.log('   Email: admin@dwim.org');
    console.log('   Password: Admin@2024!');
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
