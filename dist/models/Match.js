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
exports.Match = void 0;
const db_1 = require("../config/db");
class Match {
    static create(matchData) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                const query = `
        INSERT INTO matches (name, match_type, team_a_id, team_b_id, scheduled_start, location, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
                const values = [
                    matchData.name,
                    matchData.match_type,
                    matchData.team_a_id,
                    matchData.team_b_id,
                    matchData.scheduled_start,
                    matchData.location,
                    matchData.created_by,
                ];
                const result = yield client.query(query, values);
                return result.rows[0];
            }
            finally {
                client.release();
            }
        });
    }
    static findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                const query = `
        SELECT m.*, 
               ta.name as team_a_name, 
               tb.name as team_b_name,
               COALESCE(sa.total_goals, 0) as team_a_score,
               COALESCE(sb.total_goals, 0) as team_b_score
        FROM matches m
        LEFT JOIN teams ta ON m.team_a_id = ta.id
        LEFT JOIN teams tb ON m.team_b_id = tb.id
        LEFT JOIN match_scores sa ON m.id = sa.match_id AND sa.team_id = m.team_a_id
        LEFT JOIN match_scores sb ON m.id = sb.match_id AND sb.team_id = m.team_b_id
        WHERE m.id = $1
      `;
                const result = yield client.query(query, [id]);
                return result.rows[0] || null;
            }
            finally {
                client.release();
            }
        });
    }
    static findAll() {
        return __awaiter(this, arguments, void 0, function* (limit = 50) {
            const client = yield db_1.pool.connect();
            try {
                const query = `
        SELECT m.*, 
               ta.name as team_a_name, 
               tb.name as team_b_name,
               COALESCE(sa.total_goals, 0) as team_a_score,
               COALESCE(sb.total_goals, 0) as team_b_score
        FROM matches m
        LEFT JOIN teams ta ON m.team_a_id = ta.id
        LEFT JOIN teams tb ON m.team_b_id = tb.id
        LEFT JOIN match_scores sa ON m.id = sa.match_id AND sa.team_id = m.team_a_id
        LEFT JOIN match_scores sb ON m.id = sb.match_id AND sb.team_id = m.team_b_id
        ORDER BY m.created_at DESC
        LIMIT $1
      `;
                const result = yield client.query(query, [limit]);
                return result.rows;
            }
            finally {
                client.release();
            }
        });
    }
    static findByStatus(status) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                // First check if match_participants table exists
                const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'match_participants'
        ) AS match_participants_exists
      `;
                const tableCheck = yield client.query(checkTableQuery);
                const { match_participants_exists } = tableCheck.rows[0];
                let query;
                if (match_participants_exists) {
                    // Original query if table exists
                    // Check if match_participants table has a goals column
                    const checkGoalsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'match_participants'
            AND column_name = 'goals'
          ) AS goals_column_exists
        `;
                    const goalsCheck = yield client.query(checkGoalsQuery);
                    const { goals_column_exists } = goalsCheck.rows[0];
                    if (goals_column_exists) {
                        query = `
            SELECT 
              m.*,
              ta.name as team_a_name,
              tb.name as team_b_name,
              COALESCE((
                SELECT SUM(COALESCE(mp.goals, 0))
                FROM match_participants mp
                WHERE mp.match_id = m.id AND mp.team_id = m.team_a_id
              ), 0) as team_a_score,
              COALESCE((
                SELECT SUM(COALESCE(mp.goals, 0))
                FROM match_participants mp
                WHERE mp.match_id = m.id AND mp.team_id = m.team_b_id
              ), 0) as team_b_score
            FROM matches m
            JOIN teams ta ON m.team_a_id = ta.id
            JOIN teams tb ON m.team_b_id = tb.id
            WHERE m.status = $1
            ORDER BY m.created_at DESC
          `;
                    }
                    else {
                        query = `
            SELECT 
              m.*,
              ta.name as team_a_name,
              tb.name as team_b_name,
              0 as team_a_score,
              0 as team_b_score
            FROM matches m
            JOIN teams ta ON m.team_a_id = ta.id
            JOIN teams tb ON m.team_b_id = tb.id
            WHERE m.status = $1
            ORDER BY m.created_at DESC
          `;
                    }
                }
                else {
                    // Fallback query without match_participants
                    query = `
          SELECT 
            m.*,
            ta.name as team_a_name,
            tb.name as team_b_name,
            0 as team_a_score,
            0 as team_b_score
          FROM matches m
          JOIN teams ta ON m.team_a_id = ta.id
          JOIN teams tb ON m.team_b_id = tb.id
          WHERE m.status = $1
          ORDER BY m.created_at DESC
        `;
                }
                const result = yield client.query(query, [status]);
                return result.rows;
            }
            finally {
                client.release();
            }
        });
    }
    static getRecent() {
        return __awaiter(this, arguments, void 0, function* (limit = 10) {
            const client = yield db_1.pool.connect();
            try {
                // First check if match_participants table exists
                const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'match_participants'
        ) AS match_participants_exists
      `;
                const tableCheck = yield client.query(checkTableQuery);
                const { match_participants_exists } = tableCheck.rows[0];
                let query;
                if (match_participants_exists) {
                    // Check if match_participants table has a goals column
                    const checkGoalsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'match_participants'
            AND column_name = 'goals'
          ) AS goals_column_exists
        `;
                    const goalsCheck = yield client.query(checkGoalsQuery);
                    const { goals_column_exists } = goalsCheck.rows[0];
                    if (goals_column_exists) {
                        // Original query if table and column exist
                        query = `
            SELECT 
              m.*,
              ta.name as team_a_name,
              tb.name as team_b_name,
              COALESCE((
                SELECT SUM(COALESCE(mp.goals, 0))
                FROM match_participants mp
                WHERE mp.match_id = m.id AND mp.team_id = m.team_a_id
              ), 0) as team_a_score,
              COALESCE((
                SELECT SUM(COALESCE(mp.goals, 0))
                FROM match_participants mp
                WHERE mp.match_id = m.id AND mp.team_id = m.team_b_id
              ), 0) as team_b_score
            FROM matches m
            JOIN teams ta ON m.team_a_id = ta.id
            JOIN teams tb ON m.team_b_id = tb.id
            ORDER BY m.created_at DESC
            LIMIT $1
          `;
                    }
                    else {
                        // Fallback if goals column doesn't exist
                        query = `
            SELECT 
              m.*,
              ta.name as team_a_name,
              tb.name as team_b_name,
              0 as team_a_score,
              0 as team_b_score
            FROM matches m
            JOIN teams ta ON m.team_a_id = ta.id
            JOIN teams tb ON m.team_b_id = tb.id
            ORDER BY m.created_at DESC
            LIMIT $1
          `;
                    }
                }
                else {
                    // Fallback query without match_participants
                    query = `
          SELECT 
            m.*,
            ta.name as team_a_name,
            tb.name as team_b_name,
            0 as team_a_score,
            0 as team_b_score
          FROM matches m
          JOIN teams ta ON m.team_a_id = ta.id
          JOIN teams tb ON m.team_b_id = tb.id
          ORDER BY m.created_at DESC
          LIMIT $1
        `;
                }
                const result = yield client.query(query, [limit]);
                return result.rows;
            }
            finally {
                client.release();
            }
        });
    }
    static updateStatus(id, status, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                let query = "UPDATE matches SET status = $1, updated_at = CURRENT_TIMESTAMP";
                let values = [status, id];
                if (status === "active") {
                    query += ", actual_start = CURRENT_TIMESTAMP";
                }
                else if (status === "completed") {
                    query += ", completed_at = CURRENT_TIMESTAMP";
                }
                query += " WHERE id = $2 RETURNING *";
                const result = yield client.query(query, values);
                return result.rows[0] || null;
            }
            finally {
                client.release();
            }
        });
    }
    static addParticipant(matchId, teamId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                const query = `
        INSERT INTO match_participants (match_id, team_id, player_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (match_id, player_id) DO NOTHING
      `;
                yield client.query(query, [matchId, teamId, playerId]);
                return true;
            }
            catch (error) {
                console.error("Error adding match participant:", error);
                return false;
            }
            finally {
                client.release();
            }
        });
    }
    static getParticipants(matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                const query = `
        SELECT mp.*, p.name as player_name, t.name as team_name
        FROM match_participants mp
        JOIN players p ON mp.player_id = p.id
        JOIN teams t ON mp.team_id = t.id
        WHERE mp.match_id = $1 AND mp.is_active = true
        ORDER BY t.name, p.name
      `;
                const result = yield client.query(query, [matchId]);
                return result.rows;
            }
            finally {
                client.release();
            }
        });
    }
    static updateParticipantKicks(matchId, playerId, kicksUsed) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.pool.connect();
            try {
                const query = `
        UPDATE match_participants 
        SET kicks_remaining = GREATEST(0, kicks_remaining - $3),
            total_kicks_used = total_kicks_used + $3,
            is_active = CASE WHEN kicks_remaining - $3 <= 0 THEN false ELSE true END
        WHERE match_id = $1 AND player_id = $2
      `;
                yield client.query(query, [matchId, playerId, kicksUsed]);
                return true;
            }
            catch (error) {
                console.error("Error updating participant kicks:", error);
                return false;
            }
            finally {
                client.release();
            }
        });
    }
}
exports.Match = Match;
