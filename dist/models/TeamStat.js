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
class TeamStat {
    // Update team statistics by adding goals and attempts
    static updateStats(teamId_1, goals_1) {
        return __awaiter(this, arguments, void 0, function* (teamId, goals, attempts = 5) {
            try {
                console.log(`Updating team stats for team ${teamId}: +${goals} goals, +${attempts} attempts`);
                const result = yield db_1.pool.query(`UPDATE team_stats 
         SET total_goals = total_goals + $1, 
             total_attempts = total_attempts + $2,
             last_updated = NOW()
         WHERE team_id = $3 
         RETURNING *`, [goals, attempts, teamId]);
                const updatedStats = result.rows[0] || null;
                if (updatedStats) {
                    console.log(`Team stats updated successfully: ${updatedStats.total_goals} goals, ${updatedStats.total_attempts} attempts`);
                }
                return updatedStats;
            }
            catch (error) {
                console.error("Error updating team stats:", error);
                return null;
            }
        });
    }
    // Get team statistics
    static getByTeamId(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield db_1.pool.query("SELECT * FROM team_stats WHERE team_id = $1", [teamId]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("Error getting team stats:", error);
                return null;
            }
        });
    }
    // Initialize team stats if they don't exist
    static initializeStats(teamId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First, check if stats already exist
                const existing = yield this.getByTeamId(teamId);
                if (existing) {
                    return existing;
                }
                // If not, create new stats
                const result = yield db_1.pool.query(`INSERT INTO team_stats (team_id, total_goals, total_attempts) 
         VALUES ($1, 0, 0) 
         RETURNING *`, [teamId]);
                return result.rows[0] || null;
            }
            catch (error) {
                console.error("Error initializing team stats:", error);
                return null;
            }
        });
    }
}
exports.default = TeamStat;
