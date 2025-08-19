"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const bcrypt = require("bcryptjs");
class Staff {
    // Execute a query directly
    static async query(text, params) {
        try {
            return await db_1.pool.query(text, params);
        }
        catch (error) {
            console.error("Database query error:", error);
            throw error;
        }
    }
    // Find staff by ID
    static async findById(id) {
        try {
            const result = await db_1.pool.query("SELECT * FROM staff WHERE id = $1", [
                id,
            ]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error("Error finding staff by ID:", error);
            return null;
        }
    }
    // Find staff by username
    static async findOne(criteria) {
        try {
            if (criteria.username) {
                const result = await db_1.pool.query("SELECT * FROM staff WHERE username = $1", [criteria.username]);
                return result.rows[0] || null;
            }
            return null;
        }
        catch (error) {
            console.error("Error finding staff:", error);
            return null;
        }
    }
    // Create new staff
    static async create(staffData) {
        try {
            const { username, password, name, role } = staffData;
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            const result = await db_1.pool.query("INSERT INTO staff (username, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING *", [username, password_hash, name, role]);
            return result.rows[0];
        }
        catch (error) {
            console.error("Error creating staff:", error);
            return null;
        }
    }
    // Compare password
    static async comparePassword(candidatePassword, hashedPassword) {
        return bcrypt.compare(candidatePassword, hashedPassword);
    }
    // Find all staff
    static async find() {
        try {
            const result = await db_1.pool.query("SELECT id, username, name, role, created_at, updated_at FROM staff");
            return result.rows;
        }
        catch (error) {
            console.error("Error finding all staff:", error);
            return [];
        }
    }
    // Count all staff
    static async countDocuments() {
        try {
            const result = await db_1.pool.query("SELECT COUNT(*) FROM staff");
            return parseInt(result.rows[0].count);
        }
        catch (error) {
            console.error("Error counting staff:", error);
            return 0;
        }
    }
}
exports.default = Staff;
