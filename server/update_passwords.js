import './config/env.js';
import mongoose from 'mongoose';
import User from './models/User.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  const admin = await User.findOne({ email: 'admin@jhon.com' });
  if (admin) {
    admin.password = 'password123';
    await admin.save();
    console.log('Admin password updated successfully');
  }

  const user = await User.findOne({ email: 'user@jhon.com' });
  if (user) {
    user.password = 'password123';
    await user.save();
    console.log('User password updated successfully');
  }
  
  mongoose.disconnect();
}

main().catch(err => console.error(err));
