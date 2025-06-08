import { pool } from '../config/db';

export interface IGameStat {
  id: number;
  player_id: number;
  goals: number;
  staff_id: number;
  location: string;
  competition_type?: string;
  queue_ticket_id?: number;
  requeued?: boolean;
  first_five_kicks?: boolean;
  player_gender?: string;
  player_age_bracket?: string;
  timestamp: Date;
}

class GameStat {
  // Execute a query directly
  static async query(text: string, params: any[]): Promise<any> {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Find game stats by player ID
  static async find(criteria: { player_id?: number }): Promise<IGameStat[]> {
    try {
      if (criteria.player_id) {
        const result = await pool.query('SELECT * FROM game_stats WHERE player_id = $1 ORDER BY timestamp DESC', [criteria.player_id]);
        return result.rows;
      }
      
      const result = await pool.query('SELECT * FROM game_stats ORDER BY timestamp DESC LIMIT 100');
      return result.rows;
    } catch (error) {
      console.error('Error finding game stats:', error);
      return [];
    }
  }

  // Create new game stat
  static async create(gameStatData: Omit<IGameStat, 'id' | 'timestamp'>): Promise<IGameStat | null> {
    try {
      const { 
        player_id, 
        goals, 
        staff_id, 
        location, 
        competition_type, 
        queue_ticket_id, 
        requeued,
        first_five_kicks,
        player_gender,
        player_age_bracket
      } = gameStatData;
      
      const result = await pool.query(
        `INSERT INTO game_stats 
         (player_id, goals, staff_id, location, competition_type, queue_ticket_id, requeued, first_five_kicks, player_gender, player_age_bracket) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING *`,
        [
          player_id, 
          goals, 
          staff_id, 
          location, 
          competition_type || 'accuracy', 
          queue_ticket_id, 
          requeued || false,
          first_five_kicks || false,
          player_gender,
          player_age_bracket
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating game stat:', error);
      return null;
    }
  }

  // Get leaderboard
  static async getLeaderboard(options: { 
    ageGroup?: string, 
    gender?: string, 
    residence?: string, 
    competitionType?: string,
    limit?: number
  }): Promise<any[]> {
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
      
      const params: any[] = [];
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
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Get staff activity
  static async getStaffActivity(date?: Date): Promise<any[]> {
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
      
      const result = await pool.query(query, [startOfDay, endOfDay]);
      return result.rows;
    } catch (error) {
      console.error('Error getting staff activity:', error);
      return [];
    }
  }

  // Get stats by competition type
  static async getStatsByCompetitionType(): Promise<any[]> {
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
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting stats by competition type:', error);
      return [];
    }
  }

  // Get stats by age group
  static async getStatsByAgeGroup(): Promise<any[]> {
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
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting stats by age group:', error);
      return [];
    }
  }
}

export default GameStat;