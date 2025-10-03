import mongoose from 'mongoose';
import { env } from './env.js';

export const db = async () => {
  try {
    await mongoose.connect(env.MONGO_URI); // ✅ waits for DB
    console.log('✅ Connected to database successfully');
  } catch (error) {
    console.error('❌ Error while connecting to database:', error.message);
    process.exit(1); // stop the app if DB connection fails
  }
};
