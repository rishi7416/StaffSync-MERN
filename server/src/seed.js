import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/staffsync');
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@staffsync.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'StaffSync@123';
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = await User.create({ name: 'StaffSync Admin', email, password, role: 'admin' });
    console.log('Created demo admin account.');
  } else {
    console.log('Admin account already exists; no changes made.');
  }
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('Change this demo password and do not use it in production.');
  await mongoose.disconnect();
};
run().catch((err) => { console.error(err); process.exit(1); });
