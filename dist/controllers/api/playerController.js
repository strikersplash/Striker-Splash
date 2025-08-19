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
exports.getTodaysActivity = exports.getAvailableShots = exports.getPlayerById = void 0;
const Player_1 = __importDefault(require("../../models/Player"));
const db_1 = require("../../config/db");
// Get player by ID
const getPlayerById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Player ID is required' });
            return;
        }
        const player = yield Player_1.default.findById(parseInt(id));
        if (!player) {
            res.status(404).json({ error: 'Player not found' });
            return;
        }
        res.json(player);
    }
    catch (error) {
        console.error('Error getting player:', error);
        res.status(500).json({ error: 'An error occurred while getting player' });
    }
});
exports.getPlayerById = getPlayerById;
// Get available shots for player
const getAvailableShots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'Player ID is required' });
            return;
        }
        // Get total shots purchased
        const shotsQuery = 'SELECT SUM(shots_quantity) as total_shots FROM shots WHERE player_id = $1 AND payment_status = $2';
        const shotsResult = yield db_1.pool.query(shotsQuery, [id, 'completed']);
        const totalShots = parseInt(((_a = shotsResult.rows[0]) === null || _a === void 0 ? void 0 : _a.total_shots) || '0');
        // Get total goals logged
        const goalsQuery = 'SELECT SUM(goals) as total_goals FROM game_stats WHERE player_id = $1';
        const goalsResult = yield db_1.pool.query(goalsQuery, [id]);
        const totalGoals = parseInt(((_b = goalsResult.rows[0]) === null || _b === void 0 ? void 0 : _b.total_goals) || '0');
        // Calculate available shots
        const availableShots = Math.max(0, totalShots - totalGoals);
        res.json({
            playerId: parseInt(id),
            totalShots,
            totalGoals,
            availableShots
        });
    }
    catch (error) {
        console.error('Error getting available shots:', error);
        res.status(500).json({ error: 'An error occurred while getting available shots' });
    }
});
exports.getAvailableShots = getAvailableShots;
// Get today's activity
const getTodaysActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get today's game stats with player names
        const query = `
      SELECT 
        gs.id,
        gs.player_id,
        p.name as "playerName",
        gs.goals,
        gs.staff_id,
        s.name as "staffName",
        gs.location,
        gs.timestamp
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      JOIN 
        staff s ON gs.staff_id = s.id
      WHERE 
        gs.timestamp >= $1
      ORDER BY 
        gs.timestamp DESC
    `;
        const result = yield db_1.pool.query(query, [today]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error getting today\'s activity:', error);
        res.status(500).json({ error: 'An error occurred while getting today\'s activity' });
    }
});
exports.getTodaysActivity = getTodaysActivity;
