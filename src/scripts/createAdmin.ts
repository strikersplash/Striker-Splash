import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Staff from '../models/Staff';

// Load environment variables
dotenv.config();

// Connect to database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/striker_splash';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Staff.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      process.exit(0);
    }

    // Create admin user
    const admin = new Staff({
      username: 'admin',
      password: 'admin123', // Will be hashed by the pre-save hook
      name: 'Administrator',
      role: 'admin'
    });

    await admin.save();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();