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
exports.getLeaderboard = void 0;
const db_1 = require("../config/db");
// Get top players by age group and/or location
const getLeaderboard = (ageGroup_1, location_1, ...args_1) => __awaiter(void 0, [ageGroup_1, location_1, ...args_1], void 0, function* (ageGroup, location, limit = 10) {
    try {
        let query = `
      SELECT 
        p.id as "playerId",
        p.name as "playerName",
        p.age_group as "ageGroup",
        p.residence,
        SUM(gs.goals) as "totalGoals"
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
    `;
        const values = [];
        const conditions = [];
        if (ageGroup && ageGroup !== "all") {
            conditions.push(`p.age_group = $${values.length + 1}`);
            values.push(ageGroup);
        }
        if (location && location !== "all") {
            conditions.push(`p.residence ILIKE $${values.length + 1}`);
            values.push(`%${location}%`);
        }
        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }
        query += `
      GROUP BY 
        p.id, p.name, p.age_group, p.residence
      ORDER BY 
        "totalGoals" DESC
      LIMIT $${values.length + 1}
    `;
        values.push(limit);
        const result = yield db_1.pool.query(query, values);
        return result.rows.map((row) => ({
            playerId: row.playerId.toString(),
            playerName: row.playerName,
            ageGroup: row.ageGroup,
            residence: row.residence,
            totalGoals: parseInt(row.totalGoals),
        }));
    }
    catch (error) {
        console.error("Leaderboard error:", error);
        throw new Error("Failed to retrieve leaderboard data");
    }
});
exports.getLeaderboard = getLeaderboard;
