import app from './app';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initializeDatabase } from '@/utils/initDb';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "";

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Database Connection
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    // Initialize DB with Admin and Categories
    await initializeDatabase();
  } catch (err) {
    console.error('Database connection error:', err);
  }
});
