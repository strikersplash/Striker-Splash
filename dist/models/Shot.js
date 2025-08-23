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
class Shot {
    // Execute a query directly
    static query(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, db_1.executeQuery)(text, params);
            }
            catch (error) {
                console.error('Database query error:', error);
                throw error;
            }
        });
    }
    // Find shots by player ID
    static find(criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (criteria.player_id) {
                    const result = yield (0, db_1.executeQuery)('SELECT * FROM shots WHERE player_id = $1 ORDER BY timestamp DESC', [criteria.player_id]);
                    return result.rows;
                }
                const result = yield (0, db_1.executeQuery)('SELECT * FROM shots ORDER BY timestamp DESC LIMIT 100');
                return result.rows;
            }
            catch (error) {
                console.error('Error finding shots:', error);
                return [];
            }
        });
    }
    // Create new shot
    static create(shotData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { player_id, amount, shots_quantity, payment_status, payment_reference } = shotData;
                const result = yield (0, db_1.executeQuery)('INSERT INTO shots (player_id, amount, shots_quantity, payment_status, payment_reference) VALUES ($1, $2, $3, $4, $5) RETURNING *', [player_id, amount, shots_quantity, payment_status, payment_reference]);
                return result.rows[0];
            }
            catch (error) {
                console.error('Error creating shot:', error);
                return null;
            }
        });
    }
    // Get daily revenue
    static getDailyRevenue(date) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const targetDate = date || new Date();
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                const result = yield (0, db_1.executeQuery)('SELECT SUM(amount) as total FROM shots WHERE payment_status = $1 AND timestamp >= $2 AND timestamp <= $3', ['completed', startOfDay, endOfDay]);
                return parseFloat(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0');
            }
            catch (error) {
                console.error('Error getting daily revenue:', error);
                return 0;
            }
        });
    }
    // Get revenue by date range
    static getRevenueByDateRange(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
        SELECT 
          DATE(timestamp) as date,
          SUM(amount) as total
        FROM 
          shots
        WHERE 
          payment_status = $1 AND timestamp >= $2 AND timestamp <= $3
        GROUP BY 
          DATE(timestamp)
        ORDER BY 
          date
      `;
                const result = yield (0, db_1.executeQuery)(query, ['completed', startDate, endDate]);
                return result.rows;
            }
            catch (error) {
                console.error('Error getting revenue by date range:', error);
                return [];
            }
        });
    }
    // Count shots by player
    static countByPlayer(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const result = yield (0, db_1.executeQuery)('SELECT SUM(shots_quantity) as total FROM shots WHERE player_id = $1 AND payment_status = $2', [playerId, 'completed']);
                return parseInt(((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.total) || '0');
            }
            catch (error) {
                console.error('Error counting shots by player:', error);
                return 0;
            }
        });
    }
}
exports.default = Shot;
