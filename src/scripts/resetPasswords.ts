import { pool } from '../config/db';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resetPasswords = async () => {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');

    // Hash password
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    console.log('Resetting staff passwords...');
    await client.query(
      'UPDATE staff SET password_hash = $1',
      [passwordHash]
    );
    
    console.log('Resetting player passwords...');
    await client.query(
      'UPDATE players SET password_hash = $1',
      [passwordHash]
    );
    
    console.log('Passwords reset successfully!');
    console.log('You can now login with:');
    console.log('- Staff: username: admin, password: password123');
    console.log('- Staff: username: staff, password: password123');
    console.log('- Player: phone: 07700900001, password: password123');
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Error resetting passwords:', error);
    process.exit(1);
  }
};

resetPasswords();