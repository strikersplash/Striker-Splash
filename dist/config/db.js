"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv = require("dotenv");
// Load environment variables
dotenv.config();
// Create connection pool with Supabase-optimized settings
exports.pool = new pg_1.Pool({
    user: process.env.DB_USER || 'striker_splash',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'striker_splash',
    password: process.env.DB_PASSWORD || 'striker_splash',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_HOST?.includes("supabase.com")
        ? { rejectUnauthorized: false }
        : false,
    // Optimized pool settings for Supabase
    max: 15, // Maximum connections - good balance for production (30% of total limit)
    min: 3, // Minimum connections to keep open
    idleTimeoutMillis: 30000, // 30 seconds before closing idle connections
    connectionTimeoutMillis: 5000, // 5 second timeout for connecting
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
});
// Connect to database
const connectDB = async () => {
    try {
        const client = await exports.pool.connect();
        console.log('PostgreSQL connected successfully');
        client.release(); // Release the test connection
        // Create uploads directory table if it doesn't exist
        await exports.pool.query(`
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
    }
    catch (error) {
        console.error('PostgreSQL connection error:', error);
        process.exit(1);
    }
};
// Handle pool errors
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
// Helper function to execute queries with retry logic
const executeQuery = async (text, params) => {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const result = await exports.pool.query(text, params);
            return result;
        }
        catch (error) {
            attempt++;
            console.error(`Database query error (attempt ${attempt}/${maxRetries}):`, error.message);
            // If it's a connection error and we haven't exhausted retries, wait and try again
            if (attempt < maxRetries && (error.code === 'ECONNRESET' ||
                error.code === 'ENOTFOUND' ||
                error.message.includes('termination') ||
                error.message.includes('connection'))) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                continue;
            }
            throw error; // Re-throw if it's not a connection error or we've exhausted retries
        }
    }
};
exports.executeQuery = executeQuery;
exports.default = connectDB;
