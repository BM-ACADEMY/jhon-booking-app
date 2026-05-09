import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jhon-booking');

  await User.deleteMany({ email: { $in: ['admin@jhon.com', 'user@jhon.com'] } });

  await User.create([
    {
      name: 'Admin',
      email: 'admin@jhon.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1 555-0001',
    },
    {
      name: 'John Doe',
      email: 'user@jhon.com',
      password: 'user123',
      role: 'user',
      phone: '+1 555-0002',
    },
  ]);

  console.log('Seeded successfully');
  console.log('  Admin  →  admin@jhon.com  /  admin123');
  console.log('  User   →  user@jhon.com   /  user123');
  await mongoose.disconnect();
};

seed().catch((err) => { console.error(err); process.exit(1); });
