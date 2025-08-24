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
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireEndOfDay = exports.getQueueList = exports.getCurrentQueuePosition = exports.getTodaysActivityAdjusted = exports.getTodaysActivity = void 0;
const db_1 = require("../../config/db");
const QueueTicket_1 = __importDefault(require("../../models/QueueTicket"));
// Get today's activity
const getTodaysActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get today's game stats with player names - use same filtering as referee controller
        const query = "SELECT gs.id, gs.player_id, p.name as \"playerName\", gs.goals, gs.staff_id, s.name as \"staffName\", gs.location, gs.competition_type, gs.requeued, gs.timestamp FROM game_stats gs JOIN players p ON gs.player_id = p.id JOIN staff s ON gs.staff_id = s.id WHERE gs.timestamp >= (NOW() AT TIME ZONE 'America/Belize')::date AND gs.timestamp < ((NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day') ORDER BY gs.timestamp DESC";
        const result = yield db_1.pool.query(query);
        res.json(result.rows);
    }
    catch (error) {
        console.error("API Error getting today's activity:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get today's activity",
            activity: [],
        });
    }
});
exports.getTodaysActivity = getTodaysActivity;
// Alternative adjusted version that computes Belize date in application layer to avoid DST/time offset surprises
const getTodaysActivityAdjusted = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Derive current Belize date boundary (UTC-6) WITHOUT relying on DB timezone settings
        const nowUtc = new Date();
        const belizeMillis = nowUtc.getTime() - 6 * 60 * 60 * 1000; // manual offset
        const belizeNow = new Date(belizeMillis);
        const yyyy = belizeNow.getUTCFullYear();
        const mm = String(belizeNow.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(belizeNow.getUTCDate()).padStart(2, "0");
        const belizeDateString = `${yyyy}-${mm}-${dd}`; // date only
        // Build explicit range in UTC by adding back 6h to start and +1 day for end
        const startUtc = new Date(Date.UTC(yyyy, belizeNow.getUTCMonth(), belizeNow.getUTCDate(), 6, 0, 0)); // 00:00 Belize = 06:00 UTC
        const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
        // Query using explicit UTC range (timestamp stored presumably in UTC)
        const query = `
      SELECT gs.id, gs.player_id, p.name as "playerName", gs.goals, gs.staff_id, s.name as "staffName", gs.location, gs.competition_type, gs.requeued, gs.timestamp
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      JOIN staff s ON gs.staff_id = s.id
      WHERE gs.timestamp >= $1 AND gs.timestamp < $2
      ORDER BY gs.timestamp DESC`;
        const result = yield db_1.pool.query(query, [
            startUtc.toISOString(),
            endUtc.toISOString(),
        ]);
        res.json(result.rows);
    }
    catch (error) {
        console.error("API Error getting today's adjusted activity:", error);
        res
            .status(500)
            .json({
            success: false,
            message: "Failed to get adjusted today's activity",
            activity: [],
        });
    }
});
exports.getTodaysActivityAdjusted = getTodaysActivityAdjusted;
// Get current queue position
const getCurrentQueuePosition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentQueuePosition = yield QueueTicket_1.default.getCurrentQueuePosition();
        // Return a proper JSON object even if currentQueuePosition is null
        res.json({
            currentQueuePosition: currentQueuePosition || 0,
            success: true,
        });
    }
    catch (error) {
        console.error("API Error getting current queue position:", error);
        // Return a properly formatted error response
        res.status(500).json({
            error: "An error occurred while getting current queue position",
            success: false,
            currentQueuePosition: 0,
        });
    }
});
exports.getCurrentQueuePosition = getCurrentQueuePosition;
// Get queue list with player details
const getQueueList = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = `
      SELECT 
        qt.ticket_number,
        qt.player_id,
        qt.competition_type,
        qt.team_play,
        qt.status,
        qt.created_at,
        p.name as player_name,
        p.age_group,
    p.phone,
    p.residence,
    p.city_village
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.status = 'in-queue'
      ORDER BY qt.ticket_number ASC
    `;
        const result = yield db_1.pool.query(query);
        res.locals.skipSanitize = true;
        res.json({
            success: true,
            queue: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error("API Error getting queue list:", error);
        res.status(500).json({
            error: "An error occurred while getting queue list",
            success: false,
            queue: [],
            count: 0,
        });
    }
});
exports.getQueueList = getQueueList;
// Expire all tickets at end of day
const expireEndOfDay = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only allow admin to access this API
        if (!req.session.user ||
            req.session.user.role !== "admin") {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }
        const expiredCount = yield QueueTicket_1.default.expireEndOfDay();
        res.json({ success: true, expiredCount });
    }
    catch (error) {
        console.error("Error expiring tickets:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while expiring tickets",
        });
    }
});
exports.expireEndOfDay = expireEndOfDay;
