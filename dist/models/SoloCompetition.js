"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoloCompetition = void 0;
const db_1 = require("../config/db");
class SoloCompetition {
    static async create(competitionData) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        INSERT INTO solo_competitions (name, description, max_participants, scheduled_start, location, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
            const values = [
                competitionData.name,
                competitionData.description,
                competitionData.max_participants || 50,
                competitionData.scheduled_start,
                competitionData.location,
                competitionData.created_by,
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
        SELECT sc.*, 
               COUNT(sp.id) as participant_count,
               COUNT(CASE WHEN sp.is_active = true THEN 1 END) as active_participants
        FROM solo_competitions sc
        LEFT JOIN solo_participants sp ON sc.id = sp.solo_competition_id
        WHERE sc.id = $1
        GROUP BY sc.id
      `;
            const result = await client.query(query, [id]);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    static async findAll(limit = 50) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT sc.*, 
               COUNT(sp.id) as participant_count,
               COUNT(CASE WHEN sp.is_active = true THEN 1 END) as active_participants
        FROM solo_competitions sc
        LEFT JOIN solo_participants sp ON sc.id = sp.solo_competition_id
        GROUP BY sc.id
        ORDER BY sc.created_at DESC
        LIMIT $1
      `;
            const result = await client.query(query, [limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async findByStatus(status) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT 
          sc.*,
          COUNT(sp.player_id) as participant_count
        FROM solo_competitions sc
        LEFT JOIN solo_participants sp ON sc.id = sp.solo_competition_id
        WHERE sc.status = $1
        GROUP BY sc.id
        ORDER BY sc.created_at DESC
      `;
            const result = await client.query(query, [status]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async getRecent(limit = 10) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT 
          sc.*,
          COUNT(sp.player_id) as participant_count
        FROM solo_competitions sc
        LEFT JOIN solo_participants sp ON sc.id = sp.solo_competition_id
        GROUP BY sc.id
        ORDER BY sc.created_at DESC
        LIMIT $1
      `;
            const result = await client.query(query, [limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async updateStatus(id, status, staffId) {
        const client = await db_1.pool.connect();
        try {
            let query = "UPDATE solo_competitions SET status = $1, updated_at = CURRENT_TIMESTAMP";
            let values = [status, id];
            if (status === "active") {
                query += ", actual_start = CURRENT_TIMESTAMP";
            }
            else if (status === "completed") {
                query += ", completed_at = CURRENT_TIMESTAMP";
            }
            query += " WHERE id = $2 RETURNING *";
            const result = await client.query(query, values);
            return result.rows[0] || null;
        }
        finally {
            client.release();
        }
    }
    static async addParticipant(competitionId, playerId) {
        const client = await db_1.pool.connect();
        try {
            // Check if competition is not full and is open for participation
            const competitionQuery = `
        SELECT sc.max_participants, COUNT(sp.id) as current_participants
        FROM solo_competitions sc
        LEFT JOIN solo_participants sp ON sc.id = sp.solo_competition_id
        WHERE sc.id = $1 AND sc.status IN ('scheduled', 'active')
        GROUP BY sc.id, sc.max_participants
      `;
            const competitionResult = await client.query(competitionQuery, [
                competitionId,
            ]);
            if (competitionResult.rows.length === 0) {
                return false; // Competition not found or not accepting participants
            }
            const { max_participants, current_participants } = competitionResult.rows[0];
            if (current_participants >= max_participants) {
                return false; // Competition is full
            }
            const query = `
        INSERT INTO solo_participants (solo_competition_id, player_id)
        VALUES ($1, $2)
        ON CONFLICT (solo_competition_id, player_id) DO NOTHING
      `;
            await client.query(query, [competitionId, playerId]);
            return true;
        }
        catch (error) {
            console.error("Error adding solo competition participant:", error);
            return false;
        }
        finally {
            client.release();
        }
    }
    static async getParticipants(competitionId) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT sp.*, p.name as player_name, p.photo_path
        FROM solo_participants sp
        JOIN players p ON sp.player_id = p.id
        WHERE sp.solo_competition_id = $1
        ORDER BY sp.total_kicks_used DESC, sp.joined_at ASC
      `;
            const result = await client.query(query, [competitionId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    static async updateParticipantKicks(competitionId, playerId, kicksUsed) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        UPDATE solo_participants 
        SET kicks_remaining = GREATEST(0, kicks_remaining - $3),
            total_kicks_used = total_kicks_used + $3,
            is_active = CASE WHEN kicks_remaining - $3 <= 0 THEN false ELSE true END
        WHERE solo_competition_id = $1 AND player_id = $2
      `;
            await client.query(query, [competitionId, playerId, kicksUsed]);
            return true;
        }
        catch (error) {
            console.error("Error updating solo participant kicks:", error);
            return false;
        }
        finally {
            client.release();
        }
    }
    static async getLeaderboard(competitionId) {
        const client = await db_1.pool.connect();
        try {
            const query = `
        SELECT p.name, p.photo_path,
               COUNT(kl.id) as total_kicks,
               SUM(kl.goals) as total_goals,
               ROUND(CASE 
                 WHEN COUNT(kl.id) > 0 THEN (SUM(kl.goals)::DECIMAL / COUNT(kl.id)) * 100 
                 ELSE 0 
               END, 2) as accuracy_percentage,
               sp.joined_at
        FROM solo_participants sp
        JOIN players p ON sp.player_id = p.id
        LEFT JOIN kick_log kl ON sp.player_id = kl.player_id 
                               AND kl.solo_competition_id = $1
        WHERE sp.solo_competition_id = $1
        GROUP BY p.id, p.name, p.photo_path, sp.joined_at
        ORDER BY total_goals DESC, accuracy_percentage DESC, sp.joined_at ASC
      `;
            const result = await client.query(query, [competitionId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
}
exports.SoloCompetition = SoloCompetition;
