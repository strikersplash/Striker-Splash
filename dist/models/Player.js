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
class Player {
    // Execute a query with enhanced error handling
    static query(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, db_1.executeQuery)(text, params);
            }
            catch (error) {
                console.error("❌ Player.query error:", error);
                // Return safe fallback instead of throwing
                return { rows: [], rowCount: 0 };
            }
        });
    }
    // Find player by ID (excluding deleted players)
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("SELECT * FROM players WHERE id = $1 AND deleted_at IS NULL", [id]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("❌ Error finding player by ID:", error);
                return null;
            }
        });
    }
    // Find player by ID including deleted players (for admin use)
    static findByIdIncludeDeleted(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("SELECT * FROM players WHERE id = $1", [
                    id,
                ]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("❌ Error finding player by ID (include deleted):", error);
                return null;
            }
        });
    }
    // Find player by phone (excluding deleted players)
    static findByPhone(phone) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("SELECT * FROM players WHERE phone = $1 AND deleted_at IS NULL", [phone]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("❌ Error finding player by phone:", error);
                return null;
            }
        });
    }
    // Find player by email (excluding deleted players)
    static findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("SELECT * FROM players WHERE email = $1 AND deleted_at IS NULL", [email]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("❌ Error finding player by email:", error);
                return null;
            }
        });
    }
    // Find player by QR hash (excluding deleted players)
    static findByQRHash(qrHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("SELECT * FROM players WHERE qr_hash = $1 AND deleted_at IS NULL", [qrHash]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("❌ Error finding player by QR hash:", error);
                return null;
            }
        });
    }
    // Create new player
    static create(playerData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, phone, email, dob, residence, qr_hash, age_group, gender, photo_path, password_hash, is_child_account, parent_phone, } = playerData;
                // Hash password if provided
                let hashedPassword = password_hash;
                if (password_hash && !password_hash.startsWith("$2a$")) {
                    const salt = yield bcrypt.genSalt(10);
                    hashedPassword = yield bcrypt.hash(password_hash, salt);
                }
                const result = yield (0, db_1.executeQuery)("INSERT INTO players (name, phone, email, dob, residence, city_village, qr_hash, age_group, gender, photo_path, password_hash, name_locked, name_change_count, kicks_balance, is_child_account, parent_phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, 0, 0, $12, $13) RETURNING *", [
                    name,
                    phone,
                    email,
                    dob,
                    residence,
                    playerData.city_village,
                    qr_hash,
                    age_group,
                    gender,
                    photo_path,
                    hashedPassword,
                    is_child_account || false,
                    parent_phone,
                ]);
                return result.rows[0];
            }
            catch (error) {
                console.error("❌ Error creating player:", error);
                return null;
            }
        });
    }
    // Update player
    static update(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, phone, email, dob, residence, gender, photo_path, password_hash, name_locked, name_change_count, } = updateData;
                // Hash password if provided
                let hashedPassword = password_hash;
                if (password_hash && !password_hash.startsWith("$2a$")) {
                    const salt = yield bcrypt.genSalt(10);
                    hashedPassword = yield bcrypt.hash(password_hash, salt);
                }
                const result = yield (0, db_1.executeQuery)("UPDATE players SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), dob = COALESCE($4, dob), residence = COALESCE($5, residence), city_village = COALESCE($6, city_village), gender = COALESCE($7, gender), photo_path = COALESCE($8, photo_path), password_hash = COALESCE($9, password_hash), name_locked = COALESCE($10, name_locked), name_change_count = COALESCE($11, name_change_count), updated_at = NOW() WHERE id = $12 RETURNING *", [
                    name,
                    phone,
                    email,
                    dob,
                    residence,
                    updateData.city_village,
                    gender,
                    photo_path,
                    hashedPassword,
                    name_locked,
                    name_change_count,
                    id,
                ]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("Error updating player:", error);
                return null;
            }
        });
    }
    // Update player's kicks balance
    static updateKicksBalance(id, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log("KICKS DEBUG - updateKicksBalance called with:", {
                    id,
                    amount,
                });
                // First check current balance
                const checkQuery = "SELECT kicks_balance FROM players WHERE id = $1";
                const checkResult = yield (0, db_1.executeQuery)(checkQuery, [id]);
                const currentBalance = ((_a = checkResult.rows[0]) === null || _a === void 0 ? void 0 : _a.kicks_balance) || 0;
                console.log("KICKS DEBUG - Current balance:", currentBalance);
                const result = yield (0, db_1.executeQuery)("UPDATE players SET kicks_balance = kicks_balance + $1, updated_at = NOW() WHERE id = $2 RETURNING *", [amount, id]);
                const newBalance = ((_b = result.rows[0]) === null || _b === void 0 ? void 0 : _b.kicks_balance) || 0;
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("❌ Error updating kicks balance:", error);
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
    // Count all players
    static countDocuments() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.executeQuery)("SELECT COUNT(*) FROM players");
                return parseInt(result.rows[0].count);
            }
            catch (error) {
                console.error("❌ Error counting players:", error);
                return 0;
            }
        });
    }
    // Search players by name or phone (excluding deleted players)
    static search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cleanQuery = query.trim();
                const searchQuery = `
        SELECT * FROM (
          SELECT *, 
            CASE 
              WHEN LOWER(name) = LOWER($1) THEN 0  -- Exact match
              WHEN LOWER(name) LIKE LOWER($2) THEN 1  -- Starts with
              ELSE 2  -- Contains anywhere
            END as match_rank
          FROM players
          WHERE 
            (name ILIKE $3 
            OR name ILIKE $4
            OR phone LIKE $5
            OR email ILIKE $6)
            AND deleted_at IS NULL
        ) ranked_results
        ORDER BY match_rank, name
        LIMIT 10`;
                const result = yield (0, db_1.executeQuery)(searchQuery, [
                    cleanQuery, // For exact match
                    `${cleanQuery}%`, // For starts with
                    `${cleanQuery}`, // For exact match ILIKE
                    `%${cleanQuery}%`, // For contains
                    `%${cleanQuery}%`, // For phone
                    `%${cleanQuery}%`, // For email
                ]);
                return result.rows;
            }
            catch (error) {
                console.error("❌ Error searching players:", error);
                return [];
            }
        });
    }
    // Generate slug from player name
    static getSlug(player) {
        return player.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/-+/g, "-") // Replace multiple hyphens with single
            .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
    }
    // Find player by slug - SECURITY ENHANCED
    static findBySlug(slug) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if we have multiple players with the same slug
                const result = yield (0, db_1.executeQuery)("SELECT * FROM players");
                const players = result.rows;
                const matchingPlayers = players.filter((player) => this.getSlug(player) === slug);
                if (matchingPlayers.length === 0) {
                    return null;
                }
                if (matchingPlayers.length > 1) {
                    // SECURITY WARNING: Multiple players with same slug detected
                    console.warn(`SECURITY ALERT: Multiple players found with slug "${slug}":`, matchingPlayers.map((p) => ({
                        id: p.id,
                        name: p.name,
                        phone: p.phone,
                    })));
                    // Return null to prevent ambiguous access
                    // This forces authentication-based access instead
                    return null;
                }
                return matchingPlayers[0];
            }
            catch (error) {
                console.error("Error finding player by slug:", error);
                return null;
            }
        });
    }
}
exports.default = Player;
