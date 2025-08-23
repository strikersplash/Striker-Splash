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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const bcrypt = require("bcryptjs");
class Staff {
    // Execute a query directly
    static query(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield db_1.pool.query(text, params);
            }
            catch (error) {
                console.error("Database query error:", error);
                throw error;
            }
        });
    }
    // Find staff by ID
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.pool.query("SELECT * FROM staff WHERE id = $1", [
                    id,
                ]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("Error finding staff by ID:", error);
                return null;
            }
        });
    }
    // Find staff by username
    static findOne(criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (criteria.username) {
                    const result = yield db_1.pool.query("SELECT * FROM staff WHERE username = $1", [criteria.username]);
                    return result.rows[0] || null;
                }
                return null;
            }
            catch (error) {
                console.error("Error finding staff:", error);
                return null;
            }
        });
    }
    // Create new staff
    static create(staffData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password, name, role } = staffData;
                // Hash password
                const salt = yield bcrypt.genSalt(10);
                const password_hash = yield bcrypt.hash(password, salt);
                const result = yield db_1.pool.query("INSERT INTO staff (username, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING *", [username, password_hash, name, role]);
                return result.rows[0];
            }
            catch (error) {
                console.error("Error creating staff:", error);
                return null;
            }
        });
    }
    // Compare password
    static comparePassword(candidatePassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt.compare(candidatePassword, hashedPassword);
        });
    }
    // Find all staff
    static find() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.pool.query("SELECT id, username, name, role, created_at, updated_at FROM staff");
                return result.rows;
            }
            catch (error) {
                console.error("Error finding all staff:", error);
                return [];
            }
        });
    }
    // Count all staff
    static countDocuments() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.pool.query("SELECT COUNT(*) FROM staff");
                return parseInt(result.rows[0].count);
            }
            catch (error) {
                console.error("Error counting staff:", error);
                return 0;
            }
        });
    }
}
exports.default = Staff;
