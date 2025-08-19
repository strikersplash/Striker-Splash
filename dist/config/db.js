"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = exports.pool = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Create connection pool with Supabase-optimized settings
exports.pool = new pg_1.Pool({
    user: process.env.DB_USER || 'striker_splash',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'striker_splash',
    password: process.env.DB_PASSWORD || 'striker_splash',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: ((_a = process.env.DB_HOST) === null || _a === void 0 ? void 0 : _a.includes("supabase.com"))
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
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const client = yield exports.pool.connect();
        console.log('PostgreSQL connected successfully');
        client.release(); // Release the test connection
        // Create uploads directory table if it doesn't exist
        yield exports.pool.query(`
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
});
// Handle pool errors
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
// Helper function to execute queries with retry logic
const executeQuery = (text, params) => __awaiter(void 0, void 0, void 0, function* () {
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const result = yield exports.pool.query(text, params);
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
                yield new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                continue;
            }
            throw error; // Re-throw if it's not a connection error or we've exhausted retries
        }
    }
});
exports.executeQuery = executeQuery;
exports.default = connectDB;
