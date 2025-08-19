import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resetPasswords = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');

    // Hash password
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    await client.query(
      'UPDATE staff SET password_hash = $1',
      [passwordHash]
    );
    
    await client.query(
      'UPDATE players SET password_hash = $1',
      [passwordHash]
    );
    
    console.log('You can now login with:');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
};

resetPasswords();