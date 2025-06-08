import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create connection pool
export const pool = new Pool({
  user: process.env.DB_USER || 'striker_splash',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'striker_splash',
  password: process.env.DB_PASSWORD || 'striker_splash',
  port: parseInt(process.env.DB_PORT || '5432')
});

// Connect to database
const connectDB = async (): Promise<void> => {
  try {
    await pool.connect();
    console.log('PostgreSQL connected successfully');
    
    // Create uploads directory table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        player_id INTEGER REFERENCES players(id),
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100) NOT NULL,
        size INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    process.exit(1);
  }
};

export default connectDB;