import './config/env.js';
import mongoose from 'mongoose';
import User from './models/User.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  const users = await User.find({});
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });
  mongoose.disconnect();
}

main().catch(err => console.error(err));
