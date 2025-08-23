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
class GameStat {
    // Execute a query directly
    static query(text, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, db_1.executeQuery)(text, params);
            }
            catch (error) {
                console.error("Database query error:", error);
                throw error;
            }
        });
    }
    // Find game stats by player ID
    static find(criteria) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (criteria.player_id) {
                    const result = yield (0, db_1.executeQuery)("SELECT * FROM game_stats WHERE player_id = $1 ORDER BY timestamp DESC", [criteria.player_id]);
                    return result.rows;
                }
                const result = yield (0, db_1.executeQuery)("SELECT * FROM game_stats ORDER BY timestamp DESC LIMIT 100");
                return result.rows;
            }
            catch (error) {
                console.error("Error finding game stats:", error);
                return [];
            }
        });
    }
    // Create new game stat
    static create(gameStatData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { player_id, goals, kicks_used, staff_id, location, competition_type, queue_ticket_id, requeued, first_five_kicks, player_gender, player_age_bracket, consecutive_kicks, } = gameStatData;
                // Try to insert with consecutive_kicks column first, fallback if column doesn't exist
                let result;
                try {
                    result = yield (0, db_1.executeQuery)(`INSERT INTO game_stats 
           (player_id, goals, staff_id, location, competition_type, queue_ticket_id, requeued, first_five_kicks, player_gender, player_age_bracket, consecutive_kicks) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
           RETURNING *`, [
                        player_id,
                        goals,
                        staff_id,
                        location,
                        competition_type || "accuracy",
                        queue_ticket_id,
                        requeued || false,
                        first_five_kicks || false,
                        player_gender,
                        player_age_bracket,
                        consecutive_kicks || null,
                    ]);
                }
                catch (columnError) {
                    // If consecutive_kicks column doesn't exist, insert without it
                    if (columnError.code === "42703") {
                        // column does not exist
                        console.log("consecutive_kicks column not found, inserting without it");
                        result = yield (0, db_1.executeQuery)(`INSERT INTO game_stats 
             (player_id, goals, staff_id, location, competition_type, queue_ticket_id, requeued, first_five_kicks, player_gender, player_age_bracket) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING *`, [
                            player_id,
                            goals,
                            staff_id,
                            location,
                            competition_type || "accuracy",
                            queue_ticket_id,
                            requeued || false,
                            first_five_kicks || false,
                            player_gender,
                            player_age_bracket,
                        ]);
                    }
                    else {
                        throw columnError; // Re-throw if it's a different error
                    }
                }
                return result.rows[0];
            }
            catch (error) {
                console.error("Error creating game stat:", error);
                return null;
            }
        });
    }
    // Get leaderboard
    static getLeaderboard(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { ageGroup, gender, residence, competitionType, limit } = options;
                let query = `
        SELECT 
          p.id,
          p.name as "playerName",
          p.age_group as "ageGroup",
          p.residence,
          p.gender,
          SUM(gs.goals) as "totalGoals",
          COUNT(DISTINCT gs.queue_ticket_id) as "totalSessions"
        FROM 
          game_stats gs
        JOIN 
          players p ON gs.player_id = p.id
        JOIN
          queue_tickets qt ON gs.queue_ticket_id = qt.id
        WHERE 
          qt.status = 'played'
          AND gs.first_five_kicks = true
      `;
                const params = [];
                let paramIndex = 1;
                if (ageGroup) {
                    query += ` AND p.age_group = $${paramIndex}`;
                    params.push(ageGroup);
                    paramIndex++;
                }
                if (gender) {
                    query += ` AND p.gender = $${paramIndex}`;
                    params.push(gender);
                    paramIndex++;
                }
                if (residence) {
                    query += ` AND p.residence ILIKE $${paramIndex}`;
                    params.push(`%${residence}%`);
                    paramIndex++;
                }
                if (competitionType) {
                    query += ` AND gs.competition_type = $${paramIndex}`;
                    params.push(competitionType);
                    paramIndex++;
                }
                query += `
        GROUP BY 
          p.id, p.name, p.age_group, p.residence, p.gender
        ORDER BY 
          "totalGoals" DESC
      `;
                if (limit) {
                    query += ` LIMIT $${paramIndex}`;
                    params.push(limit);
                }
                const result = yield (0, db_1.executeQuery)(query, params);
                return result.rows;
            }
            catch (error) {
                console.error("Error getting leaderboard:", error);
                return [];
            }
        });
    }
    // Get staff activity
    static getStaffActivity(date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const targetDate = date || new Date();
                const startOfDay = new Date(targetDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(targetDate);
                endOfDay.setHours(23, 59, 59, 999);
                const query = `
        SELECT 
          s.id,
          s.name,
          COUNT(gs.id) as "totalSessions",
          SUM(gs.goals) as "totalGoals"
        FROM 
          staff s
        LEFT JOIN 
          game_stats gs ON s.id = gs.staff_id AND gs.timestamp >= $1 AND gs.timestamp <= $2
        GROUP BY 
          s.id, s.name
        ORDER BY 
          "totalSessions" DESC
      `;
                const result = yield (0, db_1.executeQuery)(query, [startOfDay, endOfDay]);
                return result.rows;
            }
            catch (error) {
                console.error("Error getting staff activity:", error);
                return [];
            }
        });
    }
    // Get stats by competition type
    static getStatsByCompetitionType() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
        SELECT 
          gs.competition_type,
          COUNT(gs.id) as "totalSessions",
          SUM(gs.goals) as "totalGoals",
          AVG(gs.goals) as "averageGoals"
        FROM 
          game_stats gs
        GROUP BY 
          gs.competition_type
        ORDER BY 
          "totalSessions" DESC
      `;
                const result = yield (0, db_1.executeQuery)(query);
                return result.rows;
            }
            catch (error) {
                console.error("Error getting stats by competition type:", error);
                return [];
            }
        });
    }
    // Get stats by age group
    static getStatsByAgeGroup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = `
        SELECT 
          p.age_group,
          COUNT(gs.id) as "totalSessions",
          SUM(gs.goals) as "totalGoals",
          AVG(gs.goals) as "averageGoals"
        FROM 
          game_stats gs
        JOIN 
          players p ON gs.player_id = p.id
        GROUP BY 
          p.age_group
        ORDER BY 
          "totalSessions" DESC
      `;
                const result = yield (0, db_1.executeQuery)(query);
                return result.rows;
            }
            catch (error) {
                console.error("Error getting stats by age group:", error);
                return [];
            }
        });
    }
}
exports.default = GameStat;
