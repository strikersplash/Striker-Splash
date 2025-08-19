"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KickLog = void 0;
const db_1 = require("../config/db");
class KickLog {
    static async create(kickData) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        INSERT INTO kick_log (
          player_id, staff_id, competition_type, match_id, solo_competition_id,
          goals, kicks_used, location, team_id, consecutive_kicks, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
            const values = [
                kickData.player_id,
                kickData.staff_id,
                kickData.competition_type,
                kickData.match_id || null,
                kickData.solo_competition_id || null,
                kickData.goals,
                kickData.kicks_used,
                kickData.location,
                kickData.team_id || null,
                kickData.consecutive_kicks || null,
                kickData.notes || null,
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    static async findById(id) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT kl.*, 
               p.name as player_name,
               s.name as staff_name,
               t.name as team_name
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        JOIN staff s ON kl.staff_id = s.id
        LEFT JOIN teams t ON kl.team_id = t.id
        WHERE kl.id = $1
      `;
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    static async findByMatch(matchId) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT kl.*, 
               p.name as player_name,
               s.name as staff_name,
               t.name as team_name
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        JOIN staff s ON kl.staff_id = s.id
        LEFT JOIN teams t ON kl.team_id = t.id
        WHERE kl.match_id = $1
        ORDER BY kl.created_at DESC
      `;
            const result = await client.query(query, [matchId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async findBySoloCompetition(soloCompetitionId) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT kl.*, 
               p.name as player_name,
               s.name as staff_name
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        JOIN staff s ON kl.staff_id = s.id
        WHERE kl.solo_competition_id = $1
        ORDER BY kl.created_at DESC
      `;
            const result = await client.query(query, [soloCompetitionId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async findByPlayer(playerId, limit = 50) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT kl.*, 
               p.name as player_name,
               s.name as staff_name,
               t.name as team_name,
               CASE 
                 WHEN kl.competition_type = 'match' THEN m.name
                 WHEN kl.competition_type = 'solo' THEN sc.name
               END as competition_name
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        JOIN staff s ON kl.staff_id = s.id
        LEFT JOIN teams t ON kl.team_id = t.id
        LEFT JOIN matches m ON kl.match_id = m.id
        LEFT JOIN solo_competitions sc ON kl.solo_competition_id = sc.id
        WHERE kl.player_id = $1
        ORDER BY kl.created_at DESC
        LIMIT $2
      `;
            const result = await client.query(query, [playerId, limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async getMatchStats(matchId) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT 
          kl.team_id,
          t.name as team_name,
          COUNT(kl.id) as total_kicks,
          SUM(kl.goals) as total_goals,
          SUM(kl.kicks_used) as total_kicks_used,
          ROUND(
            CASE 
              WHEN SUM(kl.kicks_used) > 0 THEN (SUM(kl.goals)::DECIMAL / SUM(kl.kicks_used)) * 100 
              ELSE 0 
            END, 2
          ) as accuracy_percentage,
          COUNT(DISTINCT kl.player_id) as players_participated
        FROM kick_log kl
        JOIN teams t ON kl.team_id = t.id
        WHERE kl.match_id = $1
        GROUP BY kl.team_id, t.name
        ORDER BY total_goals DESC
      `;
            const result = await client.query(query, [matchId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async getSoloCompetitionStats(soloCompetitionId) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT 
          kl.player_id,
          p.name as player_name,
          COUNT(kl.id) as total_kicks,
          SUM(kl.goals) as total_goals,
          SUM(kl.kicks_used) as total_kicks_used,
          ROUND(
            CASE 
              WHEN SUM(kl.kicks_used) > 0 THEN (SUM(kl.goals)::DECIMAL / SUM(kl.kicks_used)) * 100 
              ELSE 0 
            END, 2
          ) as accuracy_percentage,
          MAX(kl.consecutive_kicks) as best_consecutive_kicks
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        WHERE kl.solo_competition_id = $1
        GROUP BY kl.player_id, p.name
        ORDER BY total_goals DESC, accuracy_percentage DESC
      `;
            const result = await client.query(query, [soloCompetitionId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async getRecentActivity(limit = 20) {
        const client = await db_1.pool.connect();
        try {
            // Check if the tables exist to avoid errors
            const checkTablesQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'kick_log'
        ) AS kick_log_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'solo_competitions'
        ) AS solo_comp_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'matches'
        ) AS matches_exists,
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'competitions'
        ) AS competitions_exists
      `;
            const tablesCheck = await client.query(checkTablesQuery);
            const { kick_log_exists, solo_comp_exists, matches_exists, competitions_exists, } = tablesCheck.rows[0];
            // If any essential tables don't exist, return empty array
            if (!kick_log_exists) {
                console.log("kick_log table does not exist, returning empty array");
                return [];
            }
            const query = `
        SELECT 
          kl.*,
          p.name as player_name,
          CASE 
            WHEN kl.match_id IS NOT NULL THEN 'match'
            WHEN kl.solo_competition_id IS NOT NULL THEN 'solo'
            ELSE 'unknown'
          END as competition_type,
          CASE 
            WHEN kl.match_id IS NOT NULL THEN 
              CASE WHEN ${matches_exists} THEN (SELECT name FROM matches WHERE id = kl.match_id) ELSE 'Match' END
            WHEN kl.solo_competition_id IS NOT NULL THEN 
              CASE WHEN ${solo_comp_exists} THEN (SELECT name FROM solo_competitions WHERE id = kl.solo_competition_id) ELSE 'Solo Competition' END
            ELSE 'Unknown'
          END as competition_name
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        ORDER BY kl.created_at DESC
        LIMIT $1
      `;
            const result = await client.query(query, [limit]);
            return result.rows;
        }
        catch (error) {
            console.error("Error in getRecentActivity:", error);
            return [];
        }
        finally {
            client.release();
        }
    }
    static async getActivity(startDate, endDate) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT 
          kl.*,
          p.name as player_name,
          CASE 
            WHEN kl.match_id IS NOT NULL THEN 'match'
            WHEN kl.solo_comp_id IS NOT NULL THEN 'solo'
            ELSE 'unknown'
          END as competition_type,
          CASE 
            WHEN kl.match_id IS NOT NULL THEN m.name
            WHEN kl.solo_comp_id IS NOT NULL THEN sc.name
            ELSE 'Unknown'
          END as competition_name
        FROM kick_log kl
        JOIN players p ON kl.player_id = p.id
        LEFT JOIN matches m ON kl.match_id = m.id
        LEFT JOIN solo_competitions sc ON kl.solo_comp_id = sc.id
        WHERE kl.created_at >= $1 AND kl.created_at <= $2
        ORDER BY kl.created_at DESC
      `;
            const result = await client.query(query, [startDate, endDate]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
}
exports.KickLog = KickLog;
